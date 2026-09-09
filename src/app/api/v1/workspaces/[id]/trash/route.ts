import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { deleteR2Object } from "@/lib/storage/r2";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * GET /api/v1/workspaces/[id]/trash
 * Lists soft-deleted images in workspace Trash.
 * Restricted to workspace OWNER only.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const { id: workspaceId } = await params;

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
        "Only the workspace Owner has access to view or manage the Trash bin.",
        undefined,
        403
      );
    }

    const trashItems = await prisma.image.findMany({
      where: {
        workspaceId,
        deletedAt: { not: null },
      },
      orderBy: { deletedAt: "desc" },
      select: {
        id: true,
        fileName: true,
        originalFileName: true,
        fileType: true,
        fileSize: true,
        storageKey: true,
        thumbnailKey: true,
        deletedAt: true,
        permanentDeleteAt: true,
      },
    });

    const now = Date.now();
    const formatted = trashItems.map((item) => {
      const deleteTime = item.permanentDeleteAt ? new Date(item.permanentDeleteAt).getTime() : now;
      const msRemaining = Math.max(0, deleteTime - now);
      const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

      return {
        id: item.id,
        fileName: item.fileName,
        originalFileName: item.originalFileName,
        fileType: item.fileType,
        fileSize: Number(item.fileSize),
        thumbnailKey: item.thumbnailKey,
        storageKey: item.storageKey,
        deletedAt: item.deletedAt?.toISOString() || null,
        permanentDeleteAt: item.permanentDeleteAt?.toISOString() || null,
        daysRemaining,
      };
    });

    return apiSuccess(formatted);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/v1/workspaces/[id]/trash
 * Empties all items from Trash permanently.
 * - Deletes binaries from Cloudflare R2
 * - Decrements storage usage from workspace and workspace owner
 * - Deletes records from database
 * Restricted to workspace OWNER only.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const { id: workspaceId } = await params;

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
        "Only the workspace Owner can permanently empty the Trash bin.",
        undefined,
        403
      );
    }

    const trashImages = await prisma.image.findMany({
      where: {
        workspaceId,
        deletedAt: { not: null },
      },
    });

    if (trashImages.length === 0) {
      return apiSuccess({ message: "Trash is already empty.", purgedCount: 0 });
    }

    let totalBytesToFree = BigInt(0);
    const ownerId = membership.workspace.ownerId;

    for (const img of trashImages) {
      totalBytesToFree += BigInt(img.fileSize);
      if (img.storageKey) await deleteR2Object(img.storageKey);
      if (img.thumbnailKey) await deleteR2Object(img.thumbnailKey);
    }

    const trashIds = trashImages.map((img) => img.id);

    await prisma.$transaction([
      prisma.image.deleteMany({
        where: { id: { in: trashIds } },
      }),
      prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          storageUsedBytes: {
            decrement: totalBytesToFree,
          },
        },
      }),
      prisma.user.update({
        where: { id: ownerId },
        data: {
          storageUsedBytes: {
            decrement: totalBytesToFree,
          },
        },
      }),
      prisma.activityLog.create({
        data: {
          workspaceId,
          userId: user.id,
          action: "TRASH_EMPTIED",
          metadata: {
            purgedCount: trashImages.length,
            freedBytes: Number(totalBytesToFree),
          },
        },
      }),
    ]);

    return apiSuccess({
      message: `Trash emptied. ${trashImages.length} image${
        trashImages.length > 1 ? "s" : ""
      } permanently deleted and storage released.`,
      purgedCount: trashImages.length,
      freedMb: (Number(totalBytesToFree) / (1024 * 1024)).toFixed(1),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
