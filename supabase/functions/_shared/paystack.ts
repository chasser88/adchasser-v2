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
 * NEVER call fetch() against api.paystack.co directly — always go through
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

// ── Paystack API response shapes ──────────────────────────────────

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
  recipient_code: string; // RCP_xxxxxxxxxx
  type: string; // 'nuban'
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

// ── Client ────────────────────────────────────────────────────────

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

  /**
   * Resolves a Nigerian bank account.
   * Confirms the account number is valid and returns the official account name.
   *
   * Endpoint: GET /bank/resolve
   * Docs: https://paystack.com/docs/api/verification/#resolve-account
   */
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

  /**
   * Creates a transfer recipient. Required before a transfer can be initiated
   * to a given account.
   *
   * Endpoint: POST /transferrecipient
   * Docs: https://paystack.com/docs/api/transfer-recipient/#create
   */
  async createTransferRecipient(
    input: CreateTransferRecipientRequest,
  ): Promise<CreateTransferRecipientResponse> {
    return await this.request<CreateTransferRecipientResponse>(
      'POST',
      '/transferrecipient',
      input,
    );
  }

  // ── Internal request method ─────────────────────────────────────

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
    } catch (err) {
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
      // Paystack returns 4xx with { status: false, message: '...' }
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
