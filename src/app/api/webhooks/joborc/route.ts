import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/webhooks/joborc
 * Receives signed JobOrc webhook event notifications.
 */
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-joborc-signature") || req.headers.get("x-signature");
    const eventPayload = await req.json().catch(() => ({}));

    console.log("[JobOrc Webhook] Received webhook event:", {
      type: eventPayload.type || eventPayload.event || "unknown",
      jobId: eventPayload.data?.id || eventPayload.jobId,
      queue: eventPayload.data?.queue || eventPayload.queue,
      timestamp: new Date().toISOString(),
      hasSignature: Boolean(signature),
    });

    // Handle specific event types if needed
    const eventType = eventPayload.type || eventPayload.event;
    switch (eventType) {
      case "joborc.jobs.job.succeeded.v1":
        console.log(`[JobOrc Webhook] ✅ Job ${eventPayload.data?.id} completed successfully`);
        break;
      case "joborc.jobs.job.failed.v1":
        console.error(`[JobOrc Webhook] ❌ Job ${eventPayload.data?.id} failed:`, eventPayload.data?.error);
        break;
      default:
        break;
    }

    return NextResponse.json({
      received: true,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error("[JobOrc Webhook Error]:", error);
    return NextResponse.json(
      { error: "Internal webhook handler error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    message: "JobOrc webhook endpoint is reachable and healthy.",
  });
}
