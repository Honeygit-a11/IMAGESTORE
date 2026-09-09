import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const bulkDeleteSchema = z.object({
  imageIds: z
    .array(z.string().min(1))
    .min(1, "Select at least 1 image")
    .max(10, "Maximum 10 images can be deleted at one time"),
});

/**
 * POST /api/v1/workspaces/[id]/images/bulk-delete
 * Soft-deletes up to 10 images at one time to Trash.
 * Permissions:
 * - OWNER: can delete any selected images.
 * - EDITOR: can only delete selected images they uploaded.
 * - VIEWER: cannot delete.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const { id: workspaceId } = await params;
    const body = await req.json();
    const { imageIds } = bulkDeleteSchema.parse(body);

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

    if (membership.role === "VIEWER") {
      return apiError("FORBIDDEN", "Viewers cannot delete images.", undefined, 403);
    }

    // Find candidate images
    const images = await prisma.image.findMany({
      where: {
        id: { in: imageIds },
        workspaceId,
        deletedAt: null,
      },
    });

    if (images.length === 0) {
      return apiError("NOT_FOUND", "No valid active images found to delete.", undefined, 404);
    }

    // Filter by role: Editors can only delete images they uploaded
    const authorizedImages = images.filter(
      (img) => membership.role === "OWNER" || img.uploadedById === user.id
    );

    if (authorizedImages.length === 0) {
      return apiError(
        "FORBIDDEN",
        "You do not have permission to delete any of the selected images.",
        undefined,
        403
      );
    }

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const authorizedIds = authorizedImages.map((img) => img.id);

    await prisma.$transaction(async (tx) => {
      await tx.image.updateMany({
        where: { id: { in: authorizedIds } },
        data: {
          deletedAt: now,
          deletedById: user.id,
          permanentDeleteAt: thirtyDaysLater,
        },
      });

      for (const img of authorizedImages) {
        await tx.activityLog.create({
          data: {
            workspaceId,
            userId: user.id,
            action: "IMAGE_DELETED",
            metadata: {
              imageId: img.id,
              fileName: img.fileName,
              fileSize: Number(img.fileSize),
              bulk: true,
            },
          },
        });
      }
    });

    return apiSuccess({
      message: `${authorizedImages.length} image${
        authorizedImages.length > 1 ? "s" : ""
      } moved to Trash.`,
      deletedCount: authorizedImages.length,
      skippedCount: images.length - authorizedImages.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
