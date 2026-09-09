import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { parsePaginationParams, buildCursorPaginationMeta } from "@/lib/api/pagination";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * GET /api/v1/workspaces/[id]/images
 * Returns cursor-paginated list of active images in the workspace.
 * Features:
 * - Search by filename
 * - Case-sensitive tag filter
 * - Multi-attribute sorting (newest, oldest, name_asc, name_desc, size_asc, size_desc)
 * - Senior Backend & Privacy Rule:
 *   - Only OWNER can see original uploader identity and upload timestamp.
 *   - EDITOR and VIEWER receive flat payloads with uploader identity omitted/null.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const { id: workspaceId } = await params;
    const { searchParams } = req.nextUrl;
    const { limit, cursor } = parsePaginationParams(req);

    const search = searchParams.get("search")?.trim();
    const tag = searchParams.get("tag")?.trim();
    const sort = searchParams.get("sort")?.toLowerCase();

    // Validate membership
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return apiError("NOT_FOUND", "Workspace not found or unauthorized.", undefined, 404);
    }

    const isOwner = membership.role === "OWNER";

    // Build WHERE clause
    const where: Prisma.ImageWhereInput = {
      workspaceId,
      deletedAt: null,
      uploadStatus: "COMPLETED",
      ...(search ? { fileName: { contains: search, mode: "insensitive" } } : {}),
      // Case-sensitive tag match: "Nature" != "nature"
      ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
    };

    // Build ORDER BY
    let orderBy: Prisma.ImageOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "oldest") orderBy = { createdAt: "asc" };
    else if (sort === "name_asc") orderBy = { fileName: "asc" };
    else if (sort === "name_desc") orderBy = { fileName: "desc" };
    else if (sort === "size_asc") orderBy = { fileSize: "asc" };
    else if (sort === "size_desc") orderBy = { fileSize: "desc" };

    // Query images with cursor pagination
    const items = await prisma.image.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy,
      include: {
        tags: {
          include: {
            tag: { select: { name: true } },
          },
        },
        uploadedBy: isOwner
          ? { select: { id: true, name: true, email: true } }
          : false,
      },
    });

    const total = await prisma.image.count({ where });

    // Format flat summary payload
    const formatted = items.map((img) => ({
      id: img.id,
      fileName: img.fileName,
      originalFileName: img.originalFileName,
      fileType: img.fileType,
      fileSize: Number(img.fileSize),
      thumbnailKey: img.thumbnailKey,
      storageKey: img.storageKey,
      // Privacy gate: Owner only sees uploader identity & upload time
      createdAt: isOwner ? img.createdAt.toISOString() : null,
      uploadedBy: isOwner && "uploadedBy" in img && img.uploadedBy
        ? (img.uploadedBy as { id: string; name: string | null; email: string })
        : null,
      tags: img.tags.map((it) => it.tag.name),
    }));

    const { data, nextCursor } = buildCursorPaginationMeta(formatted, limit);

    return apiSuccess(data, {
      nextCursor,
      limit,
      total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
