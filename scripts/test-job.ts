import { enqueueBackgroundJob, executeJobDirectly } from "../src/lib/jobs/joborc";
import { env } from "../src/lib/env";

async function runTest() {
  console.log("==================================================");
  console.log("🧪 Testing Background Job System (JobOrc)");
  console.log("==================================================");

  console.log("\n📋 Configuration:");
  console.log("• Project ID:", env.JOBORC_PROJECT_ID || process.env.JOBORC_PROJECT_ID || "(not set)");
  console.log("• API Key:", env.JOBORC_API_KEY || process.env.JOBORC_API_KEY ? "******** (configured)" : "(not set)");
  console.log("• Base URL:", env.JOBORC_BASE_URL || process.env.JOBORC_BASE_URL || "https://api.joborc.dev (default)");

  // Test 1: Direct Handler Execution
  console.log("\n[Test 1] Testing Job Handler execution directly...");
  try {
    const result = await executeJobDirectly("maintenance.cleanup", {
      triggeredBy: "test-script",
    });
    console.log("✅ Direct job handler executed successfully:", result);
  } catch (err) {
    console.error("❌ Direct job handler failed:", err);
  }

  // Test 2: Enqueue Job strictly to JobOrc (no fallback)
  console.log("\n[Test 2] Enqueueing background job 'maintenance.cleanup' strictly to JobOrc...");
  try {
    const enqueueResult = await enqueueBackgroundJob(
      "maintenance.cleanup",
      { triggeredBy: "test-suite" },
      {
        queue: "maintenance",
        priority: 10,
        maxAttempts: 3,
        idempotencyKey: `test-${Date.now()}`,
      }
    );

    console.log(`✅ Successfully enqueued to JobOrc! Job ID: ${enqueueResult.jobId}`);
    console.log("   The job is now in the 'maintenance' queue waiting for worker pickup.");
  } catch (err: unknown) {
    console.error("❌ JobOrc Enqueue Failed (strict mode, no fallback):", (err as Error).message);
    if ((err as Record<string, unknown>).code) {
      console.error(`   Error Code: ${(err as Record<string, unknown>).code}`);
    }
  }

  // Test 3: API Endpoint Test
  console.log("\n[Test 3] Testing /api/v1/jobs/run endpoint integration...");
  console.log("   You can trigger JobOrc background queueing via HTTP:");
  console.log("   curl -X POST http://localhost:3001/api/v1/jobs/run \\");
  console.log("     -H 'x-cron-secret: your-cron-secret'");

  console.log("\n==================================================");
  console.log("🎉 Test completed. To run the background worker:");
  console.log("   npm run worker");
  console.log("==================================================");
}

runTest().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
