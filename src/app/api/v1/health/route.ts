import { apiSuccess, handleApiError } from "@/lib/api/response";

/**
 * Health check endpoint: GET /api/v1/health
 * Demonstrates standard API response shape:
 * { data: { status, version, timestamp, service } }
 */
export async function GET() {
  try {
    return apiSuccess({
      status: "healthy",
      service: "ImageSpace API",
      version: "v1",
      timestamp: new Date().toISOString(),
      architecture: {
        envelope: "{ data, meta? } | { error: { code, message, details? } }",
        rules: "Cursor pagination, no nested bloat, versioned endpoints",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
