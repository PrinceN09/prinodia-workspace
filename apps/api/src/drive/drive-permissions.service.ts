/**
 * Prinodia Drive v1.7.0 — DrivePermissionsService
 *
 * Fine-grained access control: grant / revoke / list permissions.
 * Roles: OWNER > EDITOR > COMMENTER > VIEWER > GUEST
 */

import { Injectable, Logger, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import type { GrantPermissionDto } from "./dto/drive.dto";
import type { AuthenticatedUser } from "../common/types/auth.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = any;

@Injectable()
export class DrivePermissionsService {
  private readonly logger = new Logger(DrivePermissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get db(): AnyPrisma {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.prisma as any;
  }

  async listPermissions(itemId: string, _actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.drivePermission.findMany({
      where: { itemId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        role: true,
        scope: true,
        userId: true,
        ministryId: true,
        departmentId: true,
        divisionId: true,
        organizationId: true,
        grantedById: true,
        expiresAt: true,
        createdAt: true,
        user: { select: { id: true, displayName: true, avatarUrl: true, email: true } },
      },
    });
  }

  async grantPermission(itemId: string, dto: GrantPermissionDto, actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const item = await this.db.driveItem.findFirst({
      where: {
        id: itemId,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      },
      select: { id: true },
    });
    if (!item) throw new NotFoundException("Item not found");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.drivePermission.create({
      data: {
        itemId,
        role: dto.role,
        scope: dto.scope,
        grantedById: actor.id,
        ...(dto.userId && { userId: dto.userId }),
        ...(dto.ministryId && { ministryId: dto.ministryId }),
        ...(dto.departmentId && { departmentId: dto.departmentId }),
        ...(dto.divisionId && { divisionId: dto.divisionId }),
        ...(dto.organizationId && { organizationId: dto.organizationId }),
        ...(dto.expiresAt && { expiresAt: new Date(dto.expiresAt) }),
      },
      select: {
        id: true,
        role: true,
        scope: true,
        userId: true,
        createdAt: true,
        user: { select: { id: true, displayName: true } },
      },
    });
  }

  async revokePermission(itemId: string, permissionId: string, _actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const perm = await this.db.drivePermission.findFirst({
      where: { id: permissionId, itemId },
      select: { id: true },
    });
    if (!perm) throw new NotFoundException("Permission not found");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await this.db.drivePermission.delete({ where: { id: perm.id as string } });
    return { revoked: true };
  }
}
