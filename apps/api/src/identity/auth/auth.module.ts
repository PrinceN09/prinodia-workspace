import { Module, forwardRef } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { AuditModule } from "../audit/audit.module";
import { PermissionsModule } from "../permissions/permissions.module";
import { SessionsModule } from "../sessions/sessions.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // Note: RS256 sign options are passed per-call in AuthService.
        // This registers JwtModule so JwtService is available for injection.
        secret: configService.get<string>("JWT_PRIVATE_KEY", "").replace(/\\n/g, "\n"),
        signOptions: { algorithm: "RS256" },
      }),
    }),
    AuditModule,
    PermissionsModule,
    SessionsModule,
    forwardRef(() => UsersModule),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
