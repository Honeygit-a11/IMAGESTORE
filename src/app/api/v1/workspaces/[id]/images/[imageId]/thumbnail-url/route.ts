import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getPresignedDownloadUrl } from "@/lib/storage/r2";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * GET /api/v1/workspaces/[id]/images/[imageId]/thumbnail-url
 * Returns a temporary presigned download URL for the optimized WebP thumbnail
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

    const { id: workspaceId, imageId } = await params;

    // Membership check: all roles (Owner, Editor, Viewer) can view thumbnails
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return apiError("NOT_FOUND", "Workspace not found or unauthorized.", undefined, 404);
    }

    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        workspaceId: true,
        storageKey: true,
        thumbnailKey: true,
        uploadStatus: true,
        deletedAt: true,
      },
    });

    if (!image || image.workspaceId !== workspaceId) {
      return apiError("NOT_FOUND", "Image not found.", undefined, 404);
    }

    // Soft-deleted images in Trash are only viewable by Owner
    if (image.deletedAt && membership.role !== "OWNER") {
      return apiError("FORBIDDEN", "Only workspace owners can view assets in Trash.", undefined, 403);
    }

    // Prefer thumbnail key; fallback to original storage key if thumbnail hasn't finished
    const targetKey = image.thumbnailKey || image.storageKey;
    const isThumbnail = Boolean(image.thumbnailKey);

    const signedUrl = await getPresignedDownloadUrl({
      storageKey: targetKey,
      expiresInSeconds: 3600, // 1 hour
    });

    return apiSuccess({
      imageId: image.id,
      thumbnailUrl: signedUrl,
      isThumbnail,
      status: image.uploadStatus,
      expiresInSeconds: 3600,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
