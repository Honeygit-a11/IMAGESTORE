import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { createSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE_DAYS } from "@/lib/auth/session";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/auth/callback/google
 * Handles Google OAuth 2.0 authorization callback, exchanges code for token,
 * fetches user identity, links or provisions user, and establishes session.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const storedState = req.cookies.get("oauth_state")?.value;
  const baseUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (errorParam || !code || !state || !storedState || state !== storedState) {
    const errorMsg = errorParam || "invalid_oauth_state";
    const redirectRes = NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(errorMsg)}`,
      302
    );
    redirectRes.cookies.delete("oauth_state");
    return redirectRes;
  }

  try {
    const redirectUri = `${baseUrl}/api/v1/auth/callback/google`;

    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[Google Token Exchange Failed]", tokenData);
      const redirectRes = NextResponse.redirect(
        `${baseUrl}/login?error=token_exchange_failed`,
        302
      );
      redirectRes.cookies.delete("oauth_state");
      return redirectRes;
    }

    // Fetch user profile from Google UserInfo endpoint
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await userInfoRes.json();

    if (!userInfoRes.ok || !profile.email) {
      console.error("[Google UserInfo Failed]", profile);
      const redirectRes = NextResponse.redirect(
        `${baseUrl}/login?error=profile_fetch_failed`,
        302
      );
      redirectRes.cookies.delete("oauth_state");
      return redirectRes;
    }

    const email = (profile.email as string).toLowerCase().trim();
    const name = profile.name || profile.given_name || email.split("@")[0];
    const image = profile.picture || null;

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Update user details if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          image: user.image || image,
          emailVerified: user.emailVerified || new Date(),
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name,
          image,
          authProvider: "GOOGLE",
          emailVerified: new Date(),
        },
      });
    }

    // Establish active session in database
    const sessionToken = await createSession(user.id, req);

    const redirectRes = NextResponse.redirect(`${baseUrl}/dashboard`, 302);

    // Set secure session cookie
    redirectRes.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60,
      path: "/",
    });

    // Clear one-time oauth_state cookie
    redirectRes.cookies.delete("oauth_state");

    return redirectRes;
  } catch (error) {
    console.error("[Google OAuth Callback Error]", error);
    const redirectRes = NextResponse.redirect(
      `${baseUrl}/login?error=oauth_callback_failed`,
      302
    );
    redirectRes.cookies.delete("oauth_state");
    return redirectRes;
  }
}
