/**
 * initialize-payment
 * -----------------------------------------------------------------------------------------
 * Called by the brand dashboard when a brand clicks "Launch Campaign".
 *
 * Flow:
 *   1. Authenticate the caller
 *   2. Validate input (campaignId, paymentMethod)
 *   3. Load campaign, check ownership, check state == 'draft'
 *   4. Calculate price (pricing.ts)
 *   5. Lock pricing + transition to 'pending_payment'
 *   6. Branch:
 *       - Super admin: skip payment, go straight to active
 *       - Card: init Paystack transaction, return access code
 *       - Transfer: create Paystack customer + DVA, return account details
 */

import { z } from 'zod';

import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import {
  NotFoundError,
  UnauthorizedError,
  BusinessRuleError,
  DatabaseError,
  ValidationError,
} from '../_shared/errors.ts';
import {
  createLoggerFromRequest,
  type Logger,
} from '../_shared/logger.ts';
import { PaystackClient } from '../_shared/paystack.ts';
import { calculateCampaignPricing } from '../_shared/pricing.ts';
import { jsonOk, jsonError } from '../_shared/response.ts';
import {
  createUserClient,
  createServiceClient,
} from '../_shared/supabase.ts';
import { requireUser } from '../_shared/auth.ts';
import {
  parseOrThrow,
  readJsonBody,
  UuidSchema,
} from '../_shared/validation.ts';

// Super admin UUID (mirrors RLS policies)
const SUPER_ADMIN_UUID = '4a05e9c5-005b-4dba-8160-5b3354c5df37';

// Input schema
const InputSchema = z.object({
  campaignId: UuidSchema,
  paymentMethod: z.enum(['card', 'transfer']),
});

// Output types
interface PricingOut {
  requiredSampleSize: number;
  targetSampleSize: number;
  respondentCostKobo: number;
  platformBaseFeeKobo: number;
  totalPriceKobo: number;
  confidenceLevel: number;
  marginOfError: number;
}

interface SkippedResult {
  paymentMethod: 'skipped';
  campaignStatus: 'active';
  pricing: PricingOut;
}

interface CardResult {
  paymentMethod: 'card';
  accessCode: string;
  reference: string;
  amountKobo: number;
  pricing: PricingOut;
}

interface TransferResult {
  paymentMethod: 'transfer';
  reference: string;
  amountKobo: number;
  pricing: PricingOut;
  virtualAccount: {
    assigned: boolean;
    accountNumber: string | null;
    accountName: string | null;
    bankName: string | null;
    customerCode: string;
  };
}

type Result = SkippedResult | CardResult | TransferResult;

