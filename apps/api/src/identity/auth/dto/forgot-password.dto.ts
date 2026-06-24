import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class ForgotPasswordDto {
  /** Matricule number or government email. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  credential!: string;
}
