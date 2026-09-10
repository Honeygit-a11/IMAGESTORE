import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, generateVerificationCode } from "@/lib/auth/session";
import { sendPasswordChangeCodeEmail } from "@/lib/email/mailer";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * POST /api/v1/auth/password-change/request-code
 * Sends a 6-digit one-time email verification code to authorize password changes.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    if (user.authProvider !== "CREDENTIALS") {
      return apiError(
        "EXTERNAL_AUTH_PROVIDER",
        "Your account is managed via Google OAuth. Passwords cannot be set or changed directly.",
        undefined,
        400
      );
    }

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const identifier = `password_change:${user.email}`;

    // Upsert verification token
    await prisma.verificationToken.upsert({
      where: {
        identifier_token_type: {
          identifier,
          token: code,
          type: "PASSWORD_RESET",
        },
      },
      create: {
        identifier,
        token: code,
        type: "PASSWORD_RESET",
        expiresAt,
      },
      update: {
        expiresAt,
      },
    });

    // Send code email
    await sendPasswordChangeCodeEmail(user.email, code);

    return apiSuccess({
      message: "Verification code has been sent to your email address.",
      expiresInMinutes: 15,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
