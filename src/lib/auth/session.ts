import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";

export const SESSION_COOKIE_NAME = "imagespace_session";
export const SESSION_MAX_AGE_DAYS = 30;

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Creates a new active session record in UserSession and returns the token.
 */
export async function createSession(
  userId: string,
  req?: NextRequest
): Promise<string> {
  const sessionToken = generateSecureToken(32);
  const expiresAt = new Date(
    Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  );

  let userAgent = "Unknown Browser";
  let ipAddress = "127.0.0.1";

  if (req) {
    userAgent = req.headers.get("user-agent") || userAgent;
    ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      ipAddress;
  }

  await prisma.userSession.create({
    data: {
      userId,
      sessionToken,
      userAgent,
      ipAddress,
      expiresAt,
    },
  });

  return sessionToken;
}

/**
 * Validates a session token from cookie or header and returns user & session data.
 */
export async function validateSession(sessionToken: string) {
  if (!sessionToken) return null;

  const session = await prisma.userSession.findUnique({
    where: { sessionToken },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          authProvider: true,
          storageUsedBytes: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    // Session expired
    await prisma.userSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Update last active time (sliding touch)
  await prisma.userSession
    .update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    })
    .catch(() => {});

  return session;
}

/**
 * Helper to get the current authenticated user from incoming request or server cookies.
 */
export async function getCurrentUser(req?: NextRequest) {
  let token: string | undefined;

  if (req) {
    // Check Authorization Bearer header first
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    }
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  }

  if (!token) return null;

  const sessionData = await validateSession(token);
  return sessionData?.user ?? null;
}

/**
 * Revoke a specific session token.
 */
export async function revokeSession(sessionToken: string) {
  return prisma.userSession.deleteMany({
    where: { sessionToken },
  });
}

/**
 * Revoke all sessions for a user, optionally preserving the current one.
 */
export async function revokeAllUserSessions(
  userId: string,
  preserveToken?: string
) {
  return prisma.userSession.deleteMany({
    where: {
      userId,
      ...(preserveToken ? { sessionToken: { not: preserveToken } } : {}),
    },
  });
}
