import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { processImage } from "@/lib/processing/image";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const completeSchema = z.object({
  tags: z
    .array(z.string().trim().min(1, "Tag cannot be empty").max(50, "Tag max 50 chars"))
    .max(20, "Maximum 20 tags per image")
    .optional()
    .default([]),
});

/**
 * POST /api/v1/workspaces/[id]/images/[imageId]/complete
 * Confirms direct upload to R2 was completed, updates storage tracking & records initial tags
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const { id: workspaceId, imageId } = await params;
    const body = await req.json().catch(() => ({}));
    const { tags } = completeSchema.parse(body);

    // Membership check & role check
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
      include: {
        workspace: true,
      },
    });

    if (!membership) {
      return apiError("NOT_FOUND", "Workspace not found or unauthorized.", undefined, 404);
    }

    if (membership.role === "VIEWER") {
      return apiError("FORBIDDEN", "Viewers cannot upload or finalize images.", undefined, 403);
    }

    // Image record verification
    const image = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!image || image.workspaceId !== workspaceId) {
      return apiError("NOT_FOUND", "Image record not found in this workspace.", undefined, 404);
    }

    // Idempotent: already completed
    if (image.uploadStatus === "COMPLETED") {
      return apiSuccess({
        imageId: image.id,
        fileName: image.fileName,
        status: "COMPLETED",
        message: "Image already completed.",
      });
    }

    const fileSize = BigInt(image.fileSize);
    const workspaceOwnerId = membership.workspace.ownerId;

    // Process in atomic transaction:
    // 1. Mark image COMPLETED
    // 2. Increment workspace storageUsedBytes
    // 3. Increment owner user storageUsedBytes
    // 4. Create tags and image-tag links
    // 5. Create activity log
    await prisma.$transaction(async (tx) => {
      // 1. Mark image PROCESSING
      await tx.image.update({
        where: { id: imageId },
        data: {
          uploadStatus: "PROCESSING",
        },
      });

      // 2. Increment workspace storage
      await tx.workspace.update({
        where: { id: workspaceId },
        data: {
          storageUsedBytes: {
            increment: fileSize,
          },
        },
      });

      // 3. Increment owner storage quota
      await tx.user.update({
        where: { id: workspaceOwnerId },
        data: {
          storageUsedBytes: {
            increment: fileSize,
          },
        },
      });

      // 4. Attach tags if provided
      if (tags.length > 0) {
        // Unique case-sensitive tags
        const uniqueTagNames = Array.from(new Set(tags));

        for (const tagName of uniqueTagNames) {
          // Upsert Tag in workspace
          const tag = await tx.tag.upsert({
            where: {
              workspaceId_name: {
                workspaceId,
                name: tagName,
              },
            },
            create: {
              workspaceId,
              name: tagName,
            },
            update: {},
          });

          // Link Tag to Image
          await tx.imageTag.upsert({
            where: {
              imageId_tagId: {
                imageId,
                tagId: tag.id,
              },
            },
            create: {
              imageId,
              tagId: tag.id,
            },
            update: {},
          });
        }
      }

      // 5. Activity log
      await tx.activityLog.create({
        data: {
          workspaceId,
          userId: user.id,
          action: "IMAGE_UPLOADED",
          metadata: {
            imageId: image.id,
            fileName: image.fileName,
            fileSize: Number(fileSize),
            fileType: image.fileType,
            tagsCount: tags.length,
          },
        },
      });
    });

    // 2. Run Image processing & thumbnail generation
    const processResult = await processImage(imageId);

    return apiSuccess({
      imageId: image.id,
      fileName: image.fileName,
      status: processResult.success ? "COMPLETED" : "FAILED",
      thumbnailKey: processResult.thumbnailKey || null,
      fileSize: Number(fileSize),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
