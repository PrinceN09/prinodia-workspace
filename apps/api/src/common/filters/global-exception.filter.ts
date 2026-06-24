import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
// eslint-disable-next-line import/no-named-as-default
import pino from "pino";

import type { Request, Response } from "express";

/**
 * Consistent error response shape for all API errors.
 * Every field is always present so clients can rely on the contract.
 */
export interface ApiErrorResponse {
  /** HTTP status code (mirrors the response status). */
  statusCode: number;
  /** Machine-readable error code (e.g., "UNAUTHORIZED", "INSUFFICIENT_PERMISSIONS"). */
  error: string;
  /** Human-readable message (English; UI must translate). */
  message: string | string[];
  /** ISO 8601 UTC timestamp of when the error occurred. */
  timestamp: string;
  /** Request path that produced the error. */
  path: string;
  /** Unique request ID for log correlation — matches X-Request-ID response header. */
  requestId: string;
}

const logger = pino({
  base: { service: "govsphere-api", context: "GlobalExceptionFilter" },
  level: process.env["LOG_LEVEL"] ?? "info",
});

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const requestId = request.requestId ?? "unknown";

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = "INTERNAL_SERVER_ERROR";
    let message: string | string[] = "An unexpected error occurred";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const body = exceptionResponse as Record<string, unknown>;
        error = (body["error"] as string | undefined) ?? exception.name;
        // ValidationPipe returns message as string[], preserve that for clients
        const rawMessage = body["message"];
        message = Array.isArray(rawMessage)
          ? (rawMessage as string[])
          : ((rawMessage as string | undefined) ?? exception.message);
      } else {
        error = exception.name;
        message = String(exceptionResponse);
      }
    } else if (exception instanceof Error) {
      // Unhandled / unexpected error — log with stack trace for debugging
      logger.error(
        {
          requestId,
          path: request.url,
          method: request.method,
          err: {
            name: exception.name,
            message: exception.message,
            stack: exception.stack,
          },
        },
        "Unhandled exception",
      );
    } else {
      logger.error({ requestId, exception }, "Unknown exception type thrown");
    }

    const errorBody: ApiErrorResponse = {
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    response.status(status).json(errorBody);
  }
}
