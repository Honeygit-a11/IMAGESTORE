import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * POST /api/v1/workspaces/[id]/trash/[imageId]/restore
 * Restores a soft-deleted image back to the active workspace gallery.
 * Restricted to workspace OWNER only.
 */
export async function POST(
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
    });

    if (!membership) {
      return apiError("NOT_FOUND", "Workspace not found.", undefined, 404);
    }

    if (membership.role !== "OWNER") {
      return apiError(
        "FORBIDDEN",
        "Only the workspace Owner can restore deleted assets.",
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

    await prisma.$transaction([
      prisma.image.update({
        where: { id: imageId },
        data: {
          deletedAt: null,
          deletedById: null,
          permanentDeleteAt: null,
        },
      }),
      prisma.activityLog.create({
        data: {
          workspaceId,
          userId: user.id,
          action: "IMAGE_RESTORED",
          metadata: {
            imageId: image.id,
            fileName: image.fileName,
          },
        },
      }),
    ]);

    return apiSuccess({
      message: `Image "${image.fileName}" restored to workspace.`,
      imageId: image.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
