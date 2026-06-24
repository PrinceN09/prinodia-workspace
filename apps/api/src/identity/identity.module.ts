import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RolesModule } from "./roles/roles.module";
import { PermissionsModule } from "./permissions/permissions.module";
import { SessionsModule } from "./sessions/sessions.module";
import { MfaModule } from "./mfa/mfa.module";
import { AuditModule } from "./audit/audit.module";

/**
 * Identity Platform — the security foundation of GovSphere.
 *
 * Encapsulates all authentication, authorization, session management,
 * MFA, audit logging, and user lifecycle management.
 *
 * Import this single module into AppModule — it wires all sub-modules.
 */
@Module({
  imports: [
    AuditModule,
    PermissionsModule,
    SessionsModule,
    UsersModule,
    RolesModule,
    AuthModule,
    MfaModule,
  ],
  exports: [
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    SessionsModule,
    MfaModule,
    AuditModule,
  ],
})
export class IdentityModule {}
