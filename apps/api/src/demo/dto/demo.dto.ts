import { IsIn, IsOptional } from "class-validator";

export class GenerateDemoDto {
  @IsOptional()
  @IsIn(["SMALL", "MEDIUM", "LARGE", "GOVERNMENT_MINISTRY"])
  seedSize?: "SMALL" | "MEDIUM" | "LARGE" | "GOVERNMENT_MINISTRY" = "MEDIUM";

  @IsOptional()
  @IsIn(["GOVERNMENT", "ENTERPRISE", "EDUCATION", "HEALTHCARE", "NGO", "CHURCH", "ALL"])
  orgType?: string = "ALL";
}
