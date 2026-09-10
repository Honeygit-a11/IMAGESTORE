import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { sendInAppNotification } from "@/lib/notifications/service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const updateRoleSchema = z.object({
  role: z.enum(["EDITOR", "VIEWER"], {
    message: "Role can only be EDITOR or VIEWER",
  }),
});

/**
 * PATCH /api/v1/workspaces/[id]/members/[memberId]
 * Update member role (Owner only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const { id, memberId } = await params;
    const body = await req.json();
    const { role } = updateRoleSchema.parse(body);

    // Verify caller is OWNER
    const callerMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId: user.id,
        },
      },
    });

    if (!callerMembership || callerMembership.role !== "OWNER") {
      return apiError("FORBIDDEN", "Only the workspace owner can change member roles.", undefined, 403);
    }

    // Find target member
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!targetMember || targetMember.workspaceId !== id) {
      return apiError("NOT_FOUND", "Member not found in this workspace.", undefined, 404);
    }

    if (targetMember.role === "OWNER") {
      return apiError(
        "CANNOT_CHANGE_OWNER_ROLE",
        "Owner role cannot be changed directly. Use ownership transfer instead.",
        undefined,
        400
      );
    }

    // Update role
    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      select: {
        id: true,
        userId: true,
        role: true,
        joinedAt: true,
      },
    });

    // Log role change in ActivityLog
    await prisma.activityLog.create({
      data: {
        workspaceId: id,
        userId: user.id,
        action: "ROLE_CHANGED",
        metadata: {
          targetUserId: targetMember.userId,
          targetEmail: targetMember.user.email,
          newRole: role,
        },
      },
    });

    await sendInAppNotification({
      userId: targetMember.userId,
      type: "MEMBER_ROLE_CHANGED",
      title: "Role Updated",
      message: `Your role in the workspace was changed to ${role}.`,
      link: `/workspaces/${id}`,
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/v1/workspaces/[id]/members/[memberId]
 * Remove member (by Owner) or leave workspace (by Editor/Viewer)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const { id, memberId } = await params;

    const callerMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId: user.id,
        },
      },
    });

    if (!callerMembership) {
      return apiError("FORBIDDEN", "You do not have access to this workspace.", undefined, 403);
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!targetMember || targetMember.workspaceId !== id) {
      return apiError("NOT_FOUND", "Member not found in this workspace.", undefined, 404);
    }

    // Rule: Owner cannot leave without transferring ownership
    if (targetMember.role === "OWNER") {
      return apiError(
        "OWNER_CANNOT_LEAVE",
        "The workspace owner cannot leave without transferring ownership first.",
        undefined,
        400
      );
    }

    // Must be either the owner removing someone, or the user removing themselves (leaving)
    const isOwner = callerMembership.role === "OWNER";
    const isSelf = targetMember.userId === user.id;

    if (!isOwner && !isSelf) {
      return apiError("FORBIDDEN", "You do not have permission to remove this member.", undefined, 403);
    }

    // Remove member (images remain preserved in the workspace per platform rule)
    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        workspaceId: id,
        userId: user.id,
        action: isSelf ? "MEMBER_LEFT" : "MEMBER_REMOVED",
        metadata: {
          removedUserId: targetMember.userId,
          removedEmail: targetMember.user.email,
          removedByUserId: user.id,
        },
      },
    });

    if (!isSelf) {
      await sendInAppNotification({
        userId: targetMember.userId,
        type: "MEMBER_REMOVED",
        title: "Removed from Workspace",
        message: `You were removed from a workspace by the owner.`,
        link: "/dashboard",
      });
    }

    return apiSuccess({
      message: isSelf
        ? "You have successfully left the workspace."
        : `Member ${targetMember.user.name || targetMember.user.email} removed from workspace.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
