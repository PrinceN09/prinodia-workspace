import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

import type { AuthenticatedUser } from "../../common/types/auth.types";

// ─── Return types ─────────────────────────────────────────────────────────────

interface DayActivity {
  date: string;
  success: number;
  failed: number;
}

interface MinistrySessionCount {
  ministry: string;
  ministryCode: string;
  count: number;
}

export interface SecurityDashboard {
  activeSessions: number;
  activeDevices: number;
  mfaEnabledUsers: number;
  totalUsers: number;
  mfaAdoptionPct: number;
  lockedAccounts: number;
  failedLoginsToday: number;
  passwordResetsToday: number;
  newInvitationsToday: number;
  archivedUsers: number;
  loginActivity: DayActivity[];
  failedLoginActivity: DayActivity[];
  sessionsByMinistry: MinistrySessionCount[];
}

export interface AdminSession {
  id: string;
  platform: string;
  ipAddress: string;
  userAgent: string;
  lastUsedAt: Date;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  user: {
    id: string;
    displayName: string;
    email: string;
    matriculeNumber: string | null;
    ministry: { id: string; name: string; code: string } | null;
  };
  device: {
    id: string;
    name: string;
    platform: string;
    trusted: boolean;
  } | null;
}

export interface UserSecurityProfile {
  passwordChangedAt: Date | null;
  mfaEnabled: boolean;
  mfaBackupCodesRemaining: number;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  failedLoginCount: number;
  lockedUntil: Date | null;
  isLocked: boolean;
  activeSessions: {
    id: string;
    platform: string;
    ipAddress: string;
    userAgent: string;
    lastUsedAt: Date;
    createdAt: Date;
    expiresAt: Date;
    device: { name: string; platform: string; trusted: boolean } | null;
  }[];
  devices: {
    id: string;
    name: string;
    platform: string;
    trusted: boolean;
    lastSeenAt: Date;
    createdAt: Date;
  }[];
  recentLoginHistory: {
    id: string;
    success: boolean;
    failReason: string | null;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
  }[];
  recentAuditEvents: {
    id: string;
    action: string;
    category: string;
    label: string;
    ipAddress: string | null;
    createdAt: Date;
  }[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class SecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getDashboardStats(): Promise<SecurityDashboard> {
    const today = startOfToday();
    const sevenDaysAgo = daysAgo(7);

    const [
      activeSessions,
      activeDevices,
      mfaEnabledUsers,
      totalUsers,
      lockedAccounts,
      failedLoginsToday,
      passwordResetsToday,
      newInvitationsToday,
      archivedUsers,
      loginHistory7d,
      sessionsWithMinistry,
    ] = await Promise.all([
      this.prisma.userSession.count({ where: { isActive: true } }),
      this.prisma.userDevice.count(),
      this.prisma.user.count({ where: { mfaEnabled: true } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: "LOCKED" } }),
      this.prisma.loginHistory.count({
        where: { success: false, createdAt: { gte: today } },
      }),
      this.prisma.passwordResetToken.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.employeeInvitation.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.user.count({ where: { status: "ARCHIVED" } }),
      this.prisma.loginHistory.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { success: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.userSession.findMany({
        where: { isActive: true },
        select: {
          user: {
            select: {
              ministry: { select: { name: true, code: true } },
            },
          },
        },
      }),
    ]);

    // Build 7-day login activity
    const activityMap = new Map<string, { success: number; failed: number }>();
    for (let i = 6; i >= 0; i--) {
      activityMap.set(isoDate(daysAgo(i)), { success: 0, failed: 0 });
    }
    for (const entry of loginHistory7d) {
      const key = isoDate(entry.createdAt);
      const bucket = activityMap.get(key);
      if (bucket) {
        if (entry.success) bucket.success++;
        else bucket.failed++;
      }
    }
    const loginActivity: DayActivity[] = Array.from(activityMap.entries()).map(
      ([date, { success, failed }]) => ({ date, success, failed }),
    );
    const failedLoginActivity: DayActivity[] = loginActivity.map(({ date, failed }) => ({
      date,
      success: 0,
      failed,
    }));

    // Sessions by ministry
    const ministryMap = new Map<string, { name: string; code: string; count: number }>();
    for (const s of sessionsWithMinistry) {
      const m = s.user.ministry;
      const key = m?.name ?? "Sans ministère";
      const existing = ministryMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        ministryMap.set(key, { name: key, code: m?.code ?? "—", count: 1 });
      }
    }
    const sessionsByMinistry: MinistrySessionCount[] = Array.from(ministryMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(({ name, code, count }) => ({ ministry: name, ministryCode: code, count }));

    return {
      activeSessions,
      activeDevices,
      mfaEnabledUsers,
      totalUsers,
      mfaAdoptionPct: totalUsers > 0 ? Math.round((mfaEnabledUsers / totalUsers) * 100) : 0,
      lockedAccounts,
      failedLoginsToday,
      passwordResetsToday,
      newInvitationsToday,
      archivedUsers,
      loginActivity,
      failedLoginActivity,
      sessionsByMinistry,
    };
  }

  async findAllSessions(params: {
    page?: number;
    limit?: number;
    ministryId?: string;
    search?: string;
  }): Promise<{ data: AdminSession[]; meta: { total: number; page: number; limit: number } }> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const userWhere: Record<string, unknown> = {};
    if (params.ministryId) userWhere["ministryId"] = params.ministryId;
    if (params.search) {
      userWhere["OR"] = [
        { displayName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const where: Record<string, unknown> = { isActive: true };
    if (Object.keys(userWhere).length > 0) where["user"] = userWhere;

    const [data, total] = await Promise.all([
      this.prisma.userSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastUsedAt: "desc" },
        select: {
          id: true,
          platform: true,
          ipAddress: true,
          userAgent: true,
          lastUsedAt: true,
          createdAt: true,
          expiresAt: true,
          revokedAt: true,
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
              matriculeNumber: true,
              ministry: { select: { id: true, name: true, code: true } },
            },
          },
          device: {
            select: { id: true, name: true, platform: true, trusted: true },
          },
        },
      }),
      this.prisma.userSession.count({ where }),
    ]);

    return { data: data as AdminSession[], meta: { total, page, limit } };
  }

  async revokeSessionById(
    sessionId: string,
    admin: AuthenticatedUser,
    ipAddress: string,
  ): Promise<void> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException("Session not found");

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false, revokedAt: new Date() },
    });

    this.auditService.log({
      userId: admin.id,
      action: "SESSION_REVOKED",
      entityType: "SESSION",
      entityId: sessionId,
      metadata: { revokedBy: admin.id, targetUserId: session.userId, adminRevoke: true },
      ipAddress,
    });
  }

  async revokeAllSessionsForUser(
    targetUserId: string,
    admin: AuthenticatedUser,
    ipAddress: string,
  ): Promise<{ count: number }> {
    const result = await this.prisma.userSession.updateMany({
      where: { userId: targetUserId, isActive: true },
      data: { isActive: false, revokedAt: new Date() },
    });

    this.auditService.log({
      userId: admin.id,
      action: "LOGOUT_ALL",
      entityType: "USER",
      entityId: targetUserId,
      metadata: { revokedBy: admin.id, sessionsRevoked: result.count, adminRevoke: true },
      ipAddress,
    });

    return { count: result.count };
  }

  async getUserSecurityProfile(userId: string): Promise<UserSecurityProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordChangedAt: true,
        mfaEnabled: true,
        failedLoginCount: true,
        lockedUntil: true,
        lastLoginAt: true,
        lastLoginIp: true,
        mfaBackupCodes: { where: { usedAt: null }, select: { id: true } },
        sessions: {
          where: { isActive: true },
          select: {
            id: true,
            platform: true,
            ipAddress: true,
            userAgent: true,
            lastUsedAt: true,
            createdAt: true,
            expiresAt: true,
            device: { select: { name: true, platform: true, trusted: true } },
          },
          orderBy: { lastUsedAt: "desc" },
          take: 10,
        },
        devices: {
          select: {
            id: true,
            name: true,
            platform: true,
            trusted: true,
            lastSeenAt: true,
            createdAt: true,
          },
          orderBy: { lastSeenAt: "desc" },
          take: 10,
        },
        loginHistory: {
          select: {
            id: true,
            success: true,
            failReason: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!user) throw new NotFoundException("User not found");

    const recentAuditEvents = await this.auditService.getTimelineForUser(userId, 10);

    const now = new Date();
    const isLocked = user.lockedUntil !== null && user.lockedUntil > now;

    return {
      passwordChangedAt: user.passwordChangedAt,
      mfaEnabled: user.mfaEnabled,
      mfaBackupCodesRemaining: user.mfaBackupCodes.length,
      lastLoginAt: user.lastLoginAt,
      lastLoginIp: user.lastLoginIp,
      failedLoginCount: user.failedLoginCount,
      lockedUntil: user.lockedUntil,
      isLocked,
      activeSessions: user.sessions,
      devices: user.devices,
      recentLoginHistory: user.loginHistory,
      recentAuditEvents,
    };
  }
}
