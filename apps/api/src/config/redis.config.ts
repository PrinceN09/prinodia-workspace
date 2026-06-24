import { registerAs } from "@nestjs/config";

export interface RedisConfig {
  url: string;
  host: string;
  port: number;
  password?: string;
  db: number;
  bullmqDb: number;
}

export const redisConfig = registerAs(
  "redis",
  (): RedisConfig => ({
    url: process.env["REDIS_URL"] ?? "redis://localhost:6379",
    host: process.env["REDIS_HOST"] ?? "localhost",
    port: parseInt(process.env["REDIS_PORT"] ?? "6379", 10),
    // exactOptionalPropertyTypes: only include password when defined.
    ...(process.env["REDIS_PASSWORD"] !== undefined && {
      password: process.env["REDIS_PASSWORD"],
    }),
    db: parseInt(process.env["REDIS_DB"] ?? "0", 10),
    bullmqDb: parseInt(process.env["BULLMQ_REDIS_DB"] ?? "1", 10),
  }),
);