Deno.serve(async (req) => {
  const logger = createLoggerFromRequest(req, 'initialize-payment');

  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);

  if (req.method !== 'POST') {
    return jsonError(req, logger, new ValidationError(
      `Method ${req.method} is not allowed; use POST`,
    ));
  }

  try {
    // 1. Parse + validate input
    const body = await readJsonBody(req);
    const input = parseOrThrow(InputSchema, body);

    // 2. Authenticate
    const userClient = createUserClient(req);
    const user = await requireUser(userClient);

    const reqLogger = logger.child({
      userId: user.id,
      campaignId: input.campaignId,
      paymentMethod: input.paymentMethod,
    });

    const isSuperAdmin = user.id === SUPER_ADMIN_UUID;
    reqLogger.info('Initializing payment', { isSuperAdmin });

    // 3. Load campaign and verify ownership + state
    const serviceClient = createServiceClient();
    const campaign = await loadCampaign(serviceClient, input.campaignId);

    if (!isSuperAdmin && campaign.user_id !== user.id) {
      throw new UnauthorizedError('You do not own this campaign');
    }

    if (campaign.status !== 'draft') {
      throw new BusinessRuleError(
        'INVALID_CAMPAIGN_STATE',
        `Campaign must be in draft state (currently: ${campaign.status})`,
        { currentStatus: campaign.status },
      );
    }

    if (!campaign.planned_reach || campaign.planned_reach <= 0) {
      throw new BusinessRuleError(
        'MISSING_PLANNED_REACH',
        'Campaign must have a planned_reach (population size) before launch',
      );
    }

    // 4. Calculate pricing
    const pricing = await calculateCampaignPricing(serviceClient, campaign.planned_reach);
    reqLogger.info('Calsulated pricing', {
      population: campaign.planned_reach,
      requiredSampleSize: pricing.requiredSampleSize,
      targetSampleSize: pricing.targetSampleSize,
      totalPriceKobo: pricing.totalPriceKobo,
    });

    if (pricing.totalPriceKobo <= 0) {
      throw new BusinessRuleError('INVALID_AMOUNT', 'Calculated price is not positive');
    }

    // 5. Lock pricing + transition state
    const targetStatus = isSuperAdmin ? 'active' : 'pending_payment';
    const updateRes = await serviceClient
      .from('campaigns')
      .update({
        target_sample_size: pricing.targetSampleSize,
        price_kobo: pricing.totalPriceKobo,
        status: targetStatus,
      })
      .eq('id', campaign.id)
      .eq('status', 'draft') // guard against concurrent state change
      .select('id, status')
      .maybeSingle();

    if (updateRes.error) {
      throw new DatabaseError('Failed to lock campaign pricing', {
        message: updateRes.error.message,
        code: updateRes.error.code,
      });
    }

    if (!updateRes.data) {
      throw new BusinessRuleError(
        'INVALID_CAMPAIGN_STATE',
        'Campaign state changed during initialization; please reload and try again',
      );
    }

    reqLogger.info('Campaign state transitioned', { newStatus: targetStatus });

    // 6. Branch
    const pricingOut: PricingOut = {
      requiredSampleSize: pricing.requiredSampleSize,
      targetSampleSize: pricing.targetSampleSize,
      respondentCostKobo: pricing.respondentCostKobo,
      platformBaseFeeKobo: pricing.platformBaseFeeKobo,
      totalPriceKobo: pricing.totalPriceKobo,
      confidenceLevel: pricing.confidenceLevel,
      marginOfError: pricing.marginOfError,
    };

    if (isSuperAdmin) {
      reqLogger.info('Super admin bypass - campaign activated without payment');
      const result: SkippedResult = {
        paymentMethod: 'skipped',
        campaignStatus: 'active',
        pricing: pricingOut,
      };
      return jsonOk(req, getRequestId(reqLogger), result);
    }

    // Generate unique paystack reference
    const reference = `ADCH-${campaign.id.slice(0, 8)}-${Date.now()}`;

    const paystack = new PaystackClient(reqLogger);

    if (input.paymentMethod === 'card') {
      const initialized = await paystack.initializeTransaction({
        email: user.email ?? '',
        amount: pricing.totalPriceKobo,
        reference,
        currency: 'NGN',
        channels: ['card'],
        metadata: {
          campaign_Id: campaign.id,
          user_id: user.id,
        },
      });

      await createBrandPayment(
        serviceClient,
        reqLogger,
        {
          userId: user.id,
          campaignId: campaign.id,
          amountKobo: pricing.totalPriceKobo,
          reference,
          accessCode: initialized.access_code,
          paymentMethod: 'card',
          customerEmail: user.email ?? null,
          metadata: { paystackRef: initialized.reference },
        },
      );

      const result: CardResult = {
        paymentMethod: 'card',
        accessCode: initialized.access_code,
        reference,
        amountKobo: pricing.totalPriceKobo,
        pricing: pricingOut,
      };
      return jsonOk(req, getRequestId(reqLogger), result);
    }

    // Transfer/DVA path
    const customer = await paystack.createCustomer({
      email: user.email ?? `brand-${user.id}@adchasser.com`,
      metadata: { campaign_id: campaign.id, user_id: user.id },
    });

    const dva = await paystack.createDedicatedAccount({
      customer: customer.customer_code,
      preferred_bank: 'wema-bank',
    });

    await createBrandPayment(
      serviceClient,
      reqLogger,
      {
        userId: user.id,
        campaignId: campaign.id,
        amountKobo: pricing.totalPriceKobo,
        reference,
        paymentMethod: 'transfer',
        customerEmail: user.email ?? null,
        metadata: {
          customerCode: customer.customer_code,
          dvaAccountNumber: dva.account_number ?? null,
          dvaAssigned: dva.assigned,
          bunkName: dva.bank?.name ?? null,
        },
      },
    );

    const result: TransferResult = {
      paymentMethod: 'transfer',
      reference,
      amountKobo: pricing.totalPriceKobo,
      pricing: pricingOut,
      virtualAccount: {
        assigned: dva.assigned,
        accountNumber: dva.account_number ?? null,
        accountName: dva.account_name ?? null,
        bankName: dva.bank?.name ?? null,
        customerCode: customer.customer_code,
      },
    };
    return jsonOk(req, getRequestId(reqLogger), result);
  } catch (err) {
    return jsonError(req, logger, err);
  }
});

// Helpers

function getRequestId(logger: Logger): string {
  return (logger as unknown as { requestId: string }).requestId;
}

interface CampaignRow {
  id: string;
  user_id: string | null;
  brand_id: string | null;
  name: string;
  status: string;
  planned_reach: number | null;
}

async function loadCampaign(
  // deno-lint-ignore no-explicit-any
  client: any,
  campaignId: string,
): Promise<CampaignRow> {
  const { data, error } = await client
    .from('campaigns')
    .select('id, user_id, brand_id, name, status, planned_reach')
    .eq('id', campaignId)
    .maybeSingle();

  if (error) {
    throw new DatabaseError('Failed to load campaign', {
      message: error.message,
      code: error.code,
    });
  }
  if (!data) {
    throw new NotFoundError('CAMPAIGN_NOT_FOUND', `Campaign ${campaignId} does not exist`);
  }
  return data as CampaignRow;
}

interface CreateBrandPaymentInput {
  userId: string;
  campaignId: string;
  amountKobo: number;
  reference: string;
  accessCode?: string;
  paymentMethod: 'card' | 'transfer';
  customerEmail: string | null;
  metadata?: Record<string, unknown>;
}

async function createBrandPayment(
  // deno-lint-ignore no-explicit-any
  client: any,
  _logger: Logger,
  input: CreateBrandPaymentInput,
): Promise<void> {
  const { error } = await client
    .from('brand_payments')
    .insert({
      user_id: input.userId,
      campaign_id: input.campaignId,
      amount_kobo: input.amountKobo,
      currency: 'NGN',
      status: 'processing',
      paystack_reference: input.reference,
      paystack_access_code: input.accessCode ?? null,
      payment_method: input.paymentMethod,
      customer_email: input.customerEmail,
      metadata: input.metadata ?? {},
    });

  if (error) {
    throw new DatabaseError('Failed to create brand_payments row', {
      message: error.message,
      code: error.code,
    });
  }
}
