import { Pool } from "pg";

export interface Migration {
  name: string;
  sql: string;
}

/**
 * Registry of all database migrations in execution order.
 * When a new migration is created, add it to this list.
 */
export const MIGRATIONS: Migration[] = [
  {
    name: "0001_init_schema.sql",
    sql: `
-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS "public";

-- Enums with idempotency
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuthProvider') THEN
    CREATE TYPE "AuthProvider" AS ENUM ('CREDENTIALS', 'GOOGLE');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkspaceRole') THEN
    CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InvitationStatus') THEN
    CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UploadStatus') THEN
    CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TokenType') THEN
    CREATE TYPE "TokenType" AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET');
  END IF;
END $$;

-- CreateTable: User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'CREDENTIALS',
    "storageUsedBytes" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Workspace
CREATE TABLE IF NOT EXISTS "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "storageUsedBytes" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WorkspaceMember
CREATE TABLE IF NOT EXISTS "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'VIEWER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WorkspaceInvitation
CREATE TABLE IF NOT EXISTS "WorkspaceInvitation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'VIEWER',
    "invitedById" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Image
CREATE TABLE IF NOT EXISTS "Image" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "thumbnailKey" TEXT,
    "uploadStatus" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "permanentDeleteAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Tag
CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ImageTag
CREATE TABLE IF NOT EXISTS "ImageTag" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "ImageTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ActivityLog
CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserSession
CREATE TABLE IF NOT EXISTS "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable: VerificationToken
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Notification
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

CREATE INDEX IF NOT EXISTS "Workspace_ownerId_idx" ON "Workspace"("ownerId");

CREATE INDEX IF NOT EXISTS "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");
CREATE INDEX IF NOT EXISTS "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceInvitation_token_key" ON "WorkspaceInvitation"("token");
CREATE INDEX IF NOT EXISTS "WorkspaceInvitation_workspaceId_email_idx" ON "WorkspaceInvitation"("workspaceId", "email");
CREATE INDEX IF NOT EXISTS "WorkspaceInvitation_workspaceId_status_idx" ON "WorkspaceInvitation"("workspaceId", "status");
CREATE INDEX IF NOT EXISTS "WorkspaceInvitation_token_idx" ON "WorkspaceInvitation"("token");
CREATE INDEX IF NOT EXISTS "WorkspaceInvitation_email_idx" ON "WorkspaceInvitation"("email");
CREATE INDEX IF NOT EXISTS "WorkspaceInvitation_expiresAt_idx" ON "WorkspaceInvitation"("expiresAt");

CREATE INDEX IF NOT EXISTS "Image_workspaceId_deletedAt_idx" ON "Image"("workspaceId", "deletedAt");
CREATE INDEX IF NOT EXISTS "Image_workspaceId_fileName_idx" ON "Image"("workspaceId", "fileName");
CREATE INDEX IF NOT EXISTS "Image_uploadedById_idx" ON "Image"("uploadedById");
CREATE INDEX IF NOT EXISTS "Image_deletedAt_idx" ON "Image"("deletedAt");
CREATE INDEX IF NOT EXISTS "Image_permanentDeleteAt_idx" ON "Image"("permanentDeleteAt");
CREATE INDEX IF NOT EXISTS "Image_uploadStatus_idx" ON "Image"("uploadStatus");

CREATE INDEX IF NOT EXISTS "Tag_workspaceId_idx" ON "Tag"("workspaceId");
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_workspaceId_name_key" ON "Tag"("workspaceId", "name");

CREATE INDEX IF NOT EXISTS "ImageTag_imageId_idx" ON "ImageTag"("imageId");
CREATE INDEX IF NOT EXISTS "ImageTag_tagId_idx" ON "ImageTag"("tagId");
CREATE UNIQUE INDEX IF NOT EXISTS "ImageTag_imageId_tagId_key" ON "ImageTag"("imageId", "tagId");

CREATE INDEX IF NOT EXISTS "ActivityLog_workspaceId_createdAt_idx" ON "ActivityLog"("workspaceId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ActivityLog_userId_idx" ON "ActivityLog"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "UserSession_sessionToken_key" ON "UserSession"("sessionToken");
CREATE INDEX IF NOT EXISTS "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX IF NOT EXISTS "UserSession_sessionToken_idx" ON "UserSession"("sessionToken");
CREATE INDEX IF NOT EXISTS "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE INDEX IF NOT EXISTS "VerificationToken_identifier_type_idx" ON "VerificationToken"("identifier", "type");
CREATE INDEX IF NOT EXISTS "VerificationToken_token_idx" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_type_key" ON "VerificationToken"("identifier", "token", "type");

CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);

-- Foreign Keys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Workspace_ownerId_fkey') THEN
    ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkspaceMember_workspaceId_fkey') THEN
    ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkspaceMember_userId_fkey') THEN
    ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkspaceInvitation_workspaceId_fkey') THEN
    ALTER TABLE "WorkspaceInvitation" ADD CONSTRAINT "WorkspaceInvitation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkspaceInvitation_invitedById_fkey') THEN
    ALTER TABLE "WorkspaceInvitation" ADD CONSTRAINT "WorkspaceInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Image_workspaceId_fkey') THEN
    ALTER TABLE "Image" ADD CONSTRAINT "Image_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Image_uploadedById_fkey') THEN
    ALTER TABLE "Image" ADD CONSTRAINT "Image_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Image_deletedById_fkey') THEN
    ALTER TABLE "Image" ADD CONSTRAINT "Image_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tag_workspaceId_fkey') THEN
    ALTER TABLE "Tag" ADD CONSTRAINT "Tag_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ImageTag_imageId_fkey') THEN
    ALTER TABLE "ImageTag" ADD CONSTRAINT "ImageTag_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ImageTag_tagId_fkey') THEN
    ALTER TABLE "ImageTag" ADD CONSTRAINT "ImageTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ActivityLog_workspaceId_fkey') THEN
    ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ActivityLog_userId_fkey') THEN
    ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserSession_userId_fkey') THEN
    ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
    `,
  },
];

