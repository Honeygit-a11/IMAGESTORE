import sharp from "sharp";
import prisma from "@/lib/db/prisma";
import {
  getObjectBuffer,
  putObjectBuffer,
  buildStorageKey,
} from "@/lib/storage/r2";

export interface ImageMetadata {
  width?: number;
  height?: number;
  format?: string;
  sizeBytes?: number;
}

/**
 * Validates image integrity using Sharp and extracts metadata.
 * Guards against corrupted files and malicious non-image payloads.
 */
export async function validateAndExtractMetadata(
  buffer: Buffer
): Promise<{ isValid: boolean; metadata?: ImageMetadata; error?: string }> {
  try {
    const sharpInstance = sharp(buffer);
    const meta = await sharpInstance.metadata();

    if (!meta.format || !meta.width || !meta.height) {
      return { isValid: false, error: "Invalid image dimensions or missing format." };
    }

    const allowedFormats = ["jpeg", "jpg", "png", "webp", "gif", "heif", "avif"];
    if (!allowedFormats.includes(meta.format.toLowerCase())) {
      return {
        isValid: false,
        error: `Unsupported image format (${meta.format}). Allowed: JPEG, PNG, WEBP, GIF, HEIC.`,
      };
    }

    return {
      isValid: true,
      metadata: {
        width: meta.width,
        height: meta.height,
        format: meta.format,
        sizeBytes: buffer.length,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to parse image file.";
    return { isValid: false, error: message };
  }
}

/**
 * Generates an optimized 400x400 max WebP thumbnail (quality 85)
 */
export async function generateThumbnailBuffer(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate() // auto-orient based on EXIF
    .resize(400, 400, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();
}

/**
 * Main processing job for an uploaded image:
 * 1. Sets uploadStatus = PROCESSING
 * 2. Fetches binary buffer from R2
 * 3. Validates image integrity & security
 * 4. Generates WebP thumbnail
 * 5. Saves thumbnail to R2
 * 6. Updates database record to COMPLETED with thumbnailKey
 */
export async function processImage(imageId: string): Promise<{
  success: boolean;
  thumbnailKey?: string;
  error?: string;
}> {
  try {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return { success: false, error: "Image record not found." };
    }

    // Mark as PROCESSING
    await prisma.image.update({
      where: { id: imageId },
      data: { uploadStatus: "PROCESSING" },
    });

    // Fetch original binary from R2
    const originalBuffer = await getObjectBuffer(image.storageKey);
    if (!originalBuffer || originalBuffer.length === 0) {
      await prisma.image.update({
        where: { id: imageId },
        data: { uploadStatus: "FAILED" },
      });
      return { success: false, error: "Could not retrieve image buffer from storage." };
    }

    // Validate image integrity & format
    const validation = await validateAndExtractMetadata(originalBuffer);
    if (!validation.isValid) {
      await prisma.image.update({
        where: { id: imageId },
        data: { uploadStatus: "FAILED" },
      });
      return { success: false, error: validation.error || "Image validation failed." };
    }

    // Generate optimized WebP thumbnail
    const thumbBuffer = await generateThumbnailBuffer(originalBuffer);

    // Compute secure thumbnail storage key
    const thumbnailKey = buildStorageKey({
      userId: image.uploadedById,
      workspaceId: image.workspaceId,
      imageId: image.id,
      fileName: image.fileName,
      isThumbnail: true,
    });

    // Upload thumbnail to R2
    const uploaded = await putObjectBuffer(thumbnailKey, thumbBuffer, "image/webp");
    if (!uploaded) {
      console.warn(`[Thumbnail] Failed to save thumbnail for image ${imageId}`);
    }

    // Finalize image in database as COMPLETED
    await prisma.image.update({
      where: { id: imageId },
      data: {
        uploadStatus: "COMPLETED",
        thumbnailKey: uploaded ? thumbnailKey : null,
      },
    });

    return {
      success: true,
      thumbnailKey: uploaded ? thumbnailKey : undefined,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error processing image.";
    console.error(`[ProcessImage] Failed processing image ${imageId}:`, err);

    await prisma.image.update({
      where: { id: imageId },
      data: { uploadStatus: "FAILED" },
    }).catch(() => {});

    return { success: false, error: errorMsg };
  }
}
