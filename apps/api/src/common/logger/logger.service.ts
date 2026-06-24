/**
 * GovSphere — Structured Logger Service
 *
 * Wraps pino for structured JSON logging with:
 *   - Request ID correlation (set per-request from X-Request-ID header or UUID)
 *   - Context tagging (NestJS class/method context)
 *   - Log levels mapped to Pino's levels
 *   - Loki-compatible JSON output (level, msg, requestId, context, timestamp)
 *
 * Usage:
 *   private readonly logger = new AppLogger(MyService.name);
 *   this.logger.log('User logged in', { userId });
 */

import { Injectable, LoggerService, Scope } from "@nestjs/common";
import pino from "pino";

// Re-export so callers can use this type without importing pino directly
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

const pinoLogger = pino({
  level: (process.env["LOG_LEVEL"] as LogLevel | undefined) ?? "info",
  base: {
    service: "govsphere-api",
    env: process.env["NODE_ENV"] ?? "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      // Output "level": "info" instead of "level": 30 for Loki compatibility
      return { level: label };
    },
  },
});

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, meta?: Record<string, unknown>): void {
    pinoLogger.info({ context: this.context, ...meta }, message);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    pinoLogger.error({ context: this.context, ...meta }, message);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    pinoLogger.warn({ context: this.context, ...meta }, message);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    pinoLogger.debug({ context: this.context, ...meta }, message);
  }

  verbose(message: string, meta?: Record<string, unknown>): void {
    pinoLogger.trace({ context: this.context, ...meta }, message);
  }

  fatal(message: string, meta?: Record<string, unknown>): void {
    pinoLogger.fatal({ context: this.context, ...meta }, message);
  }
}