let migrationPromise: Promise<void> | null = null;

/**
 * Runs pending database migrations using a PostgreSQL advisory lock to ensure
 * concurrency safety across serverless functions and container cold starts.
 */
export async function runMigrations(pool: Pool): Promise<void> {
  if (migrationPromise) {
    return migrationPromise;
  }

  migrationPromise = (async () => {
    console.log("[Migrations] Starting database migration check...");

    let client;
    try {
      client = await pool.connect();
    } catch (connErr) {
      console.error("[Migrations] Could not connect to database to check migrations:", connErr);
      migrationPromise = null;
      throw connErr;
    }

    let lockAcquired = false;
    try {
      // 1. Acquire non-blocking advisory lock so we don't hang or hit statement timeouts in pooled environments
      try {
        const lockRes = await client.query<{ acquired: boolean }>(
          "SELECT pg_try_advisory_lock(8192039) AS acquired"
        );
        lockAcquired = lockRes.rows[0]?.acquired ?? false;
      } catch {
        lockAcquired = false;
      }

      // 2. Ensure migrations tracking table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS "_migrations" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL UNIQUE,
          "applied_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      // 3. Fetch already applied migrations
      const { rows } = await client.query<{ name: string }>(
        `SELECT "name" FROM "_migrations"`
      );
      const appliedSet = new Set(rows.map((r) => r.name));

      // 4. Iterate and apply migrations
      for (const migration of MIGRATIONS) {
        if (appliedSet.has(migration.name)) {
          console.log(`[Migrations] Already applied, skipping: ${migration.name}`);
          continue;
        }

        if (!lockAcquired) {
          console.log(`[Migrations] Migration ${migration.name} pending, but advisory lock held by another process.`);
          continue;
        }

        console.log(`[Migrations] Applying new migration: ${migration.name}...`);
        await client.query("BEGIN");
        try {
          await client.query(migration.sql);
          await client.query(
            `INSERT INTO "_migrations" ("name") VALUES ($1)`,
            [migration.name]
          );
          await client.query("COMMIT");
          console.log(`[Migrations] Successfully applied: ${migration.name}`);
        } catch (migErr) {
          await client.query("ROLLBACK");
          console.error(`[Migrations] Failed to apply ${migration.name}:`, migErr);
          throw migErr;
        }
      }

      console.log("[Migrations] Database migration check completed.");
    } catch (err) {
      console.error("[Migrations] Database migration check encountered an error:", err);
      // Reset promise on error so subsequent requests can retry
      migrationPromise = null;
      throw err;
    } finally {
      if (lockAcquired) {
        try {
          await client.query("SELECT pg_advisory_unlock(8192039)");
        } catch {
          // ignore unlock error
        }
      }
      client.release();
    }
  })();

  return migrationPromise;
}
