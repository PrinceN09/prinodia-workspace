import { Module, forwardRef } from "@nestjs/common";
import { MfaService } from "./mfa.service";
import { MfaController } from "./mfa.controller";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuditModule, forwardRef(() => AuthModule)],
  providers: [MfaService],
  controllers: [MfaController],
  exports: [MfaService],
})
export class MfaModule {}
