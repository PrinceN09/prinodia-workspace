import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";

import { EmailTemplatesService } from "./email-templates.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from "../dto/platform.dto";

@UseGuards(JwtAuthGuard)
@Controller("v1/platform/email-templates")
export class EmailTemplatesController {
  constructor(private readonly svc: EmailTemplatesService) {}

  @Get()
  listTemplates(@Query("category") category?: string) {
    return this.svc.listTemplates(category);
  }

  @Get(":slug")
  getTemplateBySlug(@Param("slug") slug: string) {
    return this.svc.getTemplateBySlug(slug);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTemplate(@Body() dto: CreateEmailTemplateDto) {
    return this.svc.createTemplate(dto);
  }

  @Put(":id")
  updateTemplate(@Param("id") id: string, @Body() dto: UpdateEmailTemplateDto) {
    return this.svc.updateTemplate(id, dto);
  }
}
