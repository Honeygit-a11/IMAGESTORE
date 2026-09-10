import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * PATCH /api/v1/notifications/[id]/read
 * Marks a single notification as read for the authenticated user.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const { id } = await context.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true, read: true },
    });

    if (!notification || notification.userId !== user.id) {
      return apiError("NOT_FOUND", "Notification not found", undefined, 404);
    }

    if (!notification.read) {
      await prisma.notification.update({
        where: { id },
        data: { read: true },
      });
    }

    return apiSuccess({ id, read: true });
  } catch (error) {
    return handleApiError(error);
  }
}
