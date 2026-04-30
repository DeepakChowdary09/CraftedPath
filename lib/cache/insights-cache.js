/**
 * Simple in-memory TTL cache for industry insights.
 * Avoids hitting the DB on every request for data that only changes weekly.
 */

const store = new Map();

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour in-memory; DB nextUpdate governs true refresh

export const insightsCache = {
  get(industry) {
    const entry = store.get(industry);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(industry);
      return null;
    }
    return entry.data;
  },

  set(industry, data, ttlMs = DEFAULT_TTL_MS) {
    store.set(industry, { data, expiresAt: Date.now() + ttlMs });
  },

  invalidate(industry) {
    store.delete(industry);
  },

  clear() {
    store.clear();
  },
};
