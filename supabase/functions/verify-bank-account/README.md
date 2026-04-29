# verify-bank-account

Verifies a Nigerian bank account with Paystack and saves it as a payment method
for a respondent. Required before any withdrawal can be initiated.

## Endpoint
## Authentication

Requires a valid Supabase JWT in the `Authorization: Bearer <token>` header.
The caller must have a respondent profile (i.e., have completed onboarding).

## Request

### Headers

| Header           | Required | Description                                    |
|------------------|----------|------------------------------------------------|
| `Authorization`  | Yes      | `Bearer <supabase_jwt>`                        |
| `Content-Type`   | Yes      | `application/json`                             |
| `x-request-id`   | No       | Caller-supplied UUID for tracing (auto-gen'd if absent) |

### Body

```json
{
  "bankCode": "058",
  "accountNumber": "0123456789",
  "bankName": "Guaranty Trust Bank"
}
```

| Field           | Type   | Validation                                  |
|-----------------|--------|---------------------------------------------|
| `bankCode`      | string | 3-6 digit numeric (Paystack bank code)      |
| `accountNumber` | string | Exactly 10 digits (NUBAN)                   |
| `bankName`      | string | 1-120 chars, human-readable bank name       |

## Responses

### 200 OK — Success

```json
{
  "ok": true,
  "data": {
    "paymentMethodId": "550e8400-e29b-41d4-a716-446655440000",
    "recipientCode": "RCP_a1b2c3d4e5f6g7h",
    "accountName": "IKPE CHARLES SOMTOCHUKWU",
    "accountNumber": "0123456789",
    "bankCode": "058",
    "bankName": "Guaranty Trust Bank",
    "isDefault": true,
    "verifiedAt": "2026-04-29T01:00:00.000Z"
  },
  "requestId": "uuid"
}
```

`accountName` is the **official name from Paystack**, not what the user typed.
The frontend should display this name and prompt the user to confirm before
proceeding (e.g., "We confirmed this account belongs to IKPE CHARLES
SOMTOCHUKWU. Is that you?").

### 4xx / 5xx — Error

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "status": 400,
    "details": { "issues": [...] },
    "requestId": "uuid"
  }
}
```

| HTTP | Code                    | When                                             |
|------|-------------------------|--------------------------------------------------|
| 400  | `VALIDATION_ERROR`      | Body missing/malformed, fields fail validation   |
| 401  | `UNAUTHENTICATED`       | No JWT or JWT invalid                            |
| 404  | `RESPONDENT_NOT_FOUND`  | Authenticated user has no respondent profile    |
| 409  | `DUPLICATE_RECIPIENT`   | DB unique constraint violated (race condition)  |
| 500  | `DATABASE_ERROR`        | Unexpected DB failure                            |
| 500  | `INTERNAL_ERROR`        | Unhandled exception                              |
| 502  | `PAYSTACK_ERROR`        | Paystack rejected (e.g., fake account)          |
| 503  | `PAYSTACK_UNAVAILABLE`  | Paystack timeout or network failure              |

## Idempotency

Calling this with the same `(respondent, bankCode, accountNumber)` more than
once is safe — the second call returns the existing row instead of charging
Paystack again or creating a duplicate.

## Side effects

On success:
- All other payment methods for the respondent are marked `is_active = false`
  and `is_default = false`.
- The new method is inserted with `is_active = true, is_default = true`.
- A Paystack transfer recipient is created (one-time, persists in Paystack).

## Local testing

```bash
# Start local Supabase if not already running
supabase start

# Serve this function locally
supabase functions serve verify-bank-account --no-verify-jwt

# In another terminal, call it
curl -X POST http://127.0.0.1:54321/functions/v1/verify-bank-account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <local-test-jwt>" \
  -d '{"bankCode":"058","accountNumber":"0123456789","bankName":"GTBank"}'
```

In Paystack TEST MODE, account number `0123456789` with bank code `058`
returns a known test response. Use this for verifying the happy path
without hitting real customer data.

## Environment variables

Required at runtime:

| Variable                     | Source                          |
|------------------------------|----------------------------------|
| `SUPABASE_URL`               | Set by Supabase Edge runtime    |
| `SUPABASE_ANON_KEY`          | Set by Supabase Edge runtime    |
| `SUPABASE_SERVICE_ROLE_KEY`  | Set by Supabase Edge runtime    |
| `PAYSTACK_SECRET_KEY`        | Manual: project secret (sk_test or sk_live) |

## Database tables touched

- `respondents` — read (auth resolution)
- `respondent_payment_methods` — update (deactivate old) + insert (new method)

## Future improvements

- [ ] Add bank-name validation against an allowlist (currently free-text from frontend)
- [ ] Rate limit by respondent_id (prevent enumeration of account numbers)
- [ ] Ledger entry for "payment method added" audit
- [ ] Webhook to alert respondent if their existing recipient_code is invalidated by Paystack
