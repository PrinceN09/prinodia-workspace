import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/types/auth.types";
import { SessionsService } from "./sessions.service";

@Controller("v1/sessions")
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  findMy(@CurrentUser() user: AuthenticatedUser): Promise<unknown[]> {
    return this.sessionsService.findMyActiveSessions(user.id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async revoke(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? "";
    await this.sessionsService.revokeSession(id, user, ip);
    return { message: "Session revoked" };
  }
}
