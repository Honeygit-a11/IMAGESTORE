import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";

export const isCloudinaryConfigured =
  Boolean(env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(env.CLOUDINARY_API_KEY) &&
  Boolean(env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Builds standard hierarchical public ID preventing collisions:
 * imagespace/users/{userId}/workspaces/{workspaceId}/images/{imageId}/{fileName}
 */
export function buildStorageKey(params: {
  userId: string;
  workspaceId: string;
  imageId: string;
  fileName: string;
  isThumbnail?: boolean;
}): string {
  const prefix = `imagespace/users/${params.userId}/workspaces/${params.workspaceId}/images/${params.imageId}`;
  // Remove file extension for Cloudinary public_id
  const cleanName = params.fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_");

  if (params.isThumbnail) {
    return `${prefix}/thumb_${cleanName}`;
  }
  return `${prefix}/${cleanName}`;
}

export interface CloudinaryUploadParams {
  uploadUrl: string;
  uploadMethod: "POST" | "PUT";
  uploadFields?: Record<string, string>;
  storageKey: string;
  expiresInSeconds: number;
}

/**
 * Generates signed direct upload parameters for browser uploads to Cloudinary.
 * Falls back to internal mock storage if Cloudinary is not configured.
 */
export async function getSignedUploadParams(params: {
  storageKey: string;
  contentType?: string;
  contentLength?: number;
  expiresInSeconds?: number;
}): Promise<CloudinaryUploadParams> {
  const expiresInSeconds = params.expiresInSeconds || 900;

  if (!isCloudinaryConfigured) {
    return {
      uploadUrl: `${env.NEXT_PUBLIC_APP_URL}/api/v1/mock-storage/upload?key=${encodeURIComponent(
        params.storageKey
      )}`,
      uploadMethod: "PUT",
      storageKey: params.storageKey,
      expiresInSeconds,
    };
  }

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = {
    public_id: params.storageKey,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY_API_SECRET!
  );

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    uploadMethod: "POST",
    uploadFields: {
      api_key: env.CLOUDINARY_API_KEY!,
      timestamp: timestamp.toString(),
      public_id: params.storageKey,
      signature,
    },
    storageKey: params.storageKey,
    expiresInSeconds,
  };
}

/**
 * Generates delivery / download URL for authorized image access.
 */
export async function getCloudinaryDownloadUrl(params: {
  storageKey: string;
  expiresInSeconds?: number;
  fileName?: string;
  isDownload?: boolean;
}): Promise<string> {
  if (!isCloudinaryConfigured) {
    return `${env.NEXT_PUBLIC_APP_URL}/api/v1/mock-storage/download?key=${encodeURIComponent(
      params.storageKey
    )}`;
  }

  return cloudinary.url(params.storageKey, {
    secure: true,
    resource_type: "image",
    flags: params.isDownload && params.fileName ? `attachment:${params.fileName}` : undefined,
  });
}

/**
 * Generates auto-optimized WebP thumbnail URL via Cloudinary dynamic transformations.
 */
export async function getCloudinaryThumbnailUrl(params: {
  storageKey: string;
  expiresInSeconds?: number;
}): Promise<string> {
  if (!isCloudinaryConfigured) {
    return `${env.NEXT_PUBLIC_APP_URL}/api/v1/mock-storage/download?key=${encodeURIComponent(
      params.storageKey
    )}`;
  }

  return cloudinary.url(params.storageKey, {
    secure: true,
    resource_type: "image",
    transformation: [
      { width: 400, height: 400, crop: "fit" },
      { fetch_format: "webp", quality: 85 },
    ],
  });
}

/**
 * Deletes a single image object from Cloudinary.
 */
export async function deleteCloudinaryObject(storageKey: string): Promise<void> {
  if (!isCloudinaryConfigured) return;

  try {
    await cloudinary.uploader.destroy(storageKey, {
      resource_type: "image",
      invalidate: true,
    });
  } catch (err) {
    console.error(`[Cloudinary Storage] Failed to delete object at key: ${storageKey}`, err);
  }
}

/**
 * Prunes all objects under a workspace prefix upon workspace deletion.
 */
export async function deleteWorkspaceStoragePrefix(
  userId: string,
  workspaceId: string
): Promise<void> {
  if (!isCloudinaryConfigured) return;

  const prefix = `imagespace/users/${userId}/workspaces/${workspaceId}/`;

  try {
    await cloudinary.api.delete_resources_by_prefix(prefix);
  } catch (err) {
    console.error(`[Cloudinary Storage] Failed to prune workspace prefix: ${prefix}`, err);
  }
}

/**
 * Reads an image from Cloudinary as a Buffer.
 */
export async function getObjectBuffer(storageKey: string): Promise<Buffer | null> {
  if (!isCloudinaryConfigured) {
    return Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
  }

  try {
    const url = cloudinary.url(storageKey, { secure: true });
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error(`[Cloudinary Storage] Failed to fetch object at key: ${storageKey}`, err);
    return null;
  }
}

/**
 * Puts an image buffer into Cloudinary storage.
 */
export async function putObjectBuffer(
  storageKey: string,
  buffer: Buffer,
  _contentType: string = "image/webp"
): Promise<boolean> {
  if (!isCloudinaryConfigured) {
    return true; // Mock success
  }

  return new Promise((resolve) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: storageKey,
        resource_type: "image",
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          console.error(`[Cloudinary Storage] Failed to put buffer:`, error);
          resolve(false);
        } else {
          resolve(true);
        }
      }
    );
    uploadStream.end(buffer);
  });
}
