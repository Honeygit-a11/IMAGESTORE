import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { verifyPassword, hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { dispatchSecurityAlert } from "@/lib/notifications/service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  code: z.string().trim().length(6, "Verification code must be 6 digits"),
});

/**
 * POST /api/v1/auth/password-change/verify
 * Verifies the current password and email confirmation code, then updates
 * the password hash and revokes other active sessions.
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

    const body = await req.json();
    const { currentPassword, newPassword, code } = changePasswordSchema.parse(body);

    // Validate new password strength
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return apiError("WEAK_PASSWORD", strength.message || "Password is not strong enough", undefined, 422);
    }

    // Fetch user password hash
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true, email: true },
    });

    if (!dbUser || !dbUser.passwordHash) {
      return apiError("USER_NOT_FOUND", "User account record could not be located.", undefined, 404);
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isCurrentValid) {
      return apiError(
        "INVALID_CURRENT_PASSWORD",
        "The current password you entered is incorrect.",
        undefined,
        400
      );
    }

    // Verify 6-digit one-time code
    const identifier = `password_change:${dbUser.email}`;
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        token: code,
        type: "PASSWORD_RESET",
      },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return apiError(
        "INVALID_OR_EXPIRED_CODE",
        "The verification code is invalid or has expired. Please request a new code.",
        undefined,
        400
      );
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Update password hash and delete token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      }),
      prisma.verificationToken.delete({
        where: { id: tokenRecord.id },
      }),
    ]);

    // Invalidate all other active sessions for security
    const currentToken =
      req.headers.get("authorization")?.startsWith("Bearer ")
        ? req.headers.get("authorization")?.substring(7)
        : req.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (currentToken) {
      await prisma.userSession.deleteMany({
        where: {
          userId: user.id,
          NOT: { sessionToken: currentToken },
        },
      });
    }

    // Dispatch security alerts (in-app + SMTP email)
    await dispatchSecurityAlert({
      userId: user.id,
      email: dbUser.email,
      title: "Password Changed",
      message: "Your ImageSpace account password was successfully updated. Other active device sessions were terminated for security.",
      metadata: {
        timestamp: new Date().toISOString(),
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return apiSuccess({
      message: "Password updated successfully. All other devices have been logged out.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
