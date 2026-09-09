import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * DELETE /api/v1/workspaces/[id]/images/[imageId]
 * Soft-deletes an image to Trash with a 30-day permanent deletion schedule.
 * Permissions:
 * - OWNER: can delete any image in workspace.
 * - EDITOR: can delete ONLY images they uploaded.
 * - VIEWER: cannot delete.
 * Rule: Trash still counts toward storage quota until permanently deleted.
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

    // Membership check
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

    if (membership.role === "VIEWER") {
      return apiError("FORBIDDEN", "Viewers cannot delete images.", undefined, 403);
    }

    const image = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!image || image.workspaceId !== workspaceId || image.deletedAt !== null) {
      return apiError("NOT_FOUND", "Image not found or already deleted.", undefined, 404);
    }

    // Role check: Editor can only delete images they uploaded
    if (membership.role === "EDITOR" && image.uploadedById !== user.id) {
      return apiError(
        "FORBIDDEN",
        "Editors can only delete images they personally uploaded.",
        undefined,
        403
      );
    }

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Soft delete & log activity in transaction
    await prisma.$transaction([
      prisma.image.update({
        where: { id: imageId },
        data: {
          deletedAt: now,
          deletedById: user.id,
          permanentDeleteAt: thirtyDaysLater,
        },
      }),
      prisma.activityLog.create({
        data: {
          workspaceId,
          userId: user.id,
          action: "IMAGE_DELETED",
          metadata: {
            imageId: image.id,
            fileName: image.fileName,
            fileSize: Number(image.fileSize),
            permanentDeleteAt: thirtyDaysLater.toISOString(),
          },
        },
      }),
    ]);

    return apiSuccess({
      message: `Image "${image.fileName}" moved to Trash. It will be permanently removed in 30 days.`,
      imageId: image.id,
      permanentDeleteAt: thirtyDaysLater.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
