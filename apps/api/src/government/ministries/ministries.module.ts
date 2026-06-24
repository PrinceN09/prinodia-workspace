import { Module } from "@nestjs/common";

import { MinistriesController } from "./ministries.controller";
import { MinistriesService } from "./ministries.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuditModule } from "../../identity/audit/audit.module";

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [MinistriesController],
  providers: [MinistriesService],
  exports: [MinistriesService],
})
export class MinistriesModule {}
