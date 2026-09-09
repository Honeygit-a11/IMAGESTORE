import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * DELETE /api/v1/workspaces/[id]/invitations/[invitationId]
 * Cancel pending invitation (Owner only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const { id, invitationId } = await params;

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId: user.id,
        },
      },
    });

    if (!membership || membership.role !== "OWNER") {
      return apiError("FORBIDDEN", "Only the workspace owner can cancel invitations.", undefined, 403);
    }

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.workspaceId !== id) {
      return apiError("NOT_FOUND", "Invitation not found.", undefined, 404);
    }

    // Delete or mark cancelled
    await prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: { status: "CANCELLED" },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        workspaceId: id,
        userId: user.id,
        action: "MEMBER_INVITATION_CANCELLED",
        metadata: {
          cancelledEmail: invitation.email,
          role: invitation.role,
        },
      },
    });

    return apiSuccess({ message: "Invitation successfully cancelled." });
  } catch (error) {
    return handleApiError(error);
  }
}
