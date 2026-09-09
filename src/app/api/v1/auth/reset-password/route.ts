import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { revokeAllUserSessions } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const resetSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  token: z.string().min(1, "Reset code or token is required").trim(),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, token, newPassword } = resetSchema.parse(body);

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return apiError("WEAK_PASSWORD", strength.message || "Password is too weak", undefined, 422);
    }

    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token,
        type: "PASSWORD_RESET",
      },
    });

    if (!record) {
      return apiError(
        "INVALID_TOKEN",
        "The password reset code provided is invalid.",
        undefined,
        400
      );
    }

    if (record.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: record.id } }).catch(() => {});
      return apiError(
        "EXPIRED_TOKEN",
        "The password reset code has expired. Please request a new link.",
        undefined,
        400
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return apiError("USER_NOT_FOUND", "User account not found.", undefined, 404);
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and ensure email is verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: new Date(),
      },
    });

    // Revoke all active sessions across all devices for security
    await revokeAllUserSessions(user.id);

    // Delete consumed token
    await prisma.verificationToken.delete({ where: { id: record.id } }).catch(() => {});

    return apiSuccess({
      message:
        "Password has been successfully updated. All active sessions have been signed out. Please sign in with your new password.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
