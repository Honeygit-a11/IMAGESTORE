import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * GET /api/v1/workspaces/[id]/tags
 * Returns all unique tags in the workspace along with active image usage count
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

    // Membership check
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return apiError("NOT_FOUND", "Workspace not found or unauthorized.", undefined, 404);
    }

    // Query tags with active image count
    const tags = await prisma.tag.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            images: {
              where: {
                image: {
                  deletedAt: null,
                  uploadStatus: "COMPLETED",
                },
              },
            },
          },
        },
      },
    });

    const formatted = tags.map((t) => ({
      id: t.id,
      name: t.name,
      imageCount: t._count.images,
      createdAt: t.createdAt.toISOString(),
    }));

    return apiSuccess(formatted);
  } catch (error) {
    return handleApiError(error);
  }
}
