import { registerAs } from "@nestjs/config";

export interface DatabaseConfig {
  url: string;
  shadowUrl?: string;
}

export const databaseConfig = registerAs(
  "database",
  (): DatabaseConfig => ({
    url: process.env["DATABASE_URL"] ?? "",
    // exactOptionalPropertyTypes: only include shadowUrl when the env var is set.
    ...(process.env["SHADOW_DATABASE_URL"] !== undefined && {
      shadowUrl: process.env["SHADOW_DATABASE_URL"],
    }),
  }),
);
