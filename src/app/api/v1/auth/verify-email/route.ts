import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const verifySchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  token: z.string().min(1, "Verification code or token is required").trim(),
});

export async function POST(req: NextRequest) {
  try {
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
