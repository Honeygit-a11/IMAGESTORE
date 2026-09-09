import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, generateSecureToken } from "@/lib/auth/session";
import { sendWorkspaceInvitationEmail } from "@/lib/email/mailer";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  role: z.enum(["EDITOR", "VIEWER"], {
    message: "Role must be either EDITOR or VIEWER",
  }),
});

/**
 * GET /api/v1/workspaces/[id]/invitations
 * List pending invitations for the workspace (Owner only)
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

    // Check caller is OWNER
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId: user.id,
        },
      },
    });

    if (!membership || membership.role !== "OWNER") {
      return apiError("FORBIDDEN", "Only the workspace owner can view invitations.", undefined, 403);
    }

    // Fetch active pending invitations
    const invitations = await prisma.workspaceInvitation.findMany({
      where: {
        workspaceId: id,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });

    // Automatically check and mark expired ones
    const now = new Date();
    const formatted = invitations.map((inv) => {
      const isExpired = inv.expiresAt < now;
      return {
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: isExpired ? "EXPIRED" : inv.status,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      };
    });

    return apiSuccess(formatted);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/v1/workspaces/[id]/invitations
 * Send workspace invitation
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
    const { email, role } = inviteSchema.parse(body);

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: true,
        invitations: {
          where: {
            status: "PENDING",
            expiresAt: { gt: new Date() },
          },
        },
      },
    });

    if (!workspace) {
      return apiError("NOT_FOUND", "Workspace not found.", undefined, 404);
    }

    if (workspace.ownerId !== user.id) {
      return apiError("FORBIDDEN", "Only the workspace owner can invite members.", undefined, 403);
    }

    // Invariant 1: Maximum 3 total members per workspace (including active pending invites)
    const activeSlots = workspace.members.length + workspace.invitations.length;
    if (activeSlots >= 3) {
      return apiError(
        "WORKSPACE_CAPACITY_FULL",
        "Workspace cannot exceed 3 total members. Active members and pending invitations have filled all slots.",
        { currentMembers: workspace.members.length, pendingInvitations: workspace.invitations.length, maxMembers: 3 },
        400
      );
    }

    // Invariant 2: Check if invited email belongs to user who already has 2 workspaces
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: true,
      },
    });

    if (existingUser) {
      // Check if user is already in THIS workspace
      const isAlreadyMember = workspace.members.some((m) => m.userId === existingUser.id);
      if (isAlreadyMember) {
        return apiError("ALREADY_MEMBER", "User is already a member of this workspace.", undefined, 400);
      }

      // Check if user already has 2 workspaces
      if (existingUser.memberships.length >= 2) {
        return apiError(
          "USER_WORKSPACE_LIMIT_REACHED",
          "The invited user already belongs to the maximum allowed 2 workspaces.",
          undefined,
          400
        );
      }
    }

    // Invariant 3: Prevent duplicate pending invitations for same email
    const duplicatePending = workspace.invitations.some(
      (inv) => inv.email.toLowerCase() === email.toLowerCase()
    );
    if (duplicatePending) {
      return apiError(
        "INVITATION_ALREADY_PENDING",
        "A pending invitation has already been sent to this email address.",
        undefined,
        409
      );
    }

    // Invariant 4: 7-Day Expiration
    const token = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspaceId: id,
        email,
        role,
        invitedById: user.id,
        token,
        status: "PENDING",
        expiresAt,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Send email notification via SMTP
    await sendWorkspaceInvitationEmail(
      email,
      workspace.name,
      role,
      user.name || user.email,
      token
    );

    // Log action in ActivityLog
    await prisma.activityLog.create({
      data: {
        workspaceId: id,
        userId: user.id,
        action: "MEMBER_INVITATION_SENT",
        metadata: {
          invitedEmail: email,
          role,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    return apiSuccess(invitation, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
