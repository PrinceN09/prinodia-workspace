/**
 * Prinodia Drive v1.7.0 — Local Filesystem Storage Provider
 *
 * Stores files on the local disk under DRIVE_LOCAL_PATH (defaults to
 * ./storage/drive). Intended for development and single-server deployments;
 * swap for S3/MinIO in production.
 */

import * as crypto from "crypto";
import * as fs from "fs/promises";
import * as path from "path";

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { DriveStorageProvider, DownloadResult, UploadResult } from "./storage.interface";

@Injectable()
export class LocalDriveProvider implements DriveStorageProvider {
  readonly providerName = "LOCAL";
  private readonly logger = new Logger(LocalDriveProvider.name);
  private readonly basePath: string;

  constructor(private readonly config: ConfigService) {
    this.basePath =
      this.config.get<string>("DRIVE_LOCAL_PATH") ?? path.join(process.cwd(), "storage", "drive");
  }

  async upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
    _originalName: string,
  ): Promise<UploadResult> {
    const fullPath = path.join(this.basePath, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);

    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    this.logger.debug(`Stored ${key} (${buffer.length} bytes)`);
    return { storageKey: key, sizeBytes: buffer.length, checksum, mimeType };
  }

  async download(key: string): Promise<DownloadResult> {
    const fullPath = path.join(this.basePath, key);
    const buffer = await fs.readFile(fullPath);
    const stat = await fs.stat(fullPath);
    return { buffer, mimeType: "application/octet-stream", sizeBytes: stat.size };
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.basePath, key);
    try {
      await fs.unlink(fullPath);
    } catch {
      // File already gone — treat as success
    }
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    const src = path.join(this.basePath, sourceKey);
    const dest = path.join(this.basePath, destKey);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.basePath, key));
      return true;
    } catch {
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async presignedDownloadUrl(_key: string, _expiresInSeconds: number): Promise<null> {
    // Local provider does not generate presigned URLs — callers fall back to API proxy.
    return null;
  }
}
