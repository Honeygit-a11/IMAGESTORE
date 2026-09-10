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
 * Inspects raw initial bytes for canonical image file signatures (magic bytes).
 * Defends against polyglots and executable files disguised with image extensions.
 */
export function detectFileSignature(buffer: Buffer): {
  isValid: boolean;
  detectedFormat?: string;
  error?: string;
} {
  if (!buffer || buffer.length < 12) {
    return { isValid: false, error: "File payload is too small to be a valid image." };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedFormat: "jpeg" };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, detectedFormat: "png" };
  }

  // 3. GIF: 'GIF87a' or 'GIF89a'
  const gifHeader = buffer.subarray(0, 6).toString("ascii");
  if (gifHeader === "GIF87a" || gifHeader === "GIF89a") {
    return { isValid: true, detectedFormat: "gif" };
  }

  // 4. WebP: 'RIFF' .... 'WEBP'
  const riff = buffer.subarray(0, 4).toString("ascii");
  const webp = buffer.subarray(8, 12).toString("ascii");
  if (riff === "RIFF" && webp === "WEBP") {
    return { isValid: true, detectedFormat: "webp" };
  }

  // 5. HEIC / HEIF / AVIF: 'ftyp' box at byte offset 4
  const ftyp = buffer.subarray(4, 8).toString("ascii");
  if (ftyp === "ftyp") {
    return { isValid: true, detectedFormat: "heic" };
  }

  return {
    isValid: false,
    error: "File failed binary signature validation (unrecognized magic bytes).",
  };
}

/**
 * Validates image integrity using binary signatures and Sharp metadata extraction.
 * Guards against corrupted files and malicious non-image payloads.
 */
export async function validateAndExtractMetadata(
  buffer: Buffer
): Promise<{ isValid: boolean; metadata?: ImageMetadata; error?: string }> {
  try {
    // 1. First-line defense: Magic bytes verification
    const sigCheck = detectFileSignature(buffer);
    if (!sigCheck.isValid) {
      return { isValid: false, error: sigCheck.error };
    }

    // 2. Second-line defense: Sharp decoding & structural verification
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
