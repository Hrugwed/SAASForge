import pino, {
  type DestinationStream,
  type Logger,
  type LoggerOptions,
} from "pino";
import { z } from "zod";

const contextValueSchema = z.union([
  z.string().max(500),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const logContextSchema = z
  .object({
    requestId: z.string().max(160).optional(),
    userId: z.string().max(160).optional(),
    organizationId: z.string().max(160).optional(),
    operation: z.string().max(160).optional(),
  })
  .catchall(contextValueSchema);

export type LogContext = z.input<typeof logContextSchema>;

const redactPaths = [
  "password",
  "secret",
  "token",
  "apiKey",
  "authorization",
  "cookie",
  "req.headers.authorization",
  "req.headers.cookie",
  "request.headers.authorization",
  "request.headers.cookie",
  "*.password",
  "*.secret",
  "*.token",
  "*.apiKey",
] as const;

export function createLogger(options: {
  service: string;
  environment?: string;
  level?: string;
  destination?: DestinationStream;
}): Logger {
  const loggerOptions: LoggerOptions = {
    name: options.service,
    level: options.level ?? process.env.LOG_LEVEL ?? "info",
    base: {
      service: options.service,
      environment: options.environment ?? process.env.NODE_ENV ?? "development",
    },
    redact: { paths: [...redactPaths], censor: "[REDACTED]" },
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  return options.destination === undefined
    ? pino(loggerOptions)
    : pino(loggerOptions, options.destination);
}

export function withLogContext(logger: Logger, context: LogContext): Logger {
  return logger.child(logContextSchema.parse(context));
}

export interface ErrorReporter {
  captureException(
    error: unknown,
    context?: LogContext,
  ): string | undefined | Promise<string | undefined>;
}

export const noopErrorReporter: ErrorReporter = {
  captureException() {
    return undefined;
  },
};
