import test from "node:test";
import assert from "node:assert/strict";

// Business Rule Constants
const MAX_STORAGE_BYTES = 500 * 1024 * 1024; // 500 MB = 524,288,000 bytes
const MAX_WORKSPACES_PER_USER = 2;
const MAX_BATCH_UPLOAD_COUNT = 10;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB = 10,485,760 bytes
const MAX_TAGS_PER_IMAGE = 20;

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "heic"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

function validateStorageQuota(currentUsageBytes, incomingFileSizeBytes) {
  const current = BigInt(currentUsageBytes);
  const incoming = BigInt(incomingFileSizeBytes);
  const max = BigInt(MAX_STORAGE_BYTES);

  if (current + incoming > max) {
    return {
      allowed: false,
      code: "STORAGE_SPACE_FULL",
      message: "Uploading this image would exceed your 500 MB total account storage quota.",
    };
  }
  return { allowed: true };
}

function validateWorkspaceCreation(ownedWorkspacesCount) {
  if (ownedWorkspacesCount >= MAX_WORKSPACES_PER_USER) {
    return {
      allowed: false,
      code: "WORKSPACE_LIMIT_REACHED",
      message: "You have reached the maximum limit of 2 workspaces per account.",
    };
  }
  return { allowed: true };
}

function validateUploadPayload(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return { valid: false, error: "No files provided for upload." };
  }
  if (files.length > MAX_BATCH_UPLOAD_COUNT) {
    return { valid: false, error: `Batch upload exceeds maximum limit of ${MAX_BATCH_UPLOAD_COUNT} images.` };
  }

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: `File '${file.name}' exceeds maximum 10 MB size limit.` };
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      return { valid: false, error: `File '${file.name}' has an unsupported extension.` };
    }
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return { valid: false, error: `File '${file.name}' has an unsupported MIME type.` };
    }
  }

  return { valid: true };
}

function validateTags(tags) {
  if (!Array.isArray(tags)) {
    return { valid: false, error: "Tags must be provided as an array." };
  }
  if (tags.length > MAX_TAGS_PER_IMAGE) {
    return { valid: false, error: `An image cannot have more than ${MAX_TAGS_PER_IMAGE} tags.` };
  }

  const cleaned = [];
  for (const tag of tags) {
    const trimmed = String(tag).trim();
    if (trimmed.length === 0) continue;
    if (trimmed.length > 50) {
      return { valid: false, error: "Tag length cannot exceed 50 characters." };
    }
    // Only allow alphanumeric, hyphens, and underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return { valid: false, error: `Invalid tag characters in '${trimmed}'. Only letters, numbers, hyphens, and underscores are allowed.` };
    }
    if (!cleaned.includes(trimmed)) {
      cleaned.push(trimmed);
    }
  }

  return { valid: true, tags: cleaned };
}

test("Business Rules: Storage Quota Enforcement (500 MB limit)", async (t) => {
  await t.test("allows upload when under 500 MB quota", () => {
    const current = 100 * 1024 * 1024; // 100 MB
    const incoming = 5 * 1024 * 1024; // 5 MB
    const res = validateStorageQuota(current, incoming);
    assert.equal(res.allowed, true);
  });

  await t.test("allows upload exactly meeting 500 MB quota boundary", () => {
    const current = 490 * 1024 * 1024;
    const incoming = 10 * 1024 * 1024;
    const res = validateStorageQuota(current, incoming);
    assert.equal(res.allowed, true);
  });

  await t.test("rejects upload when quota is exceeded even by 1 byte", () => {
    const current = MAX_STORAGE_BYTES;
    const incoming = 1; // 1 byte over
    const res = validateStorageQuota(current, incoming);
    assert.equal(res.allowed, false);
    assert.equal(res.code, "STORAGE_SPACE_FULL");
  });

  await t.test("safely handles BigInt sizes for multi-megabyte files", () => {
    const current = BigInt(500 * 1024 * 1024 - 1000);
    const incoming = BigInt(2000);
    const res = validateStorageQuota(current, incoming);
    assert.equal(res.allowed, false);
  });
});

test("Business Rules: Workspace Limits (Max 2 Workspaces)", async (t) => {
  await t.test("allows creation when user owns 0 workspaces", () => {
    assert.equal(validateWorkspaceCreation(0).allowed, true);
  });

  await t.test("allows creation when user owns 1 workspace", () => {
    assert.equal(validateWorkspaceCreation(1).allowed, true);
  });

  await t.test("rejects creation when user already owns 2 workspaces", () => {
    const res = validateWorkspaceCreation(2);
    assert.equal(res.allowed, false);
    assert.equal(res.code, "WORKSPACE_LIMIT_REACHED");
  });

  await t.test("rejects creation when user owns more than 2 workspaces", () => {
    const res = validateWorkspaceCreation(3);
    assert.equal(res.allowed, false);
  });
});

test("Business Rules: Batch Upload & File Limits", async (t) => {
  await t.test("accepts valid batch of up to 10 images", () => {
    const files = Array.from({ length: 10 }, (_, i) => ({
      name: `photo_${i}.jpg`,
      size: 2 * 1024 * 1024,
      type: "image/jpeg",
    }));
    const res = validateUploadPayload(files);
    assert.equal(res.valid, true);
  });

  await t.test("rejects batches with more than 10 images", () => {
    const files = Array.from({ length: 11 }, (_, i) => ({
      name: `photo_${i}.png`,
      size: 1024,
      type: "image/png",
    }));
    const res = validateUploadPayload(files);
    assert.equal(res.valid, false);
    assert.match(res.error, /exceeds maximum limit of 10/);
  });

  await t.test("rejects files larger than 10 MB", () => {
    const files = [
      { name: "huge.jpg", size: 10 * 1024 * 1024 + 1, type: "image/jpeg" },
    ];
    const res = validateUploadPayload(files);
    assert.equal(res.valid, false);
    assert.match(res.error, /exceeds maximum 10 MB/);
  });

  await t.test("rejects unsupported extensions", () => {
    const files = [
      { name: "payload.exe", size: 1024, type: "application/octet-stream" },
    ];
    const res = validateUploadPayload(files);
    assert.equal(res.valid, false);
    assert.match(res.error, /unsupported extension/);
  });
});

test("Business Rules: Tag Validation & Formatting", async (t) => {
  await t.test("accepts up to 20 alphanumeric tags", () => {
    const tags = ["landscape", "summer_2026", "nature-shot", "Photo123"];
    const res = validateTags(tags);
    assert.equal(res.valid, true);
    assert.deepEqual(res.tags, tags);
  });

  await t.test("rejects tags exceeding 20 count limit", () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag_${i}`);
    const res = validateTags(tags);
    assert.equal(res.valid, false);
    assert.match(res.error, /more than 20 tags/);
  });

  await t.test("deduplicates redundant tags and strips empty whitespace", () => {
    const tags = ["landscape", "  landscape  ", "forest", "   "];
    const res = validateTags(tags);
    assert.equal(res.valid, true);
    assert.deepEqual(res.tags, ["landscape", "forest"]);
  });

  await t.test("rejects invalid characters (spaces, punctuation, scripts)", () => {
    const res = validateTags(["hello world", "<script>"]);
    assert.equal(res.valid, false);
    assert.match(res.error, /Only letters, numbers, hyphens/);
  });
});
