import { registerAs } from "@nestjs/config";

export interface DatabaseConfig {
  url: string;
  shadowUrl?: string;
}

export const databaseConfig = registerAs(
  "database",
  (): DatabaseConfig => ({
    url: process.env["DATABASE_URL"] ?? "",
    shadowUrl: process.env["SHADOW_DATABASE_URL"],
  }),
);
