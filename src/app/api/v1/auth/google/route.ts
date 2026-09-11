import { NextRequest, NextResponse } from "next/server";
import { generateSecureToken } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { apiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/auth/google
 * Initiates Google OAuth 2.0 authorization code flow.
 */
export async function GET(_req: NextRequest) {
  try {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return apiError(
        "SERVICE_UNAVAILABLE",
        "Google OAuth is not configured. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        undefined,
        503
      );
    }

    const state = generateSecureToken(16);
    const baseUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const redirectUri = `${baseUrl}/api/v1/auth/callback/google`;

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("state", state);
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "select_account");

    const response = NextResponse.redirect(googleAuthUrl.toString(), 302);

    response.cookies.set({
      name: "oauth_state",
      value: state,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Google OAuth Init Error]", error);
    const baseUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_init_failed`, 302);
  }
}
