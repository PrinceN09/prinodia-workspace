import { Module } from "@nestjs/common";

import { AssignmentsController } from "./assignments.controller";
import { AssignmentsService } from "./assignments.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuditModule } from "../../identity/audit/audit.module";

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
