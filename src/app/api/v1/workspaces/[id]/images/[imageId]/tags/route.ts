import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const addTagSchema = z.object({
  tagName: z.string().trim().min(1, "Tag cannot be empty").max(50, "Tag max 50 chars"),
});

const removeTagSchema = z.object({
  tagName: z.string().trim().min(1, "Tag name required"),
});

const MAX_TAGS_PER_IMAGE = 20;

/**
 * POST /api/v1/workspaces/[id]/images/[imageId]/tags
 * Adds a case-sensitive tag to an image.
 * Permissions: OWNER and EDITOR only.
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
    const body = await req.json();
    const { tagName } = addTagSchema.parse(body);

    // Membership check: only OWNER and EDITOR can edit tags
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return apiError("NOT_FOUND", "Workspace not found.", undefined, 404);
    }

    if (membership.role === "VIEWER") {
      return apiError("FORBIDDEN", "Viewers cannot add or modify image tags.", undefined, 403);
    }

    // Verify image belongs to workspace
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: {
        tags: true,
      },
    });

    if (!image || image.workspaceId !== workspaceId) {
      return apiError("NOT_FOUND", "Image not found in this workspace.", undefined, 404);
    }

    // Cap check: maximum 20 tags per image
    if (image.tags.length >= MAX_TAGS_PER_IMAGE) {
      return apiError(
        "MAX_TAGS_EXCEEDED",
        `Maximum ${MAX_TAGS_PER_IMAGE} tags per image exceeded.`,
        undefined,
        400
      );
    }

    // Upsert Tag in workspace (case-sensitive)
    const tag = await prisma.tag.upsert({
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

    // Check if already linked
    const existingLink = await prisma.imageTag.findUnique({
      where: {
        imageId_tagId: {
          imageId,
          tagId: tag.id,
        },
      },
    });

    if (existingLink) {
      return apiSuccess({
        message: `Image already has tag "${tagName}".`,
        tag: { id: tag.id, name: tag.name },
      });
    }

    // Link tag to image & log activity
    await prisma.$transaction([
      prisma.imageTag.create({
        data: {
          imageId,
          tagId: tag.id,
        },
      }),
      prisma.activityLog.create({
        data: {
          workspaceId,
          userId: user.id,
          action: "TAG_ADDED",
          metadata: {
            imageId,
            fileName: image.fileName,
            tagName: tag.name,
          },
        },
      }),
    ]);

    return apiSuccess({
      message: `Tag "${tagName}" added to image.`,
      tag: { id: tag.id, name: tag.name },
    }, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/v1/workspaces/[id]/images/[imageId]/tags
 * Removes a tag from an image.
 * Permissions: OWNER and EDITOR only.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const { id: workspaceId, imageId } = await params;
    const body = await req.json();
    const { tagName } = removeTagSchema.parse(body);

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return apiError("NOT_FOUND", "Workspace not found.", undefined, 404);
    }

    if (membership.role === "VIEWER") {
      return apiError("FORBIDDEN", "Viewers cannot remove image tags.", undefined, 403);
    }

    const tag = await prisma.tag.findUnique({
      where: {
        workspaceId_name: {
          workspaceId,
          name: tagName,
        },
      },
    });

    if (!tag) {
      return apiError("NOT_FOUND", "Tag not found in this workspace.", undefined, 404);
    }

    const link = await prisma.imageTag.findUnique({
      where: {
        imageId_tagId: {
          imageId,
          tagId: tag.id,
        },
      },
    });

    if (!link) {
      return apiError("NOT_FOUND", "Tag is not attached to this image.", undefined, 404);
    }

    await prisma.$transaction([
      prisma.imageTag.delete({
        where: { id: link.id },
      }),
      prisma.activityLog.create({
        data: {
          workspaceId,
          userId: user.id,
          action: "TAG_REMOVED",
          metadata: {
            imageId,
            tagName: tag.name,
          },
        },
      }),
    ]);

    return apiSuccess({
      message: `Tag "${tagName}" removed from image.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
