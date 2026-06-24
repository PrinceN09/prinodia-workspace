import { UserStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

const SETTABLE_STATUSES = [
  UserStatus.ACTIVE,
  UserStatus.SUSPENDED,
  UserStatus.DEACTIVATED,
] as const;

export class UpdateUserStatusDto {
  @IsEnum(SETTABLE_STATUSES, {
    message: "Status must be one of: ACTIVE, SUSPENDED, DEACTIVATED",
  })
  status!: (typeof SETTABLE_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
