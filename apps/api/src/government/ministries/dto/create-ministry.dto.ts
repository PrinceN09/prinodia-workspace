import { IsObject, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class CreateMinistryDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsObject()
  nameTranslations?: Record<string, string>;

  @IsString()
  @MaxLength(50)
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  logoUrl?: string;
}
