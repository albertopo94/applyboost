/**
 * Gemini Key Manager
 * 
 * Centralizes the management of multiple API keys for Gemini services.
 * Supports both GEMINI_API_KEYS (comma-separated list) and the legacy GEMINI_API_KEY.
 * Now includes a stateful cooldown mechanism to skip rate-limited keys.
 */
export class GeminiKeyManager {
  private static keys: string[] = [];
  
  /** 
   * In-memory map to store cooldown expiration timestamps (ms) for each key index.
   * key: index, value: timestamp (Date.now() + duration)
   */
  private static cooldowns: Map<number, number> = new Map();

  /**
   * Circuit Breaker State
   */
  private static consecutiveFailures = 0;
  private static lastFailureTime = 0;
  private static readonly CIRCUIT_BREAKER_THRESHOLD = 2;
  private static readonly CIRCUIT_BREAKER_COOLDOWN = 300000; // 5 minutes

  /**
   * Returns all available Gemini API keys.
   * Parses the environment variables on the first call and caches the result.
   */
  static getKeys(): string[] {
    // Return cached keys ONLY if we have them
    if (this.keys.length > 0) {
      return this.keys;
    }

    const pluralKeys = process.env.GEMINI_API_KEYS;
    const singularKey = process.env.GEMINI_API_KEY;

    let foundKeys: string[] = [];

    if (pluralKeys) {
      // Split by comma and clean up whitespace
      foundKeys = pluralKeys
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    } else if (singularKey) {
      // Fallback to the single key
      const trimmed = singularKey.trim();
      if (trimmed) {
        foundKeys = [trimmed];
      }
    }

    // Only cache if we actually found something
    if (foundKeys.length > 0) {
      this.keys = foundKeys;
    }

    return foundKeys;
  }

  /**
   * Returns the API key at the specified index.
   */
  static getKey(index: number): string | undefined {
    const keys = this.getKeys();
    return keys[index];
  }

  /**
   * Returns the total number of configured keys.
   */
  static getKeyCount(): number {
    return this.getKeys().length;
  }

  /**
   * Marks a specific key as exhausted by setting a cooldown period.
   * @param index The index of the key in the array.
   * @param durationMs How long the cooldown should last (default 60s).
   */
  static markAsExhausted(index: number, durationMs: number = 60000): void {
    const expiration = Date.now() + durationMs;
    this.cooldowns.set(index, expiration);
  }

  /**
   * Checks if a key is available (not in cooldown).
   */
  static isKeyAvailable(index: number): boolean {
    const expiration = this.cooldowns.get(index);
    if (!expiration) return true;

    const now = Date.now();
    if (now >= expiration) {
      // Cooldown expired, clean up and return true
      this.cooldowns.delete(index);
      return true;
    }

    return false;
  }

  /**
   * HEALTH MANAGEMENT (Circuit Breaker)
   */

  /**
   * Reports a failure of the service.
   * If consecutive failures reach the threshold, the service is marked as unhealthy.
   */
  static reportFailure(): void {
    const now = Date.now();
    
    // If last failure was more than 10 minutes ago, reset the counter
    if (now - this.lastFailureTime > 600000) {
      this.consecutiveFailures = 1;
    } else {
      this.consecutiveFailures++;
    }
    
    this.lastFailureTime = now;
    
    if (this.consecutiveFailures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      console.warn(`[GEMINI_CIRCUIT_BREAKER] Service marked as UNHEALTHY due to ${this.consecutiveFailures} consecutive failures.`);
    }
  }

  /**
   * Resets the consecutive failures counter.
   * Call this after any successful request to the service.
   */
  static resetHealth(): void {
    this.consecutiveFailures = 0;
  }

  /**
   * Returns true if the service is considered healthy.
   * A service is unhealthy if it's currently in a circuit breaker cooldown.
   */
  static isHealthy(): boolean {
    if (this.consecutiveFailures < this.CIRCUIT_BREAKER_THRESHOLD) {
      return true;
    }

    const now = Date.now();
    if (now - this.lastFailureTime >= this.CIRCUIT_BREAKER_COOLDOWN) {
      // Cooldown period passed, we allow a retry
      this.resetHealth();
      return true;
    }

    return false;
  }
}
