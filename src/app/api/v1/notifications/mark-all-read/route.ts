import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * POST /api/v1/notifications/mark-all-read
 * Atomically marks all unread notifications for the authenticated user as read.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return apiSuccess({
      markedCount: result.count,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
