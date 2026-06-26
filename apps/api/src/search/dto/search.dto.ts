import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class SearchQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  q!: string;

  @IsOptional()
  @IsString()
  types?: string; // comma-separated: "users,documents,meetings,workflows,tasks"

  @IsOptional()
  @IsString()
  limit?: string = "5"; // results per type
}
