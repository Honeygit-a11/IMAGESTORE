import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(50, "Workspace name cannot exceed 50 characters")
    .trim(),
});

/**
 * GET /api/v1/workspaces
 * List workspaces for the authenticated user (both owned and member of)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    // Find all memberships for current user
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                members: true,
                images: { where: { deletedAt: null } },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const workspaces = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      role: m.role,
      ownerId: m.workspace.ownerId,
      isOwner: m.role === "OWNER",
      memberCount: m.workspace._count.members,
      imageCount: m.workspace._count.images,
      storageUsedBytes: Number(m.workspace.storageUsedBytes),
      storageUsedMb: (Number(m.workspace.storageUsedBytes) / (1024 * 1024)).toFixed(1),
      createdAt: m.workspace.createdAt,
    }));

    const totalWorkspaces = workspaces.length;
    const canCreate = totalWorkspaces < 2;

    return apiSuccess(workspaces, {
      total: totalWorkspaces,
      limit: 2,
      canCreate,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/v1/workspaces
 * Create a new workspace (enforcing max 2 workspaces per user)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", undefined, 401);
    }

    const body = await req.json();
    const { name } = createWorkspaceSchema.parse(body);

    // Rule: Maximum 2 workspaces per user
    const currentCount = await prisma.workspaceMember.count({
      where: { userId: user.id },
    });

    if (currentCount >= 2) {
      return apiError(
        "WORKSPACE_LIMIT_REACHED",
        "You have reached the maximum limit of 2 workspaces.",
        { currentCount, maxWorkspaces: 2 },
        400
      );
    }

    // Create workspace and automatically assign creator as OWNER
    const workspace = await prisma.workspace.create({
      data: {
        name,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
        activityLogs: {
          create: {
            userId: user.id,
            action: "WORKSPACE_CREATED",
            metadata: { workspaceName: name },
          },
        },
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
        createdAt: true,
      },
    });

    return apiSuccess(
      {
        ...workspace,
        role: "OWNER",
        isOwner: true,
        memberCount: 1,
        imageCount: 0,
      },
      undefined,
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
