import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class ResetPasswordDto {
  /** The raw reset token from the email link (64-char hex). */
  @IsString()
  @IsNotEmpty()
  @MinLength(64)
  @MaxLength(64)
  token!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(128)
  newPassword!: string;
}
