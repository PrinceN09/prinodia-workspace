import { IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateDivisionDto {
  @IsString()
  departmentId!: string;

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
