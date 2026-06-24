import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";

import { AssignmentsService } from "./assignments.service";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { EndAssignmentDto } from "./dto/end-assignment.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";

import type { AuthenticatedUser } from "../../common/types/auth.types";
import type { Request } from "express";

const ip = (req: Request): string =>
  (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? "";

@Controller("v1")
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  /** GET /v1/users/:userId/assignments */
  @Get("users/:userId/assignments")
  @RequirePermissions("EMPLOYEE_ASSIGNMENT:READ")
  findByUser(@Param("userId") userId: string): Promise<unknown[]> {
    return this.assignmentsService.findByUser(userId);
  }

  /** GET /v1/assignments/:id */
  @Get("assignments/:id")
  @RequirePermissions("EMPLOYEE_ASSIGNMENT:READ")
  findOne(@Param("id") id: string): Promise<unknown> {
    return this.assignmentsService.findById(id);
  }

  /** POST /v1/assignments */
  @Post("assignments")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("EMPLOYEE_ASSIGNMENT:CREATE")
  create(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.assignmentsService.create(dto, user, ip(req));
  }

  /** PATCH /v1/assignments/:id/end */
  @Patch("assignments/:id/end")
  @RequirePermissions("EMPLOYEE_ASSIGNMENT:UPDATE")
  end(
    @Param("id") id: string,
    @Body() dto: EndAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.assignmentsService.endAssignment(id, dto, user, ip(req));
  }
}
