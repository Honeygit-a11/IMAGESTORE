import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { buildStorageKey, getPresignedUploadUrl } from "@/lib/storage/r2";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per image limit
const MAX_USER_STORAGE = 500 * 1024 * 1024; // 500 MB total per user

const SUPPORTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "heic"];
const SUPPORTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

const presignSchema = z.object({
  fileName: z.string().min(1, "Filename is required").max(255),
  fileSize: z
    .number()
    .int()
    .positive("File size must be positive")
    .max(MAX_FILE_SIZE, "Maximum file size is 10 MB per image"),
  fileType: z.string().min(1, "File type is required"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const { id } = await params;
    const body = await req.json();
    const { fileName, fileSize, fileType } = presignSchema.parse(body);

    // Rule: Check workspace membership & upload permissions (Owner: Yes, Editor: Yes, Viewer: No)
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId: user.id,
        },
      },
      include: {
        workspace: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!membership) {
      return apiError("NOT_FOUND", "Workspace not found or unauthorized.", undefined, 404);
    }

    if (membership.role === "VIEWER") {
      return apiError(
        "FORBIDDEN",
        "Viewers are not permitted to upload images to this workspace.",
        undefined,
        403
      );
    }

    // Format & extension validation
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (!SUPPORTED_EXTENSIONS.includes(ext) && !SUPPORTED_MIME_TYPES.includes(fileType.toLowerCase())) {
      return apiError(
        "UNSUPPORTED_FORMAT",
        `Unsupported file format. Supported formats: JPG, JPEG, PNG, WEBP, GIF, HEIC.`,
        undefined,
        422
      );
    }

    // Rule: Storage space full check (500 MB maximum per workspace owner)
    const ownerStorage = BigInt(membership.workspace.owner.storageUsedBytes);
    const newFileSize = BigInt(fileSize);

    if (ownerStorage + newFileSize > BigInt(MAX_USER_STORAGE)) {
      return apiError(
        "STORAGE_SPACE_FULL",
        "Storage space full.",
        {
          currentUsageMb: (Number(ownerStorage) / (1024 * 1024)).toFixed(1),
          maxMb: 500,
        },
        400
      );
    }

    // Rule: Duplicate filename prevention within the same workspace
    const existingFile = await prisma.image.findFirst({
      where: {
        workspaceId: id,
        fileName: fileName.trim(),
        deletedAt: null,
      },
    });

    if (existingFile) {
      return apiError(
        "DUPLICATE_FILENAME",
        `An image named "${fileName}" already exists in this workspace.`,
        undefined,
        409
      );
    }

    // Create Image record in database in PENDING status
    const image = await prisma.image.create({
      data: {
        workspaceId: id,
        uploadedById: user.id,
        fileName: fileName.trim(),
        originalFileName: fileName.trim(),
        fileType,
        fileSize: newFileSize,
        storageKey: "pending", // updated immediately below
        uploadStatus: "PENDING",
      },
      select: {
        id: true,
        fileName: true,
      },
    });

    // Generate secure storage key: users/{userId}/workspaces/{workspaceId}/images/{imageId}/{fileName}
    const storageKey = buildStorageKey({
      userId: user.id,
      workspaceId: id,
      imageId: image.id,
      fileName,
    });

    // Update storage key in database
    await prisma.image.update({
      where: { id: image.id },
      data: { storageKey },
    });

    // Generate presigned PUT upload URL (valid for 15 minutes)
    const uploadUrl = await getPresignedUploadUrl({
      storageKey,
      contentType: fileType,
      contentLength: fileSize,
      expiresInSeconds: 900,
    });

    return apiSuccess({
      imageId: image.id,
      fileName: image.fileName,
      storageKey,
      uploadUrl,
      expiresInSeconds: 900,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
