# Proposal: Gemini Key Cooldown Mechanism

## Intent
Reduce request latency by implementing a "cooldown" mechanism for Gemini API keys. Instead of retrying a key that has recently returned a 429 error, the system will track exhausted keys in memory and skip them instantly for a defined period (e.g., 60 seconds).

## Scope

### In Scope
- Update `GeminiKeyManager` to track `exhaustedUntil` timestamps for each key index.
- Add `markAsExhausted(index)` and `isKeyAvailable(index)` methods to the manager.
- Integrate these checks into `GeminiVisionService` and `GeminiService`.
- Add logging for instant skips: `[GEMINI_COOLDOWN] Skipping key #X`.

### Out of Scope
- Persistent storage of cooldowns (in-memory within the container is enough for this performance win).

## Approach
We will add a static `cooldowns: Map<number, number>` to `GeminiKeyManager`. When a 429 occurs, we store `Date.now() + 60000`. Before any request, we check if the current time has passed the cooldown.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/llm/gemini-key-manager.ts` | Modified | Add cooldown tracking logic. |
| `src/lib/llm/gemini-vision.ts` | Modified | Mark keys as exhausted on 429 and skip cooled-down keys. |
| `src/lib/llm/gemini.ts` | Modified | Mark keys as exhausted on 429 and skip cooled-down keys. |

## Success Criteria
- [ ] Requests no longer attempt to call Google with a key that recently gave a 429.
- [ ] Logs show instant skips for keys in cooldown.
- [ ] Total request time for the Chat phase is reduced by eliminating the failed 429 attempt.
