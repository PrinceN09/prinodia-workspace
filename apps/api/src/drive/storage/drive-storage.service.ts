/**
 * Prinodia Drive v1.7.0 — DriveStorageService
 *
 * Orchestrates the active storage provider. The provider is selected via the
 * DRIVE_STORAGE_PROVIDER env var (LOCAL | S3 | AZURE_BLOB | GCS | MINIO).
 * Defaults to LOCAL for development.
 *
 * Storage key convention: {orgId}/{year}/{month}/{itemId}/{versionNum}/{filename}
 */

import * as crypto from "crypto";
import * as path from "path";

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { LocalDriveProvider } from "./local.provider";

import type { DriveStorageProvider, UploadResult, DownloadResult } from "./storage.interface";

export interface PreparedUpload {
  key: string;
  result: UploadResult;
}

@Injectable()
export class DriveStorageService {
  private readonly logger = new Logger(DriveStorageService.name);
  private readonly provider: DriveStorageProvider;

  constructor(
    private readonly config: ConfigService,
    private readonly local: LocalDriveProvider,
  ) {
    const providerType = this.config.get<string>("DRIVE_STORAGE_PROVIDER") ?? "LOCAL";
    // Provider selection — extend here for S3 / Azure / GCS / MinIO when those
    // providers are implemented.
    switch (providerType.toUpperCase()) {
      default:
        this.logger.log(`Drive storage: LOCAL (DRIVE_STORAGE_PROVIDER=${providerType})`);
        this.provider = this.local;
        break;
    }
  }

  get activeProviderName(): string {
    return this.provider.providerName;
  }

  /**
   * Build a deterministic storage key for an item version.
   * Format: {orgId}/{yyyy}/{mm}/{itemId}/v{versionNum}/{safeFilename}
   */
  buildKey(orgId: string, itemId: string, versionNum: number, originalName: string): string {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const ext = path.extname(originalName);
    const base = crypto.randomBytes(8).toString("hex");
    const safeFilename = `${base}${ext}`;
    return `${orgId}/${year}/${month}/${itemId}/v${versionNum}/${safeFilename}`;
  }

  async upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<UploadResult> {
    return await this.provider.upload(key, buffer, mimeType, originalName);
  }

  async download(key: string): Promise<DownloadResult> {
    return await this.provider.download(key);
  }

  async delete(key: string): Promise<void> {
    return await this.provider.delete(key);
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    return await this.provider.copy(sourceKey, destKey);
  }

  async exists(key: string): Promise<boolean> {
    return await this.provider.exists(key);
  }

  async presignedUrl(key: string, expiresInSeconds = 3600): Promise<string | null> {
    return await this.provider.presignedDownloadUrl(key, expiresInSeconds);
  }
}
