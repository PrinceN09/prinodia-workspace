import { createHash, randomBytes } from "crypto";

import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

import type { AuthenticatedUser } from "../../common/types/auth.types";
import type { CreateApiKeyDto, UpdateApiKeyDto } from "../dto/platform.dto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = any;

const KEY_PREFIX_LENGTH = 8;
const KEY_SECRET_LENGTH = 32;

function generateRawKey(): { rawKey: string; prefix: string; hash: string } {
  const prefix = `pk_${randomBytes(KEY_PREFIX_LENGTH).toString("hex").slice(0, 8)}`;
  const secret = randomBytes(KEY_SECRET_LENGTH).toString("hex");
  const rawKey = `${prefix}_${secret}`;
  const hash = createHash("sha256").update(rawKey).digest("hex");
  return { rawKey, prefix, hash };
}

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): AnyPrisma {
    return this.prisma as unknown as AnyPrisma;
  }

  async listApiKeys(organizationId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const keys = await this.db.apiKey.findMany({
      where: { organizationId, isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        rateLimitRpm: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        // keyHash is never returned
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return keys;
  }

  async createApiKey(organizationId: string, actor: AuthenticatedUser, dto: CreateApiKeyDto) {
    const { rawKey, prefix, hash } = generateRawKey();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const key = await this.db.apiKey.create({
      data: {
        organizationId,
        createdById: actor.id,
        name: dto.name,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: dto.scopes ?? [],
        rateLimitRpm: dto.rateLimitRpm ?? 60,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });

    // Return full key ONCE — never stored in plaintext
    return { ...key, rawKey, keyHash: undefined };
  }

  async updateApiKey(id: string, organizationId: string, dto: UpdateApiKeyDto) {
    await this._getKey(id, organizationId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.apiKey.update({ where: { id }, data: dto as AnyPrisma });
  }

  async revokeApiKey(id: string, organizationId: string) {
    await this._getKey(id, organizationId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.apiKey.update({ where: { id }, data: { isActive: false } });
  }

  async validateApiKey(rawKey: string): Promise<boolean> {
    const hash = createHash("sha256").update(rawKey).digest("hex");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const key = await this.db.apiKey.findUnique({ where: { keyHash: hash } });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!key?.isActive) return false;
    // Update lastUsedAt
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.db.apiKey.update({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });
    return true;
  }

  private async _getKey(id: string, organizationId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const key = await this.db.apiKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundException(`API key ${id} not found`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (key.organizationId !== organizationId) throw new ForbiddenException();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return key;
  }
}
