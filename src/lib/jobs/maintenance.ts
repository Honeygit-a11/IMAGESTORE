import prisma from "@/lib/db/prisma";
import { deleteR2Object } from "@/lib/storage/r2";

export interface MaintenanceRunResult {
  failedUploadsCleaned: number;
  expiredInvitationsMarked: number;
  permanentTrashCleaned: number;
  timestamp: string;
}

/**
 * Cleanup abandoned or failed uploads:
 * - Stuck in PENDING or PROCESSING for > 2 hours
 * - Marked as FAILED for > 24 hours
 */
export async function cleanupFailedUploads(): Promise<number> {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const staleImages = await prisma.image.findMany({
    where: {
      OR: [
        {
          uploadStatus: { in: ["PENDING", "PROCESSING"] },
          createdAt: { lt: twoHoursAgo },
        },
        {
          uploadStatus: "FAILED",
          createdAt: { lt: twentyFourHoursAgo },
        },
      ],
    },
    select: {
      id: true,
      storageKey: true,
      thumbnailKey: true,
    },
  });

  let cleaned = 0;
  for (const img of staleImages) {
    if (img.storageKey && img.storageKey !== "pending") {
      await deleteR2Object(img.storageKey);
    }
    if (img.thumbnailKey) {
      await deleteR2Object(img.thumbnailKey);
    }
    await prisma.image.delete({ where: { id: img.id } }).catch(() => {});
    cleaned++;
  }

  return cleaned;
}

/**
 * Reconcile invitations that have expired after 7 days
 */
export async function cleanupExpiredInvitations(): Promise<number> {
  const now = new Date();

  const expiredInvitations = await prisma.workspaceInvitation.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
    },
    select: {
      id: true,
      workspaceId: true,
      email: true,
      role: true,
    },
  });

  if (expiredInvitations.length === 0) return 0;

  let marked = 0;
  for (const inv of expiredInvitations) {
    await prisma.$transaction([
      prisma.workspaceInvitation.update({
        where: { id: inv.id },
        data: { status: "EXPIRED" },
      }),
      prisma.activityLog.create({
        data: {
          workspaceId: inv.workspaceId,
          action: "INVITATION_EXPIRED",
          metadata: {
            invitationId: inv.id,
            email: inv.email,
            role: inv.role,
          },
        },
      }),
    ]);
    marked++;
  }

  return marked;
}

/**
 * Permanently purge images from Trash that have exceeded the 30-day retention period.
 * 1. Removes files from Cloudflare R2 (original + thumbnail)
 * 2. Releases user and workspace storage quota
 * 3. Deletes records from database
 * 4. Records audit log
 */
export async function cleanupPermanentTrash(): Promise<number> {
  const now = new Date();

  const trashImages = await prisma.image.findMany({
    where: {
      deletedAt: { not: null },
      permanentDeleteAt: { lte: now },
    },
    include: {
      workspace: {
        select: {
          id: true,
          ownerId: true,
        },
      },
    },
  });

  let purged = 0;
  for (const img of trashImages) {
    const fileSize = BigInt(img.fileSize);
    const workspaceId = img.workspaceId;
    const ownerId = img.workspace.ownerId;

    // 1. Delete binary from R2
    if (img.storageKey) await deleteR2Object(img.storageKey);
    if (img.thumbnailKey) await deleteR2Object(img.thumbnailKey);

    // 2. Adjust storage quotas and remove record
    await prisma.$transaction([
      prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          storageUsedBytes: {
            decrement: fileSize,
          },
        },
      }),
      prisma.user.update({
        where: { id: ownerId },
        data: {
          storageUsedBytes: {
            decrement: fileSize,
          },
        },
      }),
      prisma.activityLog.create({
        data: {
          workspaceId,
          userId: img.deletedById || undefined,
          action: "IMAGE_PERMANENTLY_DELETED",
          metadata: {
            imageId: img.id,
            fileName: img.fileName,
            fileSize: Number(fileSize),
            retentionExpired: true,
          },
        },
      }),
      prisma.image.delete({
        where: { id: img.id },
      }),
    ]);

    purged++;
  }

  return purged;
}

/**
 * Execute all automated maintenance workers sequentially
 */
export async function runAllMaintenanceJobs(): Promise<MaintenanceRunResult> {
  const failedUploadsCleaned = await cleanupFailedUploads();
  const expiredInvitationsMarked = await cleanupExpiredInvitations();
  const permanentTrashCleaned = await cleanupPermanentTrash();

  return {
    failedUploadsCleaned,
    expiredInvitationsMarked,
    permanentTrashCleaned,
    timestamp: new Date().toISOString(),
  };
}
