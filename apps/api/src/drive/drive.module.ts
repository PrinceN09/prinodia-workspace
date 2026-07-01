/**
 * Prinodia Drive v1.7.0 — DriveModule
 *
 * Secure enterprise file system powering every Prinodia product.
 * Integrates with Chat (attachments), Meet (recordings), Canvas (exports),
 * and Documents (version-controlled attachments).
 *
 * Storage is abstracted behind DriveStorageService — swap LOCAL for
 * S3 / Azure Blob / GCS / MinIO via DRIVE_STORAGE_PROVIDER env var.
 */

import { Module } from "@nestjs/common";

import { DriveCommentsService } from "./drive-comments.service";
import { DriveFoldersService } from "./drive-folders.service";
import { DrivePermissionsService } from "./drive-permissions.service";
import { DriveSearchService } from "./drive-search.service";
import { DriveSharesService } from "./drive-shares.service";
import { DriveController } from "./drive.controller";
import { DriveService } from "./drive.service";
import { DriveStorageService } from "./storage/drive-storage.service";
import { LocalDriveProvider } from "./storage/local.provider";

@Module({
  controllers: [DriveController],
  providers: [
    // Storage layer
    LocalDriveProvider,
    DriveStorageService,
    // Domain services
    DriveService,
    DriveFoldersService,
    DrivePermissionsService,
    DriveSharesService,
    DriveSearchService,
    DriveCommentsService,
  ],
  exports: [DriveService, DriveFoldersService, DriveStorageService],
})
export class DriveModule {}
