import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { generateVerificationCode } from "@/lib/auth/session";
import { sendVerificationEmail } from "@/lib/email/mailer";
import { applySlidingWindowRateLimit } from "@/lib/auth/rate-limit";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimit = applySlidingWindowRateLimit(`register:${ip}`, 5, 3600); // 5 per hour
    if (!rateLimit.success) {
      return apiError(
        "RATE_LIMIT_EXCEEDED",
        `Too many account creation attempts. Please wait ${rateLimit.resetSeconds} seconds before trying again.`,
        undefined,
        429
      );
    }

    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return apiError("WEAK_PASSWORD", strength.message || "Password is too weak", undefined, 422);
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    });

    if (existing) {
      return apiError(
        "EMAIL_ALREADY_EXISTS",
        "An account with this email address already exists",
        undefined,
        409
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user (inactive until email is verified)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        authProvider: "CREDENTIALS",
        emailVerified: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Invalidate any older tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email, type: "EMAIL_VERIFY" },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationCode,
        type: "EMAIL_VERIFY",
        expiresAt,
      },
    });

    // Send verification email
    await sendVerificationEmail(email, verificationCode);

    return apiSuccess(
      {
        email: user.email,
        message: "Registration successful. Please verify your email to log in.",
        requiresVerification: true,
      },
      undefined,
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
