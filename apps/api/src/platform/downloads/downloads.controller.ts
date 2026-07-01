import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";

import { DownloadsService } from "./downloads.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("v1/platform/downloads")
export class DownloadsController {
  constructor(private readonly svc: DownloadsService) {}

  @Get()
  listDownloads(
    @Query("platform") platform?: string,
    @Query("category") category?: string,
    @Query("featured") featured?: string,
  ) {
    return this.svc.listDownloads({ platform, category, featured: featured === "true" });
  }

  @Get(":id")
  getDownload(@Param("id") id: string) {
    return this.svc.getDownload(id);
  }

  @Post(":id/track")
  @HttpCode(HttpStatus.OK)
  trackDownload(@Param("id") id: string) {
    return this.svc.trackDownload(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createDownload(@Body() dto: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.svc.createDownload(dto);
  }

  @Patch(":id")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateDownload(@Param("id") id: string, @Body() dto: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.svc.updateDownload(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  deleteDownload(@Param("id") id: string) {
    return this.svc.deleteDownload(id);
  }
}
