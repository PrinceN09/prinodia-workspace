import { IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateDepartmentDto {
  @IsString()
  ministryId!: string;

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
}
