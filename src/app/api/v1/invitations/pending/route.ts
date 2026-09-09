import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * GET /api/v1/invitations/pending
 * List all active invitations for the currently authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const invitations = await prisma.workspaceInvitation.findMany({
      where: {
        email: user.email.toLowerCase(),
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        workspace: {
          select: { id: true, name: true },
        },
        invitedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = invitations.map((inv) => ({
      id: inv.id,
      token: inv.token,
      workspaceId: inv.workspace.id,
      workspaceName: inv.workspace.name,
      role: inv.role,
      invitedByName: inv.invitedBy.name || inv.invitedBy.email,
      expiresAt: inv.expiresAt,
    }));

    return apiSuccess(formatted);
  } catch (error) {
    return handleApiError(error);
  }
}
