import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import type { AuthenticatedUser } from "../types/auth.types";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @RequirePermissions() on this route — pass through
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({ error: "FORBIDDEN", message: "Access denied" });
    }

    const hasAll = required.every((perm) => user.permissions.includes(perm));

    if (!hasAll) {
      throw new ForbiddenException({
        error: "INSUFFICIENT_PERMISSIONS",
        message: `Required permissions: ${required.join(", ")}`,
      });
    }

    return true;
  }
}
