import fs from "node:fs";

// Load local .env file if present (in cloud platforms like Render/Railway/Fly, environment variables are injected directly)
if (fs.existsSync(".env")) {
  try {
    process.loadEnvFile?.(".env");
  } catch {}
}

import { createJobOrcWorker } from "../src/lib/jobs/joborc";

async function main() {
  console.log("[JobOrc] Initializing background job worker...");

  const worker = createJobOrcWorker({
    queues: ["default", "maintenance", "emails", "images"],
    concurrency: 5,
  });

  await worker.start();
  console.log("[JobOrc] Worker is actively listening for jobs across queues: [default, maintenance, emails, images]");
  console.log("[JobOrc Worker] 🟢 Worker is online and waiting for incoming jobs...");
  console.log("[JobOrc Worker] 💡 (Tip: Upload an image or run 'npm run test:job' in another terminal to see jobs processed here)");

  const heartbeat = setInterval(() => {
    console.log(`[JobOrc Worker] 💓 Heartbeat: Worker active, listening on [default, maintenance, emails, images] (${new Date().toLocaleTimeString()})`);
  }, 60000);

  const shutdown = async () => {
    clearInterval(heartbeat);
    console.log("[JobOrc] Gracefully draining and stopping worker...");
    await worker.stop({ drainTimeoutMs: 30000 });
    console.log("[JobOrc] Worker stopped successfully.");
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("[JobOrc Worker Fatal Error]:", err);
  process.exit(1);
});
