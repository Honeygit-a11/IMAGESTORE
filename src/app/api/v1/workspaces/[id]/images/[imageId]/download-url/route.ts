import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getPresignedDownloadUrl } from "@/lib/storage/r2";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * GET /api/v1/workspaces/[id]/images/[imageId]/download-url
 * Generates temporary secure download URL for authorized workspace members
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const { id, imageId } = await params;

    // Verify workspace membership (All roles: Owner, Editor, Viewer can view & download)
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return apiError("FORBIDDEN", "You do not have access to this workspace.", undefined, 403);
    }

    // Lookup image
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        workspaceId: true,
        fileName: true,
        originalFileName: true,
        storageKey: true,
        fileSize: true,
        deletedAt: true,
      },
    });

    if (!image || image.workspaceId !== id) {
      return apiError("NOT_FOUND", "Image not found in this workspace.", undefined, 404);
    }

    // Check if in Trash (Only Owner can access trash images)
    if (image.deletedAt !== null && membership.role !== "OWNER") {
      return apiError("FORBIDDEN", "Only the workspace owner can access images in Trash.", undefined, 403);
    }

    // Generate secure temporary download URL (valid for 1 hour)
    const downloadUrl = await getPresignedDownloadUrl({
      storageKey: image.storageKey,
      expiresInSeconds: 3600,
    });

    return apiSuccess({
      imageId: image.id,
      fileName: image.fileName,
      originalFileName: image.originalFileName,
      fileSize: Number(image.fileSize),
      downloadUrl,
      expiresInSeconds: 3600,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
