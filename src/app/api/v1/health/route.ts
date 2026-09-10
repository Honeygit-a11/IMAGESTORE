import prisma from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * Health check endpoint: GET /api/v1/health
 * Probes database connectivity and returns system status.
 * Returns 200 OK when operational, 503 Service Unavailable when degraded.
 */
export async function GET() {
  const startTime = Date.now();
  try {
    // Probe database connectivity with lightweight ping
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startTime;

    return apiSuccess({
      status: "healthy",
      database: "connected",
      latencyMs,
      service: "ImageSpace API",
      version: "v1",
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("[Health Check Failed]", err);
    return apiError(
      "SERVICE_UNAVAILABLE",
      "Database probe failed or service connection unreachable",
      undefined,
      503
    );
  }
}
