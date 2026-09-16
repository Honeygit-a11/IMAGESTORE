import { NextRequest } from "next/server";
import { runAllMaintenanceJobs } from "@/lib/jobs/maintenance";
import { enqueueBackgroundJob } from "@/lib/jobs/joborc";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

/**
 * POST /api/v1/jobs/run
 * Protected background job maintenance runner.
 * Supports:
 * - Direct execution
 * - JobOrc asynchronous background queueing (?enqueue=true)
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

    const shouldEnqueue = req.nextUrl.searchParams.get("enqueue") === "true";

    if (shouldEnqueue) {
      const result = await enqueueBackgroundJob(
        "maintenance.cleanup",
        { triggeredBy: "cron-api" },
        { queue: "maintenance", priority: 5 }
      );

      return apiSuccess({
        status: "ENQUEUED",
        jobId: result.jobId,
        enqueued: result.enqueued,
        message: "Maintenance task enqueued to JobOrc queue: maintenance",
      });
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
