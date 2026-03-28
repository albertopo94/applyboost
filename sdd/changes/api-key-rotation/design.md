# Design: API Key Rotation for Gemini

## Technical Approach
We will implement a centralized `GeminiKeyManager` to handle multiple API keys from the `GEMINI_API_KEYS` environment variable. Both the Vision (OCR) and Chat (Optimization) services will use this manager to rotate keys on 429 errors. To maximize quota, the Vision service will return the index of the key it used, allowing the Optimization service to exclude that "hot" key from its rotation.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Key Storage** | `GEMINI_API_KEYS` (CSV) | Simple, standard environment variable format; easy to update in Dokploy. |
| **Rotation Logic** | Internal Loop per Service | Keeps the rotation logic close to the 429 error handling; services remain stateless. |
| **Exclusion Mechanism** | `excludeIndex` Handover | Ensures the OCR and Chat steps for a single request don't share the same quota bucket. |
| **Fallback Strategy** | Exhaust Gemini -> Provider Fallback | Maximizes usage of Gemini (free/preferred) before falling back to Groq/Cerebras. |

## Data Flow
```
1. Wizard --[PDF]--> /api/generate
2. /api/generate --[Buffer]--> cvParser.parseCV()
3. cvParser --[Buffer]--> GeminiVisionService.extract()
   a. extract() asks KeyManager for key[0...N]
   b. If 429, try key[i+1]
   c. Returns { text, usedKeyIndex }
4. /api/generate calls callLLM(prompt, { excludeGeminiIndex: usedKeyIndex })
5. callLLM --[Index]--> GeminiService.chat()
   a. chat() asks KeyManager for key[j...N] WHERE j != excludeIndex
   b. If all non-excluded keys give 429, GeminiService fails.
6. callLLM catches Gemini failure -> Fallback to Groq.
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/llm/gemini-key-manager.ts` | Create | Central logic for parsing and selecting API keys. |
| `src/lib/llm/gemini-vision.ts` | Modify | Update to use rotation loop and return `usedKeyIndex`. |
| `src/lib/llm/gemini.ts` | Modify | Update to use rotation loop and respect `excludeIndex`. |
| `src/lib/llm/index.ts` | Modify | Pass `excludeIndex` from `api/generate` to provider instances. |
| `src/app/api/generate/route.ts` | Modify | Orchestrate the index handover between parser and LLM call. |

## Interfaces / Contracts

```typescript
// src/lib/llm/gemini-key-manager.ts
export class GeminiKeyManager {
  static getKeys(): string[];
  static getKey(index: number): string;
}

// Result update for Vision
export interface OCRResult {
  text: string;
  usedKeyIndex: number;
}
```

## Testing Strategy
| Layer | What to Test | Approach |
|-------|-------------|----------|
| **Unit** | `GeminiKeyManager` | Verify CSV parsing and index bounds checking. |
| **Unit** | `GeminiService` | Mock 429 on first key, success on second key. |
| **Integration** | `api/generate` | Verify that the `excludeIndex` is correctly passed down. |

## Migration / Rollout
Users must update their Dokploy environment variables to use `GEMINI_API_KEYS`. The system will fallback to the single `GEMINI_API_KEY` if the plural one is missing.

## Open Questions
- None.
