import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { applySlidingWindowRateLimit } from "@/lib/auth/rate-limit";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const verifySchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  token: z.string().min(1, "Verification code or token is required").trim(),
});

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimit = applySlidingWindowRateLimit(`verify_email:${ip}`, 10, 900); // 10 per 15 min
    if (!rateLimit.success) {
      return apiError(
        "RATE_LIMIT_EXCEEDED",
        `Too many verification attempts. Please wait ${rateLimit.resetSeconds} seconds before trying again.`,
        undefined,
        429
      );
    }

    const body = await req.json();
    const { email, token } = verifySchema.parse(body);

    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token,
        type: "EMAIL_VERIFY",
      },
    });

    if (!record) {
      return apiError(
        "INVALID_TOKEN",
        "The verification code provided is invalid.",
        undefined,
        400
      );
    }

    if (record.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: record.id } }).catch(() => {});
      return apiError(
        "EXPIRED_TOKEN",
        "The verification code has expired. Please request a new verification email.",
        undefined,
        400
      );
    }

    // Mark user email verified
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Clean up consumed token
    await prisma.verificationToken.delete({ where: { id: record.id } }).catch(() => {});

    return apiSuccess({
      verified: true,
      message: "Email successfully verified. You may now sign in.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
