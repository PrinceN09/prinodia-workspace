import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from "class-validator";

import type { OrganizationStatus, OrganizationType } from "../types/organization.types";

export { OrganizationType, OrganizationStatus };

export class CreateOrganizationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  code!: string;

  @IsEnum([
    "GOVERNMENT",
    "ENTERPRISE",
    "EDUCATION",
    "HEALTHCARE",
    "NGO",
    "CHURCH",
    "NON_PROFIT",
    "OTHER",
  ])
  type!: OrganizationType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  logoUrl?: string;
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEnum([
    "GOVERNMENT",
    "ENTERPRISE",
    "EDUCATION",
    "HEALTHCARE",
    "NGO",
    "CHURCH",
    "NON_PROFIT",
    "OTHER",
  ])
  type?: OrganizationType;

  @IsOptional()
  @IsEnum(["ACTIVE", "INACTIVE", "SUSPENDED", "ARCHIVED"])
  status?: OrganizationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  logoUrl?: string;
}

export class QueryOrganizationsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum([
    "GOVERNMENT",
    "ENTERPRISE",
    "EDUCATION",
    "HEALTHCARE",
    "NGO",
    "CHURCH",
    "NON_PROFIT",
    "OTHER",
  ])
  type?: OrganizationType;

  @IsOptional()
  @IsEnum(["ACTIVE", "INACTIVE", "SUSPENDED", "ARCHIVED"])
  status?: OrganizationStatus;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
