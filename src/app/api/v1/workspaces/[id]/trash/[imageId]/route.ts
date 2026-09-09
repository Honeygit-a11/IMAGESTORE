import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { deleteR2Object } from "@/lib/storage/r2";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * DELETE /api/v1/workspaces/[id]/trash/[imageId]
 * Permanently deletes a single image from Trash before 30-day auto-purge.
 * Restricted to workspace OWNER only.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const { id: workspaceId, imageId } = await params;

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
      include: {
        workspace: true,
      },
    });

    if (!membership) {
      return apiError("NOT_FOUND", "Workspace not found.", undefined, 404);
    }

    if (membership.role !== "OWNER") {
      return apiError(
        "FORBIDDEN",
        "Only the workspace Owner can permanently delete assets.",
        undefined,
        403
      );
    }

    const image = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!image || image.workspaceId !== workspaceId || !image.deletedAt) {
      return apiError("NOT_FOUND", "Image not found in Trash.", undefined, 404);
    }

    const fileSize = BigInt(image.fileSize);
    const ownerId = membership.workspace.ownerId;

    // Delete R2 objects
    if (image.storageKey) await deleteR2Object(image.storageKey);
    if (image.thumbnailKey) await deleteR2Object(image.thumbnailKey);

    // Release storage quotas & delete database record
    await prisma.$transaction([
      prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          storageUsedBytes: {
            decrement: fileSize,
          },
        },
      }),
      prisma.user.update({
        where: { id: ownerId },
        data: {
          storageUsedBytes: {
            decrement: fileSize,
          },
        },
      }),
      prisma.activityLog.create({
        data: {
          workspaceId,
          userId: user.id,
          action: "IMAGE_PERMANENTLY_DELETED",
          metadata: {
            imageId: image.id,
            fileName: image.fileName,
            fileSize: Number(fileSize),
          },
        },
      }),
      prisma.image.delete({
        where: { id: imageId },
      }),
    ]);

    return apiSuccess({
      message: `Image "${image.fileName}" permanently deleted and storage released.`,
      imageId: image.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
