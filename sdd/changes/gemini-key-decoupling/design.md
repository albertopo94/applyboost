# Design: gemini-key-decoupling

## 1. Simplified GeminiService

`GeminiService` is now a stateless proxy for a SINGLE API key.

```typescript
export class GeminiService implements AIService {
  constructor(private readonly apiKey: string) {}
  async chat(prompt: string, signal?: AbortSignal): Promise<string> {
    // Single request...
    // Catch 429 -> throw LLMRateLimitError
  }
}
```

## 2. GeminiRotationProvider (Infrastructure Layer)

A helper class (or a change in the orchestrator) to handle multiple keys.

```typescript
export class GeminiRotationProvider {
  async chat(prompt: string, signal?: AbortSignal, excludeIndex?: number): Promise<string> {
    // Loop through keys from GeminiKeyManager
    // For each available key:
    //   service = new GeminiService(key)
    //   try { return await service.chat(prompt, signal) }
    //   catch (429) { markAsExhausted; continue }
  }
}
```

## 3. Orchestrator Integration

`src/lib/llm/index.ts` will now treat Gemini as a single service that *internally* might use a rotation provider, or the orchestrator itself will handle the multi-key logic for Gemini.

### Decision:
To keep the orchestrator `index.ts` clean, we will make `GeminiService` a **wrapper** that uses the `RotationProvider` logic, but the actual SDK interaction will be moved to a `GeminiClient` or a private method that only knows about ONE key.
