import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = any;

@Injectable()
export class DownloadsService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): AnyPrisma {
    return this.prisma as unknown as AnyPrisma;
  }

  listDownloads(query: {
    platform?: string | undefined;
    category?: string | undefined;
    featured?: boolean | undefined;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };
    if (query.platform) where.platform = query.platform;
    if (query.category) where.category = query.category;
    if (query.featured) where.isFeatured = true;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.downloadAsset.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    });
  }

  async getDownload(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const asset = await this.db.downloadAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException(`Download asset ${id} not found`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return asset;
  }

  async trackDownload(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const asset = await this.db.downloadAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException(`Download asset ${id} not found`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.downloadAsset.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      data: { downloadCount: { increment: 1 } },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createDownload(dto: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.downloadAsset.create({ data: dto });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateDownload(id: string, dto: any) {
    await this.getDownload(id);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.downloadAsset.update({ where: { id }, data: dto });
  }

  async deleteDownload(id: string) {
    await this.getDownload(id);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.downloadAsset.update({ where: { id }, data: { isActive: false } });
  }
}
