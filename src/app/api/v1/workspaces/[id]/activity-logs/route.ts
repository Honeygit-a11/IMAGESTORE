import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { parsePaginationParams, buildCursorPaginationMeta } from "@/lib/api/pagination";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const IMAGE_ACTIONS = [
  "IMAGE_UPLOADED",
  "IMAGE_DELETED",
  "IMAGE_RESTORED",
  "IMAGE_PERMANENTLY_DELETED",
  "TRASH_EMPTIED",
];

const MEMBER_ACTIONS = [
  "WORKSPACE_CREATED",
  "MEMBER_INVITED",
  "INVITATION_ACCEPTED",
  "INVITATION_DECLINED",
  "INVITATION_CANCELLED",
  "INVITATION_EXPIRED",
  "MEMBER_JOINED",
  "MEMBER_REMOVED",
  "MEMBER_LEFT",
  "ROLE_CHANGED",
  "OWNERSHIP_TRANSFERRED",
];

const TAG_ACTIONS = ["TAG_ADDED", "TAG_REMOVED"];

/**
 * GET /api/v1/workspaces/[id]/activity-logs
 * Returns cursor-paginated timeline of workspace activity.
 * Query parameters:
 * - category: 'all' | 'images' | 'members' | 'tags'
 * - cursor: pagination cursor
 * - limit: max records (default 20, max 100)
 *
 * Privacy & Senior Backend Rule:
 * - Visible to all current members of the workspace.
 * - For IMAGE_UPLOADED actions, original uploader identity is visible only to OWNER.
 * - For EDITOR and VIEWER, uploader actor details are masked.
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
    const category = searchParams.get("category")?.toLowerCase() || "all";

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

    // Build filter
    const where: Prisma.ActivityLogWhereInput = {
      workspaceId,
    };

    if (category === "images") {
      where.action = { in: IMAGE_ACTIONS };
    } else if (category === "members") {
      where.action = { in: MEMBER_ACTIONS };
    } else if (category === "tags") {
      where.action = { in: TAG_ACTIONS };
    }

    // Query activity logs
    const items = await prisma.activityLog.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const total = await prisma.activityLog.count({ where });

    // Format logs with privacy rules
    const formatted = items.map((log) => {
      const isUploadAction = log.action === "IMAGE_UPLOADED";
      const hideActor = isUploadAction && !isOwner;

      let actor = null;
      if (!hideActor && log.user) {
        actor = {
          id: log.user.id,
          name: log.user.name,
          email: log.user.email,
        };
      }

      return {
        id: log.id,
        action: log.action,
        metadata: log.metadata,
        createdAt: log.createdAt.toISOString(),
        actor,
        isActorMasked: hideActor,
      };
    });

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
