import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetFailedAttempts,
} from "@/lib/auth/rate-limit";
import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_DAYS,
} from "@/lib/auth/session";
import { apiError, handleApiError } from "@/lib/api/response";

const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const rateLimitKey = `${ip}:${email}`;
    const rateStatus = checkRateLimit(rateLimitKey);

    if (rateStatus.isLocked) {
      return apiError(
        "ACCOUNT_LOCKED",
        `Too many failed login attempts. Please try again in ${rateStatus.remainingLockSeconds} seconds.`,
        { retryAfterSeconds: rateStatus.remainingLockSeconds },
        429
      );
    }

    // Lookup user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        authProvider: true,
        emailVerified: true,
      },
    });

    if (!user) {
      const failStatus = recordFailedAttempt(rateLimitKey);
      return apiError(
        "INVALID_CREDENTIALS",
        "Invalid email or password.",
        failStatus.isLocked
          ? { locked: true, retryAfterSeconds: failStatus.lockoutSeconds }
          : { remainingAttempts: failStatus.remainingAttempts },
        401
      );
    }

    if (user.authProvider === "GOOGLE" || !user.passwordHash) {
      return apiError(
        "GOOGLE_ACCOUNT",
        "This account is associated with Google Sign-In. Please sign in using Google.",
        undefined,
        400
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      const failStatus = recordFailedAttempt(rateLimitKey);
      return apiError(
        "INVALID_CREDENTIALS",
        "Invalid email or password.",
        failStatus.isLocked
          ? { locked: true, retryAfterSeconds: failStatus.lockoutSeconds }
          : { remainingAttempts: failStatus.remainingAttempts },
        401
      );
    }

    // Check email verification gate
    if (!user.emailVerified) {
      return apiError(
        "EMAIL_NOT_VERIFIED",
        "Please verify your email address before signing in.",
        { email: user.email },
        403
      );
    }

    // Success: clear rate limit counter
    resetFailedAttempts(rateLimitKey);

    // Create active session in database
    const sessionToken = await createSession(user.id, req);

    // Build response with HTTP-only cookie
    const response = NextResponse.json(
      {
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          sessionToken,
        },
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
