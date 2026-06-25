import { Module } from "@nestjs/common";

import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";
import { ExportService } from "./export.service";
import { AuditModule } from "../identity/audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, ExportService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
