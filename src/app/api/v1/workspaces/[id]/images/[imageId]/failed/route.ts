import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * POST /api/v1/workspaces/[id]/images/[imageId]/failed
 * Marks image upload status as FAILED if client encounters a network or R2 upload error
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

    const image = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!image || image.workspaceId !== workspaceId) {
      return apiError("NOT_FOUND", "Image not found.", undefined, 404);
    }

    // Only transition if still PENDING
    if (image.uploadStatus === "PENDING") {
      await prisma.image.update({
        where: { id: imageId },
        data: { uploadStatus: "FAILED" },
      });
    }

    return apiSuccess({
      imageId: image.id,
      status: "FAILED",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
