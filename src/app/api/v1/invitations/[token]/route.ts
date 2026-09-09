import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const actionSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE"], {
    message: "Action must be ACCEPT or DECLINE",
  }),
});

/**
 * GET /api/v1/invitations/[token]
 * Preview invitation details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { id: true, name: true },
        },
        invitedBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (!invitation) {
      return apiError("NOT_FOUND", "Invitation not found.", undefined, 404);
    }

    const isExpired = invitation.expiresAt < new Date();

    return apiSuccess({
      id: invitation.id,
      email: invitation.email,
      workspaceName: invitation.workspace.name,
      role: invitation.role,
      invitedByName: invitation.invitedBy.name || invitation.invitedBy.email,
      status: isExpired ? "EXPIRED" : invitation.status,
      expiresAt: invitation.expiresAt,
      isExpired,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/v1/invitations/[token]
 * Accept or decline invitation
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Please sign in to accept or decline this invitation.", undefined, 401);
    }

    const { token } = await params;
    const body = await req.json();
    const { action } = actionSchema.parse(body);

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!invitation) {
      return apiError("NOT_FOUND", "Invitation not found.", undefined, 404);
    }

    if (invitation.status !== "PENDING") {
      return apiError(
        "INVITATION_RESOLVED",
        `This invitation has already been ${invitation.status.toLowerCase()}.`,
        undefined,
        400
      );
    }

    // Invariant 1: 7-day expiration check
    if (invitation.expiresAt < new Date()) {
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return apiError("INVITATION_EXPIRED", "This invitation has expired (valid for 7 days).", undefined, 400);
    }

    // If DECLINE
    if (action === "DECLINE") {
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: "DECLINED" },
      });

      await prisma.activityLog.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
          action: "MEMBER_INVITATION_DECLINED",
          metadata: { declinedByEmail: user.email },
        },
      });

      return apiSuccess({ message: "Invitation declined." });
    }

    // Invariant 2: Re-check workspace member capacity (< 3)
    if (invitation.workspace.members.length >= 3) {
      return apiError(
        "WORKSPACE_FULL",
        "This workspace has already reached its maximum capacity of 3 members.",
        undefined,
        400
      );
    }

    // Invariant 3: Re-check user workspace limit (< 2)
    const userWorkspacesCount = await prisma.workspaceMember.count({
      where: { userId: user.id },
    });

    if (userWorkspacesCount >= 2) {
      return apiError(
        "USER_WORKSPACE_LIMIT",
        "You already belong to the maximum allowed 2 workspaces.",
        undefined,
        400
      );
    }

    // Invariant 4: Check if already a member
    const alreadyMember = invitation.workspace.members.some((m) => m.userId === user.id);
    if (alreadyMember) {
      return apiError("ALREADY_MEMBER", "You are already a member of this workspace.", undefined, 400);
    }

    // Atomically accept invitation and create workspace member
    await prisma.$transaction([
      prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      }),
      prisma.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
          role: invitation.role,
        },
      }),
      prisma.activityLog.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
          action: "MEMBER_JOINED",
          metadata: {
            userEmail: user.email,
            role: invitation.role,
          },
        },
      }),
    ]);

    return apiSuccess({
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace.name,
      message: `You have successfully joined "${invitation.workspace.name}"!`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
