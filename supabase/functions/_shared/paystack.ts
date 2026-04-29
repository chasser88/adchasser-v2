/**
 * Paystack API client for AdChasser Edge Functions.
 *
 * Wraps Paystack's REST API with:
 *   - Typed request/response interfaces
 *   - Proper authentication (sk_test_ / sk_live_ from env)
 *   - Timeouts (15s hard limit)
 *   - Error mapping (Paystack 4xx -> typed PaystackError)
 *   - Network failure handling -> PaystackUnavailableError
 *
 * NEVER call fetch() against api.paystack.co directly - always go through
 * this client so errors are uniform and credentials never leak.
 */

import {
  PaystackError,
  PaystackUnavailableError,
  InternalError,
  type ErrorCode,
} from './errors.ts';
import type { Logger } from './logger.ts';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const REQUEST_TIMEOUT_MS = 15_000;

// aPaystack API response shapes

export interface PaystackEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface ResolveAccountResponse {
  account_number: string;
  account_name: string;
  bank_id: number;
}

export interface CreateTransferRecipientResponse {
  active: boolean;
  createdAt: string;
  currency: string;
  domain: string;
  id: number;
  integration: number;
  name: string;
  recipient_code: string;
  type: string;
  updatedAt: string;
  is_deleted: boolean;
  details: {
    authorization_code: string | null;
    account_number: string;
    account_name: string | null;
    bank_code: string;
    bank_name: string;
  };
}

export interface CreateTransferRecipientRequest {
  type: 'nuban';
  name: string;
  account_number: string;
  bank_code: string;
  currency: 'NGN';
}

export interface InitializeTransactionRequest {
  email: string;
  amount: number; // in kobo
  reference?: string;
  callback_url?: string;
  channels: Array<'card' | 'bank' | 'bank_transfer' | 'ussd' | 'qr' | 'mobile_money'>;
  currency: 'NGN';
  metadata?: Record<string, unknown>;
}

export interface InitializeTransactionResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface CreateCustomerRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateCustomerResponse {
  id: number;
  customer_code: string; // CUS_xxxxxx
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  metadata: Record<string, unknown> | null;
  domain: string;
}

export interface CreateDedicatedAccountRequest {
  customer: string; // customer_code (CUS_xxx) or email
  preferred_bank?: string; // e.g. 'wema-bank', defaults to Paystack's test bank
}

export interface CreateDedicatedAccountResponse {
  bank: {
    name: string;
    id: number;
    slug: string;
  };
  account_name: string;
  account_number: string;
  assigned: boolean;
  currency: string;
  active: boolean;
  id: number;
  created_at: string;
  updated_at: string;
  assignment: {
    integration: number;
    assignee_id: number;
    assignee_type: string;
    expired: boolean;
    account_type: string;
  };
}

// Client

export class PaystackClient {
  private readonly secretKey: string;
  private readonly logger: Logger;

  constructor(logger: Logger) {
    const key = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!key || key.length === 0) {
      throw new InternalError('PAYSTACK_SECRET_KEY is not configured');
    }
    this.secretKey = key;
    this.logger = logger;
  }

  /** GET /bank/resolve */
  async resolveAccount(input: {
    accountNumber: string;
    bankCode: string;
  }): Promise<ResolveAccountResponse> {
    const params = new URLSearchParams({
      account_number: input.accountNumber,
      bank_code: input.bankCode,
    });
    return await this.request<ResolveAccountResponse>(
      'GET',
      `/bank/resolve?${params.toString()}`,
    );
  }

  /** POST /transferrecipient */
  async createTransferRecipient(
    input: CreateTransferRecipientRequest,
  ): Promise<CreateTransferRecipientResponse> {
    return await this.request<CreateTransferRecipientResponse>(
      'POST',
      '/transferrecipient',
      input,
    );
  }

  /** POST /transaction/initialize - for Paystack Inline checkout */
  async initializeTransaction(
    input: InitializeTransactionRequest,
  ): Promise<InitializeTransactionResponse> {
    return await this.request<InitializeTransactionResponse>(
      'POST',
      '/transaction/initialize',
      input,
    );
  }

  /** POST /customer - creates a Paystack customer record (needed for DVA) */
  async createCustomer(
    input: CreateCustomerRequest,
  ): Promise<CreateCustomerResponse> {
    return await this.request<CreateCustomerResponse>(
      'POST',
      '/customer',
      input,
    );
  }

  /** POST /dedicated_account - creates a virtual NUBAN for a customer */
  async createDedicatedAccount(
    input: CreateDedicatedAccountRequest,
  ): Promise<CreateDedicatedAccountResponse> {
    return await this.request<CreateDedicatedAccountResponse>(
      'POST',
      '/dedicated_account',
      input,
    );
  }

  // Internal request method

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${PAYSTACK_BASE_URL}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const startMs = Date.now();
    let response: Response;
    try {
      response = await fetch(url, {
        method,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      clearTimeout(timeout);
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      this.logger.error('Paystack request failed (network)', {
        path,
        method,
        durationMs: Date.now() - startMs,
        reason: isAbort ? 'timeout' : 'network',
        error: err instanceof Error ? err.message : String(err),
      });
      throw new PaystackUnavailableError(
        isAbort ? 'Paystack request timed out' : 'Could not reach Paystack',
      );
    }
    clearTimeout(timeout);

    const durationMs = Date.now() - startMs;

    let envelope: PaystackEnvelope<T>;
    try {
      envelope = await response.json() as PaystackEnvelope<T>;
    } catch (_err) {
      this.logger.error('Paystack returned non-JSON response', {
        path,
        method,
        status: response.status,
        durationMs,
      });
      throw new PaystackError('Paystack returned an unexpected response', {
        status: response.status,
      });
    }

    this.logger.info('Paystack request complete', {
      path,
      method,
      status: response.status,
      durationMs,
      paystackStatus: envelope.status,
    });

    if (!response.ok || !envelope.status) {
      const code: ErrorCode = response.status >= 500
        ? 'PAYSTACK_UNAVAILABLE'
        : 'PAYSTACK_ERROR';
      const ErrorClass = response.status >= 500
        ? PaystackUnavailableError
        : PaystackError;
      throw new ErrorClass(envelope.message ?? 'Paystack request failed', {
        httpStatus: response.status,
        paystackMessage: envelope.message,
        code,
      });
    }

    return envelope.data;
  }
}
