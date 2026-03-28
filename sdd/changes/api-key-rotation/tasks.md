# Tasks: API Key Rotation for Gemini

## Phase 1: Foundation (Key Manager)
- [x] 1.1 Create `src/lib/llm/gemini-key-manager.ts` to parse `GEMINI_API_KEYS` (CSV) or fallback to `GEMINI_API_KEY`.
- [x] 1.2 Implement `GeminiKeyManager` with static methods to retrieve keys and total count.

## Phase 2: Extraction Engine (Vision)
- [x] 2.1 Modify `GeminiVisionService` in `src/lib/llm/gemini-vision.ts` to implement a retry loop for each available API key.
- [x] 2.2 Update `extractTextFromFile` return type to include `usedKeyIndex`.
- [x] 2.3 Refactor `parseCV` and `parseWithGemini` in `src/lib/parsers/cvParser.ts` to return an object `{ text: string, usedKeyIndex: number }`.

## Phase 3: Orchestration Engine (Chat)
- [x] 3.1 Update `AIService` interface in `src/lib/llm/types.ts` to accept optional `excludeGeminiIndex` in the `chat` method.
- [x] 3.2 Update `GeminiService` in `src/lib/llm/gemini.ts` to implement rotation logic while respecting the `excludeGeminiIndex`.
- [x] 3.3 Update `callLLM` in `src/lib/llm/index.ts` to accept `excludeGeminiIndex` and pass it to the provider instances.

## Phase 4: API Integration
- [x] 4.1 Update `src/app/api/generate/route.ts` to capture the `usedKeyIndex` from the CV parser and pass it to `GenerationService.generateAndStore`.
- [x] 4.2 Update `GenerationService` to pass the index down to the `callLLM` orchestrator.

## Phase 5: Verification & Cleanup
- [x] 5.1 Unit Test: Verify that `GeminiKeyManager` correctly parses multiple keys.
- [x] 5.2 Unit Test: Verify that `GeminiService` skips the excluded index and continues rotation.
- [x] 5.3 manual Test: Confirm logs show `[GEMINI_ROTATION]` in Dokploy when a 429 occurs.
