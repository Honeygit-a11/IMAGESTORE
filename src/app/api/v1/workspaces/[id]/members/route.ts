import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * GET /api/v1/workspaces/[id]/members
 * Returns all members of the workspace with their role and user details
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

    // Check caller membership
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

    // Fetch all members (max 3)
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    const formattedMembers = members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name || "Member",
      email: m.user.email,
      image: m.user.image,
      role: m.role,
      isOwner: m.role === "OWNER",
      isCurrentUser: m.userId === user.id,
      joinedAt: m.joinedAt,
    }));

    const memberCount = formattedMembers.length;
    const maxMembers = 3;
    const canInvite = callerMembership.role === "OWNER" && memberCount < maxMembers;

    return apiSuccess(formattedMembers, {
      total: memberCount,
      limit: maxMembers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
