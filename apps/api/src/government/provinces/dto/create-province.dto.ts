import { IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateProvinceDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsObject()
  nameTranslations?: Record<string, string>;

  @IsString()
  @MaxLength(10)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  capital?: string;
}
