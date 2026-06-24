import { registerAs } from "@nestjs/config";

export interface JwtConfig {
  /** RS256 private key — PEM decoded from base64. Used for signing. */
  privateKey: string;
  /** RS256 public key — PEM decoded from base64. Used for verification. */
  publicKey: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

export const jwtConfig = registerAs("jwt", (): JwtConfig => {
  const privateKeyB64 = process.env["JWT_PRIVATE_KEY"] ?? "";
  const publicKeyB64 = process.env["JWT_PUBLIC_KEY"] ?? "";

  return {
    privateKey: Buffer.from(privateKeyB64, "base64").toString("utf-8"),
    publicKey: Buffer.from(publicKeyB64, "base64").toString("utf-8"),
    accessExpiresIn: process.env["JWT_ACCESS_EXPIRES_IN"] ?? "15m",
    refreshExpiresIn: process.env["JWT_REFRESH_EXPIRES_IN"] ?? "7d",
  };
});
