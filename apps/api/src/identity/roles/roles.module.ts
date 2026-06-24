import { Module } from "@nestjs/common";

import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";
import { AuditModule } from "../audit/audit.module";
import { PermissionsModule } from "../permissions/permissions.module";

@Module({
  imports: [AuditModule, PermissionsModule],
  providers: [RolesService],
  controllers: [RolesController],
  exports: [RolesService],
})
export class RolesModule {}
