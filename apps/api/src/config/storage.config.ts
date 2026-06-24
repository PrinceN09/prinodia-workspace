import { registerAs } from "@nestjs/config";

export interface StorageConfig {
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  publicUrl: string;
  buckets: {
    files: string;
    avatars: string;
    documents: string;
  };
  maxFileSizeMb: number;
}

export const storageConfig = registerAs(
  "storage",
  (): StorageConfig => ({
    endpoint: process.env["MINIO_ENDPOINT"] ?? "localhost",
    port: parseInt(process.env["MINIO_PORT"] ?? "9000", 10),
    useSSL: process.env["MINIO_USE_SSL"] === "true",
    accessKey: process.env["MINIO_ACCESS_KEY"] ?? "",
    secretKey: process.env["MINIO_SECRET_KEY"] ?? "",
    publicUrl: process.env["MINIO_PUBLIC_URL"] ?? "http://localhost:9000",
    buckets: {
      files: process.env["MINIO_BUCKET_FILES"] ?? "govsphere-files",
      avatars: process.env["MINIO_BUCKET_AVATARS"] ?? "govsphere-avatars",
      documents: process.env["MINIO_BUCKET_DOCUMENTS"] ?? "govsphere-documents",
    },
    maxFileSizeMb: parseInt(process.env["MAX_FILE_SIZE_MB"] ?? "50", 10),
  }),
);
