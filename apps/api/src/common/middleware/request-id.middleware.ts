/**
 * Request ID middleware.
 *
 * Assigns a unique ID to every incoming request.
 * Respects the X-Request-ID header from upstream proxies (e.g., NGINX, ALB).
 * If no header is present, generates a UUID v4.
 *
 * The ID is:
 *   - Set on request.requestId (accessible to controllers and services)
 *   - Forwarded in the X-Request-ID response header
 *   - Included in all structured log entries via AsyncLocalStorage (future)
 */

import { randomUUID } from "node:crypto";

import { Injectable, NestMiddleware } from "@nestjs/common";

import type { NextFunction, Request, Response } from "express";

// Augment Express Request type to include requestId
declare module "express" {
  interface Request {
    requestId: string;
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers["x-request-id"] as string | undefined) ?? randomUUID();

    req.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);

    next();
  }
}
