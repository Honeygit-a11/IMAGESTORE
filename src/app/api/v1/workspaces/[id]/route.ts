import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * GET /api/v1/workspaces/[id]
 * Fetch single workspace details
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

    const { id } = await params;

    // Check membership
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
            owner: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: {
                members: true,
                images: { where: { deletedAt: null } },
                tags: true,
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return apiError(
        "NOT_FOUND",
        "Workspace not found or you do not have access.",
        undefined,
        404
      );
    }

    // Count trash images
    const trashCount = await prisma.image.count({
      where: { workspaceId: id, deletedAt: { not: null } },
    });

    const ws = membership.workspace;

    return apiSuccess({
      id: ws.id,
      name: ws.name,
      owner: ws.owner,
      isOwner: membership.role === "OWNER",
      role: membership.role,
      memberCount: ws._count.members,
      imageCount: ws._count.images,
      tagCount: ws._count.tags,
      trashCount,
      storageUsedBytes: Number(ws.storageUsedBytes),
      storageUsedMb: (Number(ws.storageUsedBytes) / (1024 * 1024)).toFixed(1),
      createdAt: ws.createdAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/v1/workspaces/[id]
 * Destructive workspace deletion (Owner only)
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

    const { id } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        ownerId: true,
        storageUsedBytes: true,
      },
    });

    if (!workspace) {
      return apiError("NOT_FOUND", "Workspace not found.", undefined, 404);
    }

    // Rule: Only the OWNER can delete the workspace
    if (workspace.ownerId !== user.id) {
      return apiError(
        "FORBIDDEN",
        "Only the workspace owner can delete this workspace.",
        undefined,
        403
      );
    }

    // Deduct workspace storage from owner's total quota
    const wsBytes = BigInt(workspace.storageUsedBytes);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        storageUsedBytes: {
          decrement: wsBytes > BigInt(0) ? wsBytes : BigInt(0),
        },
      },
    });

    // Delete workspace (cascade removes members, images, tags, invitations, activity logs)
    await prisma.workspace.delete({
      where: { id },
    });

    return apiSuccess({
      message: `Workspace "${workspace.name}" and all associated data have been permanently deleted.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
