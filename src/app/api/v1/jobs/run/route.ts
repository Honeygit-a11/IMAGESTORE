import { NextRequest } from "next/server";
import { runAllMaintenanceJobs } from "@/lib/jobs/maintenance";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * POST /api/v1/jobs/run
 * Protected background job maintenance runner.
 * Triggers:
 * - Orphaned & failed upload cleanup
 * - 7-day expired invitation reconciliation
 * - 30-day permanent trash purge with quota release
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecretHeader = req.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret) {
      const token = authHeader?.replace(/^Bearer\s+/i, "") || cronSecretHeader;
      if (token !== expectedSecret) {
        return apiError("UNAUTHORIZED", "Invalid or missing cron secret.", undefined, 401);
      }
    }

    const results = await runAllMaintenanceJobs();

    return apiSuccess({
      status: "COMPLETED",
      ...results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
