import { IsEnum } from "class-validator";

export enum OrgType {
  GOVERNMENT = "GOVERNMENT",
  ENTERPRISE = "ENTERPRISE",
  EDUCATION = "EDUCATION",
  HEALTHCARE = "HEALTHCARE",
  NGO = "NGO",
}

export enum OrgSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
  GOVERNMENT_MINISTRY = "GOVERNMENT_MINISTRY",
}

export class GenerateDemoDto {
  @IsEnum(OrgType)
  orgType!: OrgType;

  @IsEnum(OrgSize)
  size!: OrgSize;
}
