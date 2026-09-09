import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Not authenticated", undefined, 401);
    }

    const currentToken =
      req.cookies.get(SESSION_COOKIE_NAME)?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    // Fetch active unexpired sessions
    const sessions = await prisma.userSession.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        sessionToken: true,
        userAgent: true,
        ipAddress: true,
        lastActiveAt: true,
        createdAt: true,
      },
      orderBy: { lastActiveAt: "desc" },
    });

    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent || "Unknown Device",
      ipAddress: s.ipAddress || "Unknown IP",
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      isCurrent: s.sessionToken === currentToken,
    }));

    return apiSuccess({ sessions: formattedSessions });
  } catch (error) {
    return handleApiError(error);
  }
}
