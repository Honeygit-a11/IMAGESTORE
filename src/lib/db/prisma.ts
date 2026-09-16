import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { runMigrations } from "./migrator";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/imagespace?schema=public";

const isLocalhost =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

export const pool = new Pool({
  connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);

// Run migration check on cold start automatically
export const migrationPromise = runMigrations(pool).catch((err) => {
  console.error("[Migrations] Cold start migration check failed:", err);
});

/**
 * Ensures all pending database migrations have executed before proceeding.
 * Safe to call multiple times (idempotent, backed by advisory lock and singleton promise).
 */
export async function ensureDatabaseReady(): Promise<void> {
  await runMigrations(pool);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
