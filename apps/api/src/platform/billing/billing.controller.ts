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

import { BillingService } from "./billing.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateInvoiceDto, UpdateInvoiceStatusDto } from "../dto/platform.dto";

@UseGuards(JwtAuthGuard)
@Controller("v1/platform/billing")
export class BillingController {
  constructor(private readonly svc: BillingService) {}

  @Get("invoices")
  listInvoices(
    @Query("orgId") orgId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.svc.listInvoices(
      orgId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get("invoices/:id")
  getInvoice(@Param("id") id: string) {
    return this.svc.getInvoice(id);
  }

  @Post("invoices")
  @HttpCode(HttpStatus.CREATED)
  createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.svc.createInvoice(dto);
  }

  @Patch("invoices/:id/status")
  updateInvoiceStatus(@Param("id") id: string, @Body() dto: UpdateInvoiceStatusDto) {
    return this.svc.updateInvoiceStatus(id, dto);
  }
}
