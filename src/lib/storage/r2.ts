/**
 * Storage adapter bridging Cloudinary integration.
 * Preserves legacy signatures for backward compatibility across existing routes.
 */
import {
  buildStorageKey,
  getSignedUploadParams,
  getCloudinaryDownloadUrl,
  getCloudinaryThumbnailUrl,
  deleteCloudinaryObject,
  deleteWorkspaceStoragePrefix,
  getObjectBuffer,
  putObjectBuffer,
  isCloudinaryConfigured,
} from "./cloudinary";

export {
  buildStorageKey,
  getSignedUploadParams,
  getCloudinaryDownloadUrl,
  getCloudinaryThumbnailUrl,
  deleteCloudinaryObject,
  deleteWorkspaceStoragePrefix,
  getObjectBuffer,
  putObjectBuffer,
  isCloudinaryConfigured,
};

// Aliases for backward compatibility
export const deleteR2Object = deleteCloudinaryObject;
export const getPresignedDownloadUrl = getCloudinaryDownloadUrl;
export const getPresignedThumbnailUrl = getCloudinaryThumbnailUrl;

export async function getPresignedUploadUrl(params: {
  storageKey: string;
  contentType?: string;
  contentLength?: number;
  expiresInSeconds?: number;
}): Promise<string> {
  const res = await getSignedUploadParams(params);
  return res.uploadUrl;
}
