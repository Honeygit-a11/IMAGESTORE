import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return apiError("UNAUTHORIZED", "Not authenticated", undefined, 401);
    }

    // Fetch workspace usage and counts
    const [ownedCount, memberCount] = await Promise.all([
      prisma.workspace.count({ where: { ownerId: user.id } }),
      prisma.workspaceMember.count({
        where: { userId: user.id, role: { not: "OWNER" } },
      }),
    ]);

    const totalWorkspaces = ownedCount + memberCount;

    return apiSuccess({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
      storage: {
        usedBytes: Number(user.storageUsedBytes),
        maxBytes: 500 * 1024 * 1024, // 500 MB
        usedFormatted: `${(Number(user.storageUsedBytes) / (1024 * 1024)).toFixed(1)} MB`,
        maxFormatted: "500 MB",
        percentUsed: Math.min(
          100,
          Math.round(
            (Number(user.storageUsedBytes) / (500 * 1024 * 1024)) * 100
          )
        ),
      },
      workspaces: {
        currentCount: totalWorkspaces,
        maxCount: 2,
        canCreate: totalWorkspaces < 2,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
