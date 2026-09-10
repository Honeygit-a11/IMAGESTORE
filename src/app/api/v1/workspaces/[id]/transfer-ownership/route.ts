import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { sendInAppNotification } from "@/lib/notifications/service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const transferSchema = z.object({
  newOwnerUserId: z.string().min(1, "Target member ID is required"),
});

/**
 * POST /api/v1/workspaces/[id]/transfer-ownership
 * Transfer workspace ownership to another existing member
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

    const { id } = await params;
    const body = await req.json();
    const { newOwnerUserId } = transferSchema.parse(body);

    if (newOwnerUserId === user.id) {
      return apiError(
        "INVALID_TARGET",
        "You are already the owner of this workspace.",
        undefined,
        400
      );
    }

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

    if (workspace.ownerId !== user.id) {
      return apiError(
        "FORBIDDEN",
        "Only the current workspace owner can transfer ownership.",
        undefined,
        403
      );
    }

    // Verify target is an existing member of this workspace
    const targetMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId: newOwnerUserId,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!targetMember) {
      return apiError(
        "MEMBER_NOT_FOUND",
        "The selected user must be an active member of this workspace.",
        undefined,
        400
      );
    }

    const wsBytes = BigInt(workspace.storageUsedBytes);

    // Execute ownership transfer in a transaction
    await prisma.$transaction([
      // 1. Update workspace owner
      prisma.workspace.update({
        where: { id },
        data: { ownerId: newOwnerUserId },
      }),
      // 2. Set new owner's member role to OWNER
      prisma.workspaceMember.update({
        where: { id: targetMember.id },
        data: { role: "OWNER" },
      }),
      // 3. Demote previous owner to EDITOR
      prisma.workspaceMember.update({
        where: {
          workspaceId_userId: {
            workspaceId: id,
            userId: user.id,
          },
        },
        data: { role: "EDITOR" },
      }),
      // 4. Adjust storage accounting: decrement previous owner, increment new owner
      prisma.user.update({
        where: { id: user.id },
        data: {
          storageUsedBytes: {
            decrement: wsBytes > BigInt(0) ? wsBytes : BigInt(0),
          },
        },
      }),
      prisma.user.update({
        where: { id: newOwnerUserId },
        data: {
          storageUsedBytes: {
            increment: wsBytes > BigInt(0) ? wsBytes : BigInt(0),
          },
        },
      }),
      // 5. Create activity log
      prisma.activityLog.create({
        data: {
          workspaceId: id,
          userId: user.id,
          action: "OWNERSHIP_TRANSFERRED",
          metadata: {
            previousOwnerId: user.id,
            newOwnerId: newOwnerUserId,
            newOwnerEmail: targetMember.user.email,
          },
        },
      }),
    ]);

    await sendInAppNotification({
      userId: newOwnerUserId,
      type: "OWNERSHIP_TRANSFER_COMPLETED",
      title: "Workspace Ownership Transferred",
      message: `You are now the Owner of "${workspace.name}".`,
      link: `/workspaces/${id}`,
    });

    return apiSuccess({
      message: `Ownership of "${workspace.name}" successfully transferred to ${
        targetMember.user.name || targetMember.user.email
      }. You are now an Editor.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
