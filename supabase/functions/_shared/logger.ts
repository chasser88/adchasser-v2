/**
 * Structured logger for AdChasser Edge Functions.
 *
 * Every log line is a single JSON object with:
 *   - timestamp (ISO 8601)
 *   - level (debug | info | warn | error)
 *   - requestId (UUID, traces request across services)
 *   - functionName (which edge function)
 *   - message (human readable)
 *   - context (any structured data)
 *
 * Use logger.child({ ...moreContext }) to add context that propagates to all
 * subsequent log calls — useful for adding userId, respondentId, etc. once at
 * the top of a request and not having to repeat it.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LoggerOptions {
  functionName: string;
  requestId: string;
  context?: LogContext;
}

export class Logger {
  private readonly functionName: string;
  private readonly requestId: string;
  private readonly context: LogContext;

  constructor(options: LoggerOptions) {
    this.functionName = options.functionName;
    this.requestId = options.requestId;
    this.context = options.context ?? {};
  }

  child(extraContext: LogContext): Logger {
    return new Logger({
      functionName: this.functionName,
      requestId: this.requestId,
      context: { ...this.context, ...extraContext },
    });
  }

  debug(message: string, extra?: LogContext): void {
    this.log('debug', message, extra);
  }

  info(message: string, extra?: LogContext): void {
    this.log('info', message, extra);
  }

  warn(message: string, extra?: LogContext): void {
    this.log('warn', message, extra);
  }

  error(message: string, extra?: LogContext): void {
    this.log('error', message, extra);
  }

  private log(level: LogLevel, message: string, extra?: LogContext): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      requestId: this.requestId,
      functionName: this.functionName,
      message,
      ...this.context,
      ...extra,
    };
    // Edge runtime captures console.log by default.
    // Using stderr for warn/error helps with log routing if we add a sink.
    if (level === 'error' || level === 'warn') {
      console.error(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }
}

/**
 * Generates a UUID v4 for request tracing.
 * Uses crypto.randomUUID() which is available in Deno runtime.
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Creates a logger from an incoming request.
 * If the request has an X-Request-Id header, we honor it (good for tracing
 * across services). Otherwise we generate a new UUID.
 */
export function createLoggerFromRequest(req: Request, functionName: string): Logger {
  const incomingRequestId = req.headers.get('x-request-id');
  const requestId = incomingRequestId && isValidUuid(incomingRequestId)
    ? incomingRequestId
    : generateRequestId();
  return new Logger({ functionName, requestId });
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
