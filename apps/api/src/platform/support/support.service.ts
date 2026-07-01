import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

import type { AuthenticatedUser } from "../../common/types/auth.types";
import type {
  CreateTicketDto,
  AddTicketMessageDto,
  UpdateTicketStatusDto,
} from "../dto/platform.dto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = any;

function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TKT-${year}-${rand}`;
}

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): AnyPrisma {
    return this.prisma as unknown as AnyPrisma;
  }

  async listTickets(
    organizationId: string,
    query: {
      status?: string | undefined;
      priority?: string | undefined;
      page?: number | undefined;
      limit?: number | undefined;
    },
  ) {
    const { status, priority, page = 1, limit = 20 } = query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { organizationId };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [items, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.db.supportTicket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { messages: true } } },
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.db.supportTicket.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTicket(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const ticket = await this.db.supportTicket.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return ticket;
  }

  createTicket(organizationId: string, actor: AuthenticatedUser, dto: CreateTicketDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.supportTicket.create({
      data: {
        organizationId,
        submittedById: actor.id,
        ticketNumber: generateTicketNumber(),
        subject: dto.subject,
        description: dto.description,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        category: dto.category as any,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        priority: (dto.priority ?? "NORMAL") as any,
      },
    });
  }

  async addMessage(ticketId: string, actor: AuthenticatedUser, dto: AddTicketMessageDto) {
    await this.getTicket(ticketId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.supportTicketMessage.create({
      data: {
        ticketId,
        authorId: actor.id,
        message: dto.message,
        isInternal: dto.isInternal ?? false,
      },
    });
  }

  async updateTicketStatus(id: string, dto: UpdateTicketStatusDto) {
    await this.getTicket(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { status: dto.status as any };
    if (dto.assignedToId) data.assignedToId = dto.assignedToId;
    if (dto.status === "RESOLVED") data.resolvedAt = new Date();
    if (dto.status === "CLOSED") data.closedAt = new Date();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.supportTicket.update({ where: { id }, data });
  }
}
