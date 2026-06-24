import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  // In-process cache: userId → permissions[]
  // Cleared on role assignment changes.
  private readonly cache = new Map<string, { permissions: string[]; cachedAt: number }>();
  private readonly CACHE_TTL_MS = 60_000; // 1 minute

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve all permissions for a user based on their active role assignments.
   * Also falls back to the legacy User.role enum field for quick bootstrap.
   */
  async resolvePermissionsForUser(userId: string): Promise<string[]> {
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL_MS) {
      return cached.permissions;
    }

    // Get all active role assignments for this user
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: { userId, isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const permissionSet = new Set<string>();

    if (assignments.length === 0) {
      // Fall back to legacy User.role enum — look up the system role
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user) {
        const systemRole = await this.prisma.role.findUnique({
          where: { name: user.role },
          include: {
            permissions: { include: { permission: true } },
          },
        });

        systemRole?.permissions.forEach((rp) => permissionSet.add(rp.permission.key));
      }
    } else {
      for (const assignment of assignments) {
        for (const rp of assignment.role.permissions) {
          permissionSet.add(rp.permission.key);
        }
      }
    }

    const permissions = Array.from(permissionSet);
    this.cache.set(userId, { permissions, cachedAt: Date.now() });
    return permissions;
  }

  /** Invalidate cache when a user's roles change. */
  invalidateCache(userId: string): void {
    this.cache.delete(userId);
  }

  /** List all permissions in the system. */
  async findAll(): Promise<{ id: string; key: string; displayName: string; resource: string; action: string }[]> {
    return this.prisma.permission.findMany({
      select: { id: true, key: true, displayName: true, resource: true, action: true },
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });
  }
}
