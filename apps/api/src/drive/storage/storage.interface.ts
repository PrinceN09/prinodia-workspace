/**
 * Prinodia Drive v1.7.0 — Storage Provider Interface
 *
 * All storage providers (Local, S3, Azure Blob, GCS, MinIO) must implement
 * this interface. No business logic depends on the concrete provider —
 * DriveStorageService selects the active provider at runtime.
 */

export interface UploadResult {
  storageKey: string; // provider-specific path/key
  sizeBytes: number;
  checksum: string; // SHA-256 hex
  mimeType: string;
}

export interface DownloadResult {
  buffer: Buffer;
  mimeType: string;
  sizeBytes: number;
}

export interface DriveStorageProvider {
  /** Upload file content and return storage metadata. */
  upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<UploadResult>;

  /** Download file content by key. */
  download(key: string): Promise<DownloadResult>;

  /** Delete a file by key. */
  delete(key: string): Promise<void>;

  /** Copy a file to a new key (used for versioning / duplication). */
  copy(sourceKey: string, destKey: string): Promise<void>;

  /** Check whether a key exists. */
  exists(key: string): Promise<boolean>;

  /**
   * Generate a time-limited signed URL for direct browser download.
   * Returns null if the provider does not support presigned URLs
   * (e.g. local provider — fall back to API proxy).
   */
  presignedDownloadUrl(key: string, expiresInSeconds: number): Promise<string | null>;

  /** Provider identifier for logging / metadata. */
  readonly providerName: string;
}
