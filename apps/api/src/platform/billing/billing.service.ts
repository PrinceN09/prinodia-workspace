import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

import type { CreateInvoiceDto, UpdateInvoiceStatusDto } from "../dto/platform.dto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = any;

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `INV-${year}-${rand}`;
}

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): AnyPrisma {
    return this.prisma as unknown as AnyPrisma;
  }

  async listInvoices(organizationId: string, page = 1, limit = 20) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [items, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.db.invoice.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { lineItems: true } } },
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.db.invoice.count({ where: { organizationId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getInvoice(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const invoice = await this.db.invoice.findUnique({
      where: { id },
      include: { lineItems: true },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return invoice;
  }

  createInvoice(dto: CreateInvoiceDto) {
    const totalCents = dto.subtotalCents + (dto.taxCents ?? 0) - (dto.discountCents ?? 0);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.invoice.create({
      data: {
        organizationId: dto.organizationId,
        invoiceNumber: generateInvoiceNumber(),
        subtotalCents: dto.subtotalCents,
        taxCents: dto.taxCents ?? 0,
        discountCents: dto.discountCents ?? 0,
        totalCents,
        billingPeriodStart: new Date(dto.billingPeriodStart),
        billingPeriodEnd: new Date(dto.billingPeriodEnd),
        dueDate: new Date(dto.dueDate),
        notes: dto.notes,
      },
    });
  }

  async updateInvoiceStatus(id: string, dto: UpdateInvoiceStatusDto) {
    await this.getInvoice(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { status: dto.status as any };
    if (dto.status === "PAID") data.paidAt = new Date();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.invoice.update({ where: { id }, data });
  }
}
