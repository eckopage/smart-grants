export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

/**
 * Abstraction over object storage. Default implementation targets
 * Cloudflare R2 (S3-compatible, zero egress fees). Migrating to AWS S3
 * later means implementing this interface, not touching call sites.
 */
export interface StorageProvider {
  getUploadUrl(
    key: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string }>;
  getDownloadUrl(key: string): Promise<string>;
  deleteObject(key: string): Promise<void>;
}
