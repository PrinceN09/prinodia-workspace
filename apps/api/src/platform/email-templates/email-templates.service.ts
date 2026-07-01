import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

import type { CreateEmailTemplateDto, UpdateEmailTemplateDto } from "../dto/platform.dto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = any;

@Injectable()
export class EmailTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): AnyPrisma {
    return this.prisma as unknown as AnyPrisma;
  }

  listTemplates(category?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };
    if (category) where.category = category;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.emailTemplate.findMany({ where, orderBy: { slug: "asc" } });
  }

  async getTemplateBySlug(slug: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const t = await this.db.emailTemplate.findUnique({ where: { slug } });
    if (!t) throw new NotFoundException(`Email template "${slug}" not found`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return t;
  }

  createTemplate(dto: CreateEmailTemplateDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.emailTemplate.create({ data: dto as AnyPrisma });
  }

  async updateTemplate(id: string, dto: UpdateEmailTemplateDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const t = await this.db.emailTemplate.findUnique({ where: { id } });
    if (!t) throw new NotFoundException(`Email template ${id} not found`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.emailTemplate.update({ where: { id }, data: dto as AnyPrisma });
  }
}
