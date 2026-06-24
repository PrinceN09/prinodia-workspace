import { IsBoolean, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateProvinceDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsObject()
  nameTranslations?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  capital?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
