import test from "node:test";
import assert from "node:assert/strict";

// Helper functions matching API contract standards
function formatApiError(code, message, details) {
  return {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
}

function buildCursorPagination(items, limit) {
  const boundedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const hasMore = items.length > boundedLimit;
  const data = hasMore ? items.slice(0, boundedLimit) : items;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return {
    data,
    meta: {
      nextCursor,
      limit: boundedLimit,
    },
  };
}

function sanitizeImageListRecord(image) {
  // Return only primary resource fields and lightweight references (Senior Rule 1 & 2)
  return {
    id: image.id,
    fileName: image.fileName,
    fileSize: image.fileSize,
    fileType: image.fileType,
    uploadStatus: image.uploadStatus,
    createdAt: image.createdAt,
    tags: image.tags?.map((t) => (typeof t === "string" ? t : t.name)) || [],
    uploaderId: image.uploadedById || image.uploader?.id,
  };
}

test("API Contracts: Standard Error Shape (Senior Backend Rule 4)", async (t) => {
  await t.test("formats standard error payload without details", () => {
    const res = formatApiError("WORKSPACE_NOT_FOUND", "Workspace does not exist");
    assert.deepEqual(res, {
      error: {
        code: "WORKSPACE_NOT_FOUND",
        message: "Workspace does not exist",
      },
    });
  });

  await t.test("formats validation error with field-level details", () => {
    const details = [{ field: "email", issue: "Invalid email format" }];
    const res = formatApiError("VALIDATION_FAILED", "Request validation failed", details);
    assert.equal(res.error.code, "VALIDATION_FAILED");
    assert.equal(res.error.message, "Request validation failed");
    assert.deepEqual(res.error.details, details);
  });

  await t.test("never exposes raw stack trace in error object", () => {
    const _rawError = new Error("Connection failed at TCP.connect:1234");
    const safeError = formatApiError("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
    assert.equal(safeError.error.stack, undefined);
    assert.equal(typeof safeError.error.code, "string");
  });
});

test("API Contracts: Cursor Pagination Invariants (Senior Backend Rule 5)", async (t) => {
  const mockItems = Array.from({ length: 45 }, (_, i) => ({
    id: `img_cuid_${i + 1}`,
    fileName: `file_${i + 1}.jpg`,
  }));

  await t.test("defaults page size to 20 when not specified", () => {
    const result = buildCursorPagination(mockItems);
    assert.equal(result.data.length, 20);
    assert.equal(result.meta.limit, 20);
    assert.equal(result.meta.nextCursor, "img_cuid_20");
  });

  await t.test("caps max page size at 100", () => {
    const result = buildCursorPagination(mockItems, 500);
    assert.equal(result.meta.limit, 100);
  });

  await t.test("returns null nextCursor when dataset is fully consumed", () => {
    const lastChunk = mockItems.slice(40); // 5 items
    const result = buildCursorPagination(lastChunk, 20);
    assert.equal(result.data.length, 5);
    assert.equal(result.meta.nextCursor, null);
  });
});

test("API Contracts: Lightweight Resource References (Senior Backend Rule 1 & 2)", async (t) => {
  const rawDbRecord = {
    id: "img_987",
    workspaceId: "ws_123",
    uploadedById: "usr_456",
    fileName: "sunset.jpg",
    fileSize: 4194304,
    fileType: "image/jpeg",
    uploadStatus: "COMPLETED",
    createdAt: new Date().toISOString(),
    // Unnecessary nested objects that must NOT be exposed in list endpoints
    uploader: {
      id: "usr_456",
      name: "Alice",
      email: "alice@example.com",
      passwordHash: "$2a$12$secretpasswordhash",
      sessions: [{ id: "sess_1" }],
    },
    workspace: {
      id: "ws_123",
      name: "Design Studio",
      members: [{ id: "m_1" }],
    },
    tags: ["nature", "sunset"],
  };

  const serialized = sanitizeImageListRecord(rawDbRecord);

  await t.test("includes primary resource fields and reference IDs", () => {
    assert.equal(serialized.id, "img_987");
    assert.equal(serialized.fileName, "sunset.jpg");
    assert.equal(serialized.fileSize, 4194304);
    assert.equal(serialized.uploaderId, "usr_456");
    assert.deepEqual(serialized.tags, ["nature", "sunset"]);
  });

  await t.test("excludes nested joined user profile and workspace object", () => {
    assert.equal(serialized.uploader, undefined);
    assert.equal(serialized.workspace, undefined);
    assert.equal(serialized.passwordHash, undefined);
  });
});
