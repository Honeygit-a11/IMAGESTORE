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
async function handleJobRun(req: NextRequest) {
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

    // Exclusively enqueue via JobOrc Background Jobs (no fallback)
    const result = await enqueueBackgroundJob(
      "maintenance.cleanup",
      { triggeredBy: "cron-api" },
      { queue: "maintenance", priority: 5 }
    );

    return apiSuccess(
      {
        status: "ENQUEUED",
        jobId: result.jobId,
        queue: "maintenance",
        message: "Maintenance task enqueued to JobOrc queue: maintenance",
      },
      undefined,
      202
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  return handleJobRun(req);
}

export async function GET(req: NextRequest) {
  return handleJobRun(req);
}
