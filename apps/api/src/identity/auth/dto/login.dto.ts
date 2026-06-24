import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  /**
   * Government credential: matricule number (e.g. "1.641.558") or government email.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  credential!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(128)
  password!: string;

  /** Optional: browser/device fingerprint for device tracking. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deviceFingerprint?: string;
}
