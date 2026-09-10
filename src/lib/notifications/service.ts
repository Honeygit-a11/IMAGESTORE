import prisma from "@/lib/db/prisma";
import { sendSecurityAlertEmail } from "@/lib/email/mailer";
import { Prisma } from "@prisma/client";

export type NotificationType =
  | "INVITATION_RECEIVED"
  | "INVITATION_ACCEPTED"
  | "INVITATION_DECLINED"
  | "MEMBER_REMOVED"
  | "MEMBER_ROLE_CHANGED"
  | "OWNERSHIP_TRANSFER_REQUESTED"
  | "OWNERSHIP_TRANSFER_COMPLETED"
  | "WORKSPACE_DELETED"
  | "SECURITY_ALERT";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Persists an in-app notification to the recipient's inbox.
 */
export async function sendInAppNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        metadata: (params.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
      select: {
        id: true,
        userId: true,
        type: true,
        title: true,
        message: true,
        link: true,
        read: true,
        createdAt: true,
      },
    });

    return notification;
  } catch (err) {
    console.error("[Notification Service] Failed to create in-app notification:", err);
    return null;
  }
}

/**
 * Convenience dispatcher for security alerts that triggers both in-app
 * and SMTP email notification.
 */
export async function dispatchSecurityAlert(params: {
  userId: string;
  email: string;
  title: string;
  message: string;
  metadata?: Record<string, string | number | undefined>;
}) {
  // 1. In-app notification
  await sendInAppNotification({
    userId: params.userId,
    type: "SECURITY_ALERT",
    title: params.title,
    message: params.message,
    link: "/profile",
    metadata: params.metadata,
  });

  // 2. SMTP Transactional email
  await sendSecurityAlertEmail(
    params.email,
    params.title,
    params.message,
    params.metadata
  );
}

/**
 * Helper to get unread notifications count for a user.
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return await prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}
