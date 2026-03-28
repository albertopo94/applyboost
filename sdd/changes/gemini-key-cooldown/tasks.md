# Tasks: Gemini Key Cooldown Mechanism

## Phase 1: Key Manager Enhancement
- [x] 1.1 Add static `cooldowns: Map<number, number>` to `GeminiKeyManager` in `src/lib/llm/gemini-key-manager.ts`.
- [x] 1.2 Implement `markAsExhausted(index, durationMs)` to store expiration timestamp.
- [x] 1.3 Implement `isKeyAvailable(index)` to check against the current timestamp.

## Phase 2: Vision Service Integration
- [x] 2.1 Add pre-emptive cooldown check in `GeminiVisionService.extractTextFromFile` loop.
- [x] 2.2 Call `markAsExhausted(i)` when a 429 status is received from the REST API.
- [x] 2.3 Log `[GEMINI_COOLDOWN]` when skipping a key.

## Phase 3: Chat Service Integration
- [x] 3.1 Add pre-emptive cooldown check in `GeminiService.chat` loop.
- [x] 3.2 Call `markAsExhausted(i)` when a 429 status/error is caught from the SDK.
- [x] 3.3 Log `[GEMINI_COOLDOWN]` when skipping a key.

## Phase 4: Verification
- [x] 4.1 Unit Test: Verify `GeminiKeyManager` correctly tracks and expires cooldowns.
- [x] 4.2 Manual Test: Trigger 429 in one phase and confirm instant skip in the next phase via logs.
