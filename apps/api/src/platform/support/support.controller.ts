import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";

import { SupportService } from "./support.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateTicketDto, AddTicketMessageDto, UpdateTicketStatusDto } from "../dto/platform.dto";

import type { AuthenticatedUser } from "../../common/types/auth.types";

@UseGuards(JwtAuthGuard)
@Controller("v1/platform/support")
export class SupportController {
  constructor(private readonly svc: SupportService) {}

  @Get("tickets")
  listTickets(
    @CurrentUser() actor: AuthenticatedUser,
    @Query("orgId") orgId?: string,
    @Query("status") status?: string,
    @Query("priority") priority?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const organizationId =
      orgId ?? actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global";
    return this.svc.listTickets(organizationId, {
      status,
      priority,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post("tickets")
  @HttpCode(HttpStatus.CREATED)
  createTicket(@Body() dto: CreateTicketDto, @CurrentUser() actor: AuthenticatedUser) {
    const organizationId = actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global";
    return this.svc.createTicket(organizationId, actor, dto);
  }

  @Get("tickets/:id")
  getTicket(@Param("id") id: string) {
    return this.svc.getTicket(id);
  }

  @Post("tickets/:id/messages")
  @HttpCode(HttpStatus.CREATED)
  addMessage(
    @Param("id") id: string,
    @Body() dto: AddTicketMessageDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.svc.addMessage(id, actor, dto);
  }

  @Patch("tickets/:id/status")
  updateTicketStatus(@Param("id") id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.svc.updateTicketStatus(id, dto);
  }
}
