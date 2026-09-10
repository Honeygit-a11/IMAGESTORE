import test from "node:test";
import assert from "node:assert/strict";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function isTrashEligibleForPermanentPurge(deletedAt, permanentDeleteAt, now = new Date()) {
  const cutoff = new Date(now.getTime());
  const permDate = new Date(permanentDeleteAt);
  return permDate <= cutoff;
}

function isInvitationExpired(createdAt, expiresAt, now = new Date()) {
  const expDate = new Date(expiresAt);
  return expDate < now;
}

function isStaleUpload(uploadStatus, createdAt, now = new Date()) {
  const createdTime = new Date(createdAt).getTime();
  const currentTime = now.getTime();
  const ageMs = currentTime - createdTime;

  if (uploadStatus === "PENDING" || uploadStatus === "PROCESSING") {
    return ageMs > TWO_HOURS_MS;
  }
  if (uploadStatus === "FAILED") {
    return ageMs > TWENTY_FOUR_HOURS_MS;
  }
  return false;
}

test("Maintenance: 30-Day Trash Retention Expiration", async (t) => {
  const now = new Date("2026-09-10T12:00:00.000Z");

  await t.test("preserves items deleted 10 days ago", () => {
    const deletedAt = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const permanentDeleteAt = new Date(deletedAt.getTime() + THIRTY_DAYS_MS); // 20 days remaining
    assert.equal(isTrashEligibleForPermanentPurge(deletedAt, permanentDeleteAt, now), false);
  });

  await t.test("preserves items deleted 29 days ago", () => {
    const deletedAt = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    const permanentDeleteAt = new Date(deletedAt.getTime() + THIRTY_DAYS_MS); // 1 day remaining
    assert.equal(isTrashEligibleForPermanentPurge(deletedAt, permanentDeleteAt, now), false);
  });

  await t.test("flags items deleted exactly 30 days ago for purge", () => {
    const deletedAt = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const permanentDeleteAt = new Date(deletedAt.getTime() + THIRTY_DAYS_MS); // exactly now
    assert.equal(isTrashEligibleForPermanentPurge(deletedAt, permanentDeleteAt, now), true);
  });

  await t.test("flags items deleted 35 days ago for purge", () => {
    const deletedAt = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
    const permanentDeleteAt = new Date(deletedAt.getTime() + THIRTY_DAYS_MS); // 5 days past due
    assert.equal(isTrashEligibleForPermanentPurge(deletedAt, permanentDeleteAt, now), true);
  });
});

test("Maintenance: 7-Day Invitation Expiry", async (t) => {
  const now = new Date("2026-09-10T12:00:00.000Z");

  await t.test("keeps invitations active within 7 days", () => {
    const createdAt = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const expiresAt = new Date(createdAt.getTime() + SEVEN_DAYS_MS);
    assert.equal(isInvitationExpired(createdAt, expiresAt, now), false);
  });

  await t.test("marks invitations expired after 7 days", () => {
    const createdAt = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    const expiresAt = new Date(createdAt.getTime() + SEVEN_DAYS_MS);
    assert.equal(isInvitationExpired(createdAt, expiresAt, now), true);
  });
});

test("Maintenance: Stale Upload Purge Boundaries", async (t) => {
  const now = new Date("2026-09-10T12:00:00.000Z");

  await t.test("keeps recently created pending upload (30 mins old)", () => {
    const createdAt = new Date(now.getTime() - 30 * 60 * 1000);
    assert.equal(isStaleUpload("PENDING", createdAt, now), false);
  });

  await t.test("flags pending upload stuck for > 2 hours", () => {
    const createdAt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    assert.equal(isStaleUpload("PENDING", createdAt, now), true);
  });

  await t.test("flags failed upload older than 24 hours", () => {
    const createdAt = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    assert.equal(isStaleUpload("FAILED", createdAt, now), true);
  });

  await t.test("keeps completed images safe from upload cleanup", () => {
    const createdAt = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000);
    assert.equal(isStaleUpload("COMPLETED", createdAt, now), false);
  });
});
