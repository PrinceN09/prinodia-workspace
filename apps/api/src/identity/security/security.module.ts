import { Module } from "@nestjs/common";

import { SecurityController } from "./security.controller";
import { SecurityService } from "./security.service";
import { AuditModule } from "../audit/audit.module";
import { PermissionsModule } from "../permissions/permissions.module";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule, AuditModule, PermissionsModule],
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
