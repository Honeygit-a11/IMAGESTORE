import { createJobOrc } from "@joborc/sdk";
import {
  RateLimitError,
  ConflictError,
  ValidationError,
  JobOrcError,
} from "@joborc/sdk/errors";
import { env } from "@/lib/env";
import { runAllMaintenanceJobs } from "@/lib/jobs/maintenance";
import { processImage } from "@/lib/processing/image";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWorkspaceInvitationEmail,
} from "@/lib/email/mailer";

// Job Types and Payloads
export type JobPayloadMap = {
  "maintenance.cleanup": { triggeredBy?: string };
  "email.verification": { email: string; token: string };
  "email.password_reset": { email: string; token: string };
  "email.invitation": {
    email: string;
    inviterName: string;
    workspaceName: string;
    token: string;
    role: string;
  };
  "image.process": {
    imageId: string;
    workspaceId?: string;
    fileName?: string;
  };
};

export type JobName = keyof JobPayloadMap;

let clientInstance: ReturnType<typeof createJobOrc> | null = null;

/**
 * Returns the singleton JobOrc SDK client.
 */
export function getJobOrcClient() {
  if (!clientInstance) {
    const apiKey = env.JOBORC_API_KEY || process.env.JOBORC_API_KEY || "";
    const projectId = env.JOBORC_PROJECT_ID || process.env.JOBORC_PROJECT_ID || "";
    const baseUrl = env.JOBORC_BASE_URL || process.env.JOBORC_BASE_URL || undefined;

    clientInstance = createJobOrc({
      apiKey,
      projectId,
      baseUrl,
    });
  }
  return clientInstance;
}

export interface EnqueueOptions {
  queue?: string;
  delaySeconds?: number;
  priority?: number;
  maxAttempts?: number;
  idempotencyKey?: string;
}

export class JobOrcConfigError extends Error {
  readonly code = "JOBORC-CONFIG-MISSING_CREDENTIALS";
  readonly status = 500;
  constructor(message: string) {
    super(message);
    this.name = "JobOrcConfigError";
  }
}

/**
 * Enqueues a typed background job exclusively to JobOrc.
 * Strictly throws if JobOrc is unconfigured or fails (no fallback).
 */
export async function enqueueBackgroundJob<K extends JobName>(
  name: K,
  payload: JobPayloadMap[K],
  options?: EnqueueOptions
): Promise<{ enqueued: true; jobId: string }> {
  const apiKey = env.JOBORC_API_KEY || process.env.JOBORC_API_KEY;
  const projectId = env.JOBORC_PROJECT_ID || process.env.JOBORC_PROJECT_ID;

  if (!apiKey || !projectId) {
    throw new JobOrcConfigError(
      "JobOrc Background Jobs is not configured: JOBORC_API_KEY and JOBORC_PROJECT_ID are required."
    );
  }

  try {
    const client = getJobOrcClient();
    const job = await client.jobs.enqueue(
      name,
      payload as Record<string, unknown>,
      {
        queue: options?.queue || "default",
        delaySeconds: options?.delaySeconds,
        priority: options?.priority,
        maxAttempts: options?.maxAttempts || 3,
        idempotencyKey: options?.idempotencyKey,
      }
    );

    console.log(`[JobOrc] Enqueued job '${name}' (${job.id}) on queue '${job.queue}'`);
    return { enqueued: true, jobId: job.id };
  } catch (err: unknown) {
    if (err instanceof RateLimitError) {
      console.error(`[JobOrc] Rate limited on enqueue: retry after ${err.retryAfterSeconds}s`);
    } else if (err instanceof ConflictError) {
      console.error(`[JobOrc] Conflict error: ${err.message}`);
    } else if (err instanceof ValidationError) {
      console.error(`[JobOrc] Validation error:`, err.fieldErrors);
    } else if (err instanceof JobOrcError) {
      console.error(`[JobOrc] JobOrc API error (${err.code}): ${err.message}`);
    } else {
      console.error("[JobOrc] JobOrc queueing failed:", err);
    }

    // Re-throw strictly without fallback
    throw err;
  }
}

/**
 * Direct execution of job handlers (used by worker or fallback execution).
 */
export async function executeJobDirectly<K extends JobName>(
  name: K,
  payload: JobPayloadMap[K]
): Promise<unknown> {
  switch (name) {
    case "maintenance.cleanup":
      return await runAllMaintenanceJobs();

    case "email.verification": {
      const p = payload as JobPayloadMap["email.verification"];
      return await sendVerificationEmail(p.email, p.token);
    }

    case "email.password_reset": {
      const p = payload as JobPayloadMap["email.password_reset"];
      return await sendPasswordResetEmail(p.email, p.token);
    }

    case "email.invitation": {
      const p = payload as JobPayloadMap["email.invitation"];
      return await sendWorkspaceInvitationEmail(
        p.email,
        p.inviterName,
        p.workspaceName,
        p.token,
        p.role
      );
    }

    case "image.process": {
      const p = payload as JobPayloadMap["image.process"];
      console.log(`[Job Worker] 🖼️ Processing background image: ${p.fileName || p.imageId}`);
      const startTime = Date.now();
      const result = await processImage(p.imageId);
      const elapsed = Date.now() - startTime;
      if (result.success) {
        console.log(`[Job Worker] ✅ Successfully processed image ${p.imageId} in ${elapsed}ms (Thumbnail: ${result.thumbnailKey || 'generated'})`);
      } else {
        console.error(`[Job Worker] ❌ Image processing failed for ${p.imageId}: ${result.error}`);
      }
      return result;
    }

    default:
      console.warn(`[JobOrc] Unknown job type: ${name}`);
      return null;
  }
}

/**
 * Initializes and creates a high-level worker runtime for processing jobs.
 */
export function createJobOrcWorker(options?: {
  queues?: string[];
  concurrency?: number;
}) {
  const client = getJobOrcClient();

  const worker = client.worker({
    queues: options?.queues || ["default", "maintenance", "emails", "images"],
    concurrency: options?.concurrency || 3,
    handlers: {
      "maintenance.cleanup": async (payload) => {
        console.log("[JobOrc Worker] 🧹 Running maintenance.cleanup...");
        await executeJobDirectly("maintenance.cleanup", payload as JobPayloadMap["maintenance.cleanup"]);
      },
      "email.verification": async (payload) => {
        console.log("[JobOrc Worker] 📧 Processing email.verification...");
        await executeJobDirectly("email.verification", payload as JobPayloadMap["email.verification"]);
      },
      "email.password_reset": async (payload) => {
        console.log("[JobOrc Worker] 🔑 Processing email.password_reset...");
        await executeJobDirectly("email.password_reset", payload as JobPayloadMap["email.password_reset"]);
      },
      "email.invitation": async (payload) => {
        console.log("[JobOrc Worker] 👥 Processing email.invitation...");
        await executeJobDirectly("email.invitation", payload as JobPayloadMap["email.invitation"]);
      },
      "image.process": async (payload) => {
        console.log("[JobOrc Worker] 🖼️ Received image.process job...");
        await executeJobDirectly("image.process", payload as JobPayloadMap["image.process"]);
      },
    },
  });

  return worker;
}
