import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from "class-validator";

// PositionLevel enum values — mirrors schema.prisma PositionLevel.
// Using a local enum until `prisma generate` is run after the v0.3.0 migration.
export enum PositionLevel {
  EXECUTIVE = "EXECUTIVE",
  DIRECTOR = "DIRECTOR",
  MANAGER = "MANAGER",
  SPECIALIST = "SPECIALIST",
  OFFICER = "OFFICER",
  SUPPORT = "SUPPORT",
}

export class CreatePositionDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsObject()
  titleTranslations?: Record<string, string>;

  @IsString()
  @MaxLength(50)
  code!: string;

  @IsEnum(PositionLevel)
  level!: PositionLevel;

  @IsOptional()
  @IsInt()
  @IsPositive()
  headcount?: number;

  @IsOptional()
  @IsString()
  ministryId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  divisionId?: string;

  @IsOptional()
  @IsString()
  officeId?: string;
}
