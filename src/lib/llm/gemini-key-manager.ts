/**
 * Gemini Key Manager
 * 
 * Centralizes the management of multiple API keys for Gemini services.
 * Supports both GEMINI_API_KEYS (comma-separated list) and the legacy GEMINI_API_KEY.
 */
export class GeminiKeyManager {
  private static keys: string[] = [];

  /**
   * Returns all available Gemini API keys.
   * Parses the environment variables on the first call and caches the result.
   */
  static getKeys(): string[] {
    // Return cached keys if already parsed
    if (this.keys.length > 0) {
      return this.keys;
    }

    const pluralKeys = process.env.GEMINI_API_KEYS;
    const singularKey = process.env.GEMINI_API_KEY;

    if (pluralKeys) {
      // Split by comma and clean up whitespace
      this.keys = pluralKeys
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    } else if (singularKey) {
      // Fallback to the single key
      const trimmed = singularKey.trim();
      if (trimmed) {
        this.keys = [trimmed];
      }
    }

    return this.keys;
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
}
