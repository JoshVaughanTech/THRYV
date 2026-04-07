// Simple token bucket rate limiter for API routes
// Usage: const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });
// In route: const { success } = await limiter.check(10, identifier);

interface RateLimitOptions {
  interval: number;
  uniqueTokenPerInterval: number;
}

interface TokenEntry {
  count: number;
  expiresAt: number;
}

export function rateLimit({ interval, uniqueTokenPerInterval }: RateLimitOptions) {
  const tokenMap = new Map<string, TokenEntry>();

  function cleanup() {
    const now = Date.now();
    for (const [key, entry] of tokenMap) {
      if (entry.expiresAt <= now) {
        tokenMap.delete(key);
      }
    }
  }

  return {
    async check(limit: number, token: string): Promise<{ success: boolean }> {
      cleanup();

      const now = Date.now();
      const entry = tokenMap.get(token);

      if (!entry || entry.expiresAt <= now) {
        // Enforce max unique tokens to prevent memory exhaustion
        if (!tokenMap.has(token) && tokenMap.size >= uniqueTokenPerInterval) {
          return { success: false };
        }
        tokenMap.set(token, { count: 1, expiresAt: now + interval });
        return { success: true };
      }

      if (entry.count >= limit) {
        return { success: false };
      }

      entry.count += 1;
      return { success: true };
    },
  };
}
