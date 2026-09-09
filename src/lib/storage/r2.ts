import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

const isR2Configured =
  Boolean(env.R2_ACCOUNT_ID) &&
  Boolean(env.R2_ACCESS_KEY_ID) &&
  Boolean(env.R2_SECRET_ACCESS_KEY);

export const s3Client = new S3Client({
  region: "auto",
  endpoint: isR2Configured
    ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : "http://localhost:9000",
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID || "mock-access-key",
    secretAccessKey: env.R2_SECRET_ACCESS_KEY || "mock-secret-key",
  },
  forcePathStyle: true,
});

export const BUCKET_NAME = env.R2_BUCKET_NAME || "imagespace";

/**
 * Generate standard hierarchical storage key preventing cross-workspace and IDOR collisions:
 * users/{userId}/workspaces/{workspaceId}/images/{imageId}/{fileName}
 */
export function buildStorageKey(params: {
  userId: string;
  workspaceId: string;
  imageId: string;
  fileName: string;
  isThumbnail?: boolean;
}): string {
  const prefix = `users/${params.userId}/workspaces/${params.workspaceId}/images/${params.imageId}`;
  const cleanName = params.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  if (params.isThumbnail) {
    return `${prefix}/thumb_${cleanName}.webp`;
  }
  return `${prefix}/${cleanName}`;
}

/**
 * Generates a presigned PUT upload URL for direct streaming from browser to R2.
 * Valid for 15 minutes (900 seconds).
 */
export async function getPresignedUploadUrl(params: {
  storageKey: string;
  contentType: string;
  contentLength: number;
  expiresInSeconds?: number;
}): Promise<string> {
  const expiresIn = params.expiresInSeconds || 900; // 15 min default

  if (!isR2Configured) {
    // Development fallback mock URL
    return `${env.NEXT_PUBLIC_APP_URL}/api/v1/mock-storage/upload?key=${encodeURIComponent(
      params.storageKey
    )}`;
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: params.storageKey,
    ContentType: params.contentType,
    ContentLength: params.contentLength,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generates a presigned GET download URL for authorized private image access.
 * Valid for 1 hour (3600 seconds).
 */
export async function getPresignedDownloadUrl(params: {
  storageKey: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const expiresIn = params.expiresInSeconds || 3600; // 1 hour default

  if (!isR2Configured) {
    return `${env.NEXT_PUBLIC_APP_URL}/api/v1/mock-storage/download?key=${encodeURIComponent(
      params.storageKey
    )}`;
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: params.storageKey,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Deletes a single object from Cloudflare R2 storage.
 */
export async function deleteR2Object(storageKey: string): Promise<void> {
  if (!isR2Configured) return;

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey,
    });
    await s3Client.send(command);
  } catch (err) {
    console.error(`[R2 Storage] Failed to delete object at key: ${storageKey}`, err);
  }
}

/**
 * Cascade prune all objects under a workspace prefix upon workspace deletion.
 */
export async function deleteWorkspaceStoragePrefix(
  userId: string,
  workspaceId: string
): Promise<void> {
  if (!isR2Configured) return;

  const prefix = `users/${userId}/workspaces/${workspaceId}/`;

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await s3Client.send(listCommand);

    if (response.Contents && response.Contents.length > 0) {
      for (const item of response.Contents) {
        if (item.Key) {
          await deleteR2Object(item.Key);
        }
      }
    }
  } catch (err) {
    console.error(`[R2 Storage] Failed to prune workspace prefix: ${prefix}`, err);
  }
}

/**
 * Reads an object from Cloudflare R2 storage as a Buffer.
 */
export async function getObjectBuffer(storageKey: string): Promise<Buffer | null> {
  if (!isR2Configured) {
    // In mock/development mode, provide a 1x1 transparent PNG buffer fallback
    return Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey,
    });
    const response = await s3Client.send(command);
    if (!response.Body) return null;
    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  } catch (err) {
    console.error(`[R2 Storage] Failed to fetch object at key: ${storageKey}`, err);
    return null;
  }
}

/**
 * Puts an object buffer into Cloudflare R2 storage.
 */
export async function putObjectBuffer(
  storageKey: string,
  buffer: Buffer,
  contentType: string = "image/webp"
): Promise<boolean> {
  if (!isR2Configured) {
    return true; // Mock success
  }

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey,
      Body: buffer,
      ContentType: contentType,
    });
    await s3Client.send(command);
    return true;
  } catch (err) {
    console.error(`[R2 Storage] Failed to put object at key: ${storageKey}`, err);
    return false;
  }
}

