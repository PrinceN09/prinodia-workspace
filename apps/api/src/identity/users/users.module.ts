import { Module } from "@nestjs/common";

import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { AuditModule } from "../audit/audit.module";
import { PermissionsModule } from "../permissions/permissions.module";
import { SecurityModule } from "../security/security.module";

@Module({
  imports: [AuditModule, PermissionsModule, SecurityModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
