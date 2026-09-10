import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

// Canonical magic byte detection engine (extracted for deterministic unit testing)
function detectFileSignature(buffer) {
  if (!buffer || buffer.length < 12) {
    return { isValid: false, error: "File payload is too small to be a valid image." };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedFormat: "jpeg" };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, detectedFormat: "png" };
  }

  // 3. GIF: 'GIF87a' or 'GIF89a'
  const gifHeader = buffer.subarray(0, 6).toString("ascii");
  if (gifHeader === "GIF87a" || gifHeader === "GIF89a") {
    return { isValid: true, detectedFormat: "gif" };
  }

  // 4. WebP: 'RIFF' .... 'WEBP'
  const riff = buffer.subarray(0, 4).toString("ascii");
  const webp = buffer.subarray(8, 12).toString("ascii");
  if (riff === "RIFF" && webp === "WEBP") {
    return { isValid: true, detectedFormat: "webp" };
  }

  // 5. HEIC / HEIF / AVIF: 'ftyp' box at byte offset 4
  const ftyp = buffer.subarray(4, 8).toString("ascii");
  if (ftyp === "ftyp") {
    return { isValid: true, detectedFormat: "heic" };
  }

  return {
    isValid: false,
    error: "File failed binary signature validation (unrecognized magic bytes).",
  };
}

// Password validation engine
function validatePasswordStrength(password) {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
}

// Sliding window rate limiter simulator
function createRateLimiter() {
  const buckets = new Map();
  return {
    limit(key, maxRequests, windowSeconds, now = Date.now()) {
      const windowMs = windowSeconds * 1000;
      const cutoff = now - windowMs;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { timestamps: [] };
        buckets.set(key, bucket);
      }
      bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);
      if (bucket.timestamps.length >= maxRequests) {
        const oldest = bucket.timestamps[0];
        const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
        return { success: false, remaining: 0, resetSeconds };
      }
      bucket.timestamps.push(now);
      return { success: true, remaining: maxRequests - bucket.timestamps.length, resetSeconds: windowSeconds };
    },
  };
}

test("Security: Binary Magic Bytes Detection", async (t) => {
  await t.test("accepts valid JPEG file header", () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01]);
    const res = detectFileSignature(jpegBuffer);
    assert.equal(res.isValid, true);
    assert.equal(res.detectedFormat, "jpeg");
  });

  await t.test("accepts valid PNG file header", () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49]);
    const res = detectFileSignature(pngBuffer);
    assert.equal(res.isValid, true);
    assert.equal(res.detectedFormat, "png");
  });

  await t.test("accepts valid GIF89a file header", () => {
    const gifBuffer = Buffer.from("GIF89a\x01\x00\x01\x00\x80\x00", "binary");
    const res = detectFileSignature(gifBuffer);
    assert.equal(res.isValid, true);
    assert.equal(res.detectedFormat, "gif");
  });

  await t.test("accepts valid WebP file header", () => {
    const webpBuffer = Buffer.from("RIFF\x20\x00\x00\x00WEBPVP8 \x14\x00", "binary");
    const res = detectFileSignature(webpBuffer);
    assert.equal(res.isValid, true);
    assert.equal(res.detectedFormat, "webp");
  });

  await t.test("accepts valid HEIC/AVIF 'ftyp' container", () => {
    const heicBuffer = Buffer.from("\x00\x00\x00\x18ftypheic\x00\x00\x00\x00", "binary");
    const res = detectFileSignature(heicBuffer);
    assert.equal(res.isValid, true);
    assert.equal(res.detectedFormat, "heic");
  });

  await t.test("rejects short or truncated buffers", () => {
    const shortBuffer = Buffer.from([0xff, 0xd8]);
    const res = detectFileSignature(shortBuffer);
    assert.equal(res.isValid, false);
    assert.match(res.error, /too small/);
  });

  await t.test("strictly rejects malicious HTML/JS masquerading as image", () => {
    const scriptBuffer = Buffer.from("<script>alert('pwned')</script>\n// fake image", "utf8");
    const res = detectFileSignature(scriptBuffer);
    assert.equal(res.isValid, false);
    assert.match(res.error, /unrecognized magic bytes/);
  });

  await t.test("strictly rejects Windows EXE and Linux ELF binaries", () => {
    const exeBuffer = Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff", "binary");
    const elfBuffer = Buffer.from("\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00", "binary");
    assert.equal(detectFileSignature(exeBuffer).isValid, false);
    assert.equal(detectFileSignature(elfBuffer).isValid, false);
  });
});

test("Security: Password Strength & Hashing", async (t) => {
  await t.test("rejects passwords under 8 characters", () => {
    const res = validatePasswordStrength("Ab1!");
    assert.equal(res.valid, false);
    assert.match(res.message, /at least 8 characters/);
  });

  await t.test("rejects passwords without uppercase letters", () => {
    const res = validatePasswordStrength("password1234");
    assert.equal(res.valid, false);
    assert.match(res.message, /uppercase letter/);
  });

  await t.test("rejects passwords without numbers", () => {
    const res = validatePasswordStrength("PasswordOnly");
    assert.equal(res.valid, false);
    assert.match(res.message, /at least one number/);
  });

  await t.test("accepts compliant passwords", () => {
    const res = validatePasswordStrength("SecureP@ssw0rd2026");
    assert.equal(res.valid, true);
    assert.equal(res.message, undefined);
  });

  await t.test("hashes and verifies password using bcrypt with salt rounds", async () => {
    const raw = "SuperSecretPassword123";
    const hash = await bcrypt.hash(raw, 10);
    const matches = await bcrypt.compare(raw, hash);
    const mismatch = await bcrypt.compare("WrongPassword123", hash);
    assert.equal(matches, true);
    assert.equal(mismatch, false);
  });
});

test("Security: Sliding-Window Rate Limiter", async (t) => {
  const limiter = createRateLimiter();
  const testKey = "192.168.1.50";
  const now = 1000000;

  await t.test("allows requests up to maxRequests quota", () => {
    const r1 = limiter.limit(testKey, 3, 60, now);
    const r2 = limiter.limit(testKey, 3, 60, now + 1000);
    const r3 = limiter.limit(testKey, 3, 60, now + 2000);
    assert.equal(r1.success, true);
    assert.equal(r1.remaining, 2);
    assert.equal(r2.success, true);
    assert.equal(r2.remaining, 1);
    assert.equal(r3.success, true);
    assert.equal(r3.remaining, 0);
  });

  await t.test("blocks requests once quota is exhausted", () => {
    const blocked = limiter.limit(testKey, 3, 60, now + 3000);
    assert.equal(blocked.success, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.resetSeconds > 0);
  });

  await t.test("isolates rate limiting by client key", () => {
    const otherKey = "10.0.0.99";
    const rOther = limiter.limit(otherKey, 3, 60, now + 3000);
    assert.equal(rOther.success, true);
    assert.equal(rOther.remaining, 2);
  });

  await t.test("resets quota after sliding window expires", () => {
    const afterWindow = limiter.limit(testKey, 3, 60, now + 65000);
    assert.equal(afterWindow.success, true);
    assert.ok(afterWindow.remaining >= 1);
  });
});
