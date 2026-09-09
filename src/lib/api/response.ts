import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standard API error shape strictly following backend guidelines:
 * { error: { code: string, message: string, details?: unknown } }
 */
export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Standard API success shape:
 * { data: T, meta?: { nextCursor?: string | null, limit?: number, total?: number } }
 */
export interface ApiSuccessPayload<T> {
  data: T;
  meta?: {
    nextCursor?: string | null;
    limit?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export function apiSuccess<T>(
  data: T,
  meta?: { nextCursor?: string | null; limit?: number; total?: number; [key: string]: unknown },
  status = 200
): NextResponse<ApiSuccessPayload<T>> {
  return NextResponse.json(
    {
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

export function apiError(
  code: string,
  message: string,
  details?: unknown,
  status = 400
): NextResponse<ApiErrorPayload> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  );
}

export function handleApiError(error: unknown): NextResponse<ApiErrorPayload> {
  console.error("[API Error Handler]", error);

  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join("."),
      issue: issue.message,
    }));
    return apiError("VALIDATION_FAILED", "Request validation failed", details, 422);
  }

  if (error instanceof Error) {
    if (error.message.includes("Unauthorized") || error.message.includes("UNAUTHORIZED")) {
      return apiError("UNAUTHORIZED", "Authentication required to access this resource", undefined, 401);
    }
    if (error.message.includes("Forbidden") || error.message.includes("FORBIDDEN")) {
      return apiError("FORBIDDEN", "You do not have permission to perform this action", undefined, 403);
    }
    if (error.message.includes("NotFound") || error.message.includes("NOT_FOUND")) {
      return apiError("NOT_FOUND", "Requested resource was not found", undefined, 404);
    }
  }

  return apiError(
    "INTERNAL_SERVER_ERROR",
    "An unexpected error occurred. Please try again later.",
    undefined,
    500
  );
}
