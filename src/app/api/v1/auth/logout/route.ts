import { NextRequest, NextResponse } from "next/server";
import {
  revokeSession,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await revokeSession(token);
    }

    const response = NextResponse.json(
      {
        data: { message: "Successfully logged out" },
      },
      { status: 200 }
    );

    // Clear session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
