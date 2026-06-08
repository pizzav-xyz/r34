// Lightweight TTL cache for API responses
// Prevents upstream rate limits while keeping filesize minimal

export class TTLCache {
  #store = new Map();
  #maxEntries;
  #defaultTTL;

  /**
   * @param {number} defaultTTL - Default time-to-live in milliseconds
   * @param {number} maxEntries - Maximum cache entries (evicts oldest when exceeded)
   */
  constructor(defaultTTL = 300_000, maxEntries = 50) {
    this.#defaultTTL = defaultTTL;
    this.#maxEntries = maxEntries;
  }

  get(key) {
    const entry = this.#store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.#store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttl = this.#defaultTTL) {
    // Evict oldest if at capacity
    if (this.#store.size >= this.#maxEntries && !this.#store.has(key)) {
      const oldestKey = this.#store.keys().next().value;
      this.#store.delete(oldestKey);
    }
    this.#store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  delete(key) {
    this.#store.delete(key);
  }

  clear() {
    this.#store.clear();
  }
}

// Pre-configured caches
export const searchCache = new TTLCache(5 * 60_000, 50);  // 5 min, 50 entries
export const autocompleteCache = new TTLCache(2 * 60_000, 100);  // 2 min, 100 entries
