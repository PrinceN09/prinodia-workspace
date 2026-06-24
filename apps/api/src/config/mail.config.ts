import { registerAs } from "@nestjs/config";

export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: {
    name: string;
    email: string;
  };
}

export const mailConfig = registerAs(
  "mail",
  (): MailConfig => ({
    host: process.env["SMTP_HOST"] ?? "localhost",
    port: parseInt(process.env["SMTP_PORT"] ?? "1025", 10),
    secure: process.env["SMTP_SECURE"] === "true",
    user: process.env["SMTP_USER"] ?? undefined,
    password: process.env["SMTP_PASSWORD"] ?? undefined,
    from: {
      name: process.env["SMTP_FROM_NAME"] ?? "GovSphere",
      email: process.env["SMTP_FROM_EMAIL"] ?? "noreply@govsphere.gouv.cd",
    },
  }),
);
