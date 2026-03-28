# Design: Gemini Key Cooldown Mechanism

## Technical Approach
We will introduce a stateful cooldown tracking system within the `GeminiKeyManager`. This system will use an in-memory Map to store expiration timestamps for keys that have returned a 429 error. LLM services will perform a pre-emptive check against this manager before initiating any network request, effectively "short-circuiting" the request for rate-limited keys and eliminating unnecessary latency.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Storage Mechanism** | In-memory `Map<number, number>` | Fastest access; survives for the lifetime of the server instance; low overhead. |
| **Cooldown Duration** | 60 Seconds | Standard duration to allow Google's RPM quota to reset; balances retry speed and safety. |
| **Logic Location** | Centralized in `GeminiKeyManager` | Single source of truth for all Gemini services (Vision & Chat); avoids logic duplication. |
| **Handover Integration** | Combined with Exclusion Index | Services will check BOTH the exclusion index (per-request) and the cooldown status (global). |

## Data Flow
```
Service (Vision or Chat) calls Key Rotation Loop
  │
  ▼
  Loop Start (Index i):
    1. KeyManager.isKeyAvailable(i)? ─── NO (in cooldown) ──▶ Skip & Log [GEMINI_COOLDOWN]
    2. Index == excludeGeminiIndex? ─── YES (OCR used it) ──▶ Skip & Log [GEMINI_EXCLUSION]
    │
    ▼
    Execute External Fetch (Google API)
    │
    ├─▶ Success ───────────▶ Return result
    └─▶ 429 Rate Limit ────▶ 1. KeyManager.markAsExhausted(i)
                             2. Continue Loop
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/llm/gemini-key-manager.ts` | Modify | Implement `cooldowns` Map, `markAsExhausted`, and `isKeyAvailable`. |
| `src/lib/llm/gemini-vision.ts` | Modify | Add pre-emptive check and call `markAsExhausted` on 429. |
| `src/lib/llm/gemini.ts` | Modify | Add pre-emptive check and call `markAsExhausted` on 429. |

## Interfaces / Contracts

```typescript
// Updated src/lib/llm/gemini-key-manager.ts
export class GeminiKeyManager {
  private static cooldowns: Map<number, number> = new Map();
  static markAsExhausted(index: number, durationMs: number = 60000): void;
  static isKeyAvailable(index: number): boolean;
}
```

## Testing Strategy
| Layer | What to Test | Approach |
|-------|-------------|----------|
| **Unit** | `GeminiKeyManager` | Test that `markAsExhausted` saves timestamp and `isKeyAvailable` returns false during duration. |
| **Unit** | `GeminiService` | Mock manager to return `false` for key #0 and verify service skips to #1 without calling fetch. |

## Migration / Rollout
No configuration changes required. The system will automatically start tracking and skipping exhausted keys once deployed.

## Open Questions
- None.
