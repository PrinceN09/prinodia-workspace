import { Type } from "class-transformer";
import { IsDate, IsOptional, IsString } from "class-validator";

export class EndAssignmentDto {
  @Type(() => Date)
  @IsDate()
  endDate!: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
