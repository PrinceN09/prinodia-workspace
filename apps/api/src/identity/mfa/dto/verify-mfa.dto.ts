import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class VerifyMfaDto {
  @IsString()
  @IsNotEmpty()
  challengeToken!: string;

  /** TOTP 6-digit code. One of code or backupCode is required. */
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code?: string;

  /** 10-char backup code (e.g. "ABCDE-12345"). */
  @IsOptional()
  @IsString()
  backupCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceFingerprint?: string;
}

export class VerifySetupDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  code!: string;
}

export class DisableMfaDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  code!: string;
}
