import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Not authenticated", undefined, 401);
    }

    const { id } = await params;

    const session = await prisma.userSession.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!session) {
      return apiError("NOT_FOUND", "Session not found", undefined, 404);
    }

    if (session.userId !== user.id) {
      return apiError("FORBIDDEN", "Cannot revoke sessions of other users", undefined, 403);
    }

    await prisma.userSession.delete({
      where: { id },
    });

    return apiSuccess({ message: "Session successfully revoked" });
  } catch (error) {
    return handleApiError(error);
  }
}
