import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { AuthenticatedUser } from "../../common/types/auth.types";

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /** List all active sessions for the requesting user. */
  async findMyActiveSessions(userId: string): Promise<unknown[]> {
    return this.prisma.userSession.findMany({
      where: { userId, isActive: true },
      include: { device: { select: { name: true, platform: true, trusted: true } } },
      select: {
        id: true,
        platform: true,
        ipAddress: true,
        userAgent: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
        device: true,
      },
      orderBy: { lastUsedAt: "desc" },
    });
  }

  /** Revoke a specific session (user can only revoke their own). */
  async revokeSession(
    sessionId: string,
    requestingUser: AuthenticatedUser,
    ipAddress: string,
  ): Promise<void> {
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, userId: requestingUser.id },
    });

    if (!session) {
      throw new NotFoundException({ error: "SESSION_NOT_FOUND", message: "Session not found" });
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false, revokedAt: new Date() },
    });

    await this.auditService.log({
      userId: requestingUser.id,
      action: "SESSION_REVOKED",
      entityType: "SESSION",
      entityId: sessionId,
      metadata: { revokedBy: requestingUser.id },
      ipAddress,
    });
  }

  /** Clean up expired sessions (runs via scheduled job). */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.userSession.updateMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: { lt: new Date() } },
          { lastUsedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        ],
      },
      data: { isActive: false, revokedAt: new Date() },
    });
    return result.count;
  }
}
