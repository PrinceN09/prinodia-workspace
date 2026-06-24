import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/types/auth.types";
import { MfaService } from "./mfa.service";
import { DisableMfaDto, VerifyMfaDto, VerifySetupDto } from "./dto/verify-mfa.dto";

const REFRESH_COOKIE = "govsphere_refresh";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env["NODE_ENV"] === "production",
  sameSite: "strict" as const,
  path: "/v1/auth/refresh",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@Controller("v1/auth/mfa")
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  /** Step 1: Initiate MFA setup — returns secret + QR code. */
  @UseGuards(JwtAuthGuard)
  @Post("setup")
  @HttpCode(HttpStatus.OK)
  setup(@CurrentUser() user: AuthenticatedUser): Promise<unknown> {
    return this.mfaService.setupTotp(user.id);
  }

  /** Step 2: Confirm setup with first code — returns backup codes. */
  @UseGuards(JwtAuthGuard)
  @Post("verify-setup")
  @HttpCode(HttpStatus.OK)
  async verifySetup(
    @Body() dto: VerifySetupDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ backupCodes: string[]; message: string }> {
    const ip = this.getIp(req);
    const result = await this.mfaService.confirmSetup(user.id, dto.code, ip);
    return { ...result, message: "MFA enabled. Save your backup codes — they will not be shown again." };
  }

  /** Verify MFA challenge during login (public — challenge token provides auth). */
  @Public()
  @Post("verify")
  @HttpCode(HttpStatus.OK)
  async verify(
    @Body() dto: VerifyMfaDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    if (!dto.code && !dto.backupCode) {
      throw new BadRequestException({
        error: "MISSING_CODE",
        message: "Either code or backupCode must be provided",
      });
    }

    const ip = this.getIp(req);
    const userAgent = req.headers["user-agent"] ?? "unknown";

    const result = await this.mfaService.verifyChallenge(
      dto.challengeToken,
      dto.code,
      dto.backupCode,
      ip,
      userAgent,
      dto.deviceFingerprint,
    );

    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);

    return {
      accessToken: result.accessToken,
      user: result.user,
      sessionId: result.sessionId,
    };
  }

  /** Disable MFA (requires valid TOTP code as confirmation). */
  @UseGuards(JwtAuthGuard)
  @Delete("disable")
  @HttpCode(HttpStatus.OK)
  async disable(
    @Body() dto: DisableMfaDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.mfaService.disableMfa(user.id, dto.code, this.getIp(req));
    return { message: "MFA disabled" };
  }

  private getIp(req: Request): string {
    return (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? "";
  }
}
