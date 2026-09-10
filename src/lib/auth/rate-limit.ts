interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const attemptsStore = new Map<string, AttemptRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

/**
 * Check if an identifier (IP address or email) is temporarily locked out.
 */
export function checkRateLimit(key: string): {
  isLocked: boolean;
  remainingLockSeconds: number;
} {
  const now = Date.now();
  const record = attemptsStore.get(key);

  if (!record) {
    return { isLocked: false, remainingLockSeconds: 0 };
  }

  // Check if active lockout exists
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingLockSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { isLocked: true, remainingLockSeconds };
  }

  // If lockout or window has expired, clear record
  if (record.lockedUntil && record.lockedUntil <= now) {
    attemptsStore.delete(key);
    return { isLocked: false, remainingLockSeconds: 0 };
  }

  if (now - record.firstAttemptAt > WINDOW_MS) {
    attemptsStore.delete(key);
    return { isLocked: false, remainingLockSeconds: 0 };
  }

  return { isLocked: false, remainingLockSeconds: 0 };
}

/**
 * Record a failed authentication attempt. Triggers lockout if max attempts exceeded.
 */
export function recordFailedAttempt(key: string): {
  isLocked: boolean;
  remainingAttempts: number;
  lockoutSeconds: number;
} {
  const now = Date.now();
  let record = attemptsStore.get(key);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    record = {
      count: 1,
      firstAttemptAt: now,
      lockedUntil: null,
    };
  } else {
    record.count += 1;
  }

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    attemptsStore.set(key, record);
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockoutSeconds: Math.ceil(LOCKOUT_MS / 1000),
    };
  }

  attemptsStore.set(key, record);
  return {
    isLocked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - record.count,
    lockoutSeconds: 0,
  };
}

/**
 * Clear failed attempts upon successful login.
 */
export function resetFailedAttempts(key: string): void {
  attemptsStore.delete(key);
}

interface SlidingBucket {
  timestamps: number[];
}

const slidingBuckets = new Map<string, SlidingBucket>();

// Periodic garbage collection every 10 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const maxRetention = 60 * 60 * 1000; // 1 hour
    for (const [key, bucket] of slidingBuckets.entries()) {
      bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < maxRetention);
      if (bucket.timestamps.length === 0) {
        slidingBuckets.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

/**
 * Universal sliding-window rate limiter for sensitive API endpoints.
 * @param key Unique client key (IP, user ID, or composite)
 * @param maxRequests Maximum allowed requests within window
 * @param windowSeconds Window duration in seconds
 */
export function applySlidingWindowRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): {
  success: boolean;
  remaining: number;
  resetSeconds: number;
} {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  let bucket = slidingBuckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    slidingBuckets.set(key, bucket);
  }

  // Filter timestamps within current sliding window
  bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);

  if (bucket.timestamps.length >= maxRequests) {
    const oldest = bucket.timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      remaining: 0,
      resetSeconds,
    };
  }

  bucket.timestamps.push(now);
  return {
    success: true,
    remaining: maxRequests - bucket.timestamps.length,
    resetSeconds: windowSeconds,
  };
}

