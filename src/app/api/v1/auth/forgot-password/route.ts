import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { generateVerificationCode } from "@/lib/auth/session";
import { sendPasswordResetEmail } from "@/lib/email/mailer";
import { applySlidingWindowRateLimit } from "@/lib/auth/rate-limit";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimit = applySlidingWindowRateLimit(`forgot_password:${ip}`, 3, 900); // 3 per 15 min
    if (!rateLimit.success) {
      return apiError(
        "RATE_LIMIT_EXCEEDED",
        `Too many password reset requests. Please wait ${rateLimit.resetSeconds} seconds before requesting another reset.`,
        undefined,
        429
      );
    }

    const body = await req.json();
    const { email } = forgotSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, authProvider: true },
    });

    if (user && user.authProvider === "GOOGLE") {
      return apiError(
        "GOOGLE_ACCOUNT",
        "This account uses Google Sign-In. Password management is handled by Google.",
        undefined,
        400
      );
    }

    if (user && user.authProvider === "CREDENTIALS") {
      // Invalidate existing reset tokens for this email
      await prisma.verificationToken.deleteMany({
        where: { identifier: email, type: "PASSWORD_RESET" },
      });

      const resetToken = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: resetToken,
          type: "PASSWORD_RESET",
          expiresAt,
        },
      });

      await sendPasswordResetEmail(email, resetToken);
    }

    // Always return neutral response to prevent user enumeration
    return apiSuccess({
      message: "If that email address is in our system, password reset instructions have been sent.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
