import { NextRequest } from "next/server";
import { getCurrentUser, revokeAllUserSessions, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Not authenticated", undefined, 401);
    }

    const currentToken =
      req.cookies.get(SESSION_COOKIE_NAME)?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    await revokeAllUserSessions(user.id, currentToken);

    return apiSuccess({
      message: "All other sessions have been successfully logged out",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
