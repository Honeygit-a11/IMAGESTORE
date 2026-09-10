import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { parsePaginationParams, buildCursorPaginationMeta } from "@/lib/api/pagination";

/**
 * GET /api/v1/notifications
 * Returns cursor-paginated list of in-app notifications for the authenticated user
 * along with the total unread count.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const { limit, cursor } = parsePaginationParams(req);

    // Fetch notifications + unread count concurrently
    const [notifications, unreadCount, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        take: limit + 1,
        ...(cursor
          ? {
              skip: 1,
              cursor: { id: cursor },
            }
          : {}),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          link: true,
          read: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: {
          userId: user.id,
          read: false,
        },
      }),
      prisma.notification.count({
        where: { userId: user.id },
      }),
    ]);

    const { data, nextCursor } = buildCursorPaginationMeta(notifications, limit);

    return apiSuccess(
      {
        notifications: data,
        unreadCount,
      },
      {
        nextCursor,
        limit,
        total,
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
