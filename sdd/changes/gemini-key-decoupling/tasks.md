# Tasks: gemini-key-decoupling

## 1. Foundation (TDD)
- [ ] 1.1. Create a unit test for `GeminiService` (single key) in `tests/unit/llm/gemini-service.test.ts`.
- [ ] 1.2. Create a unit test for `GeminiRotationProvider` in `tests/unit/llm/gemini-rotation.test.ts`.

## 2. Gemini Refactor
- [ ] 2.1. Refactor `GeminiService` to only accept ONE key in constructor.
- [ ] 2.2. Implement `GeminiRotationProvider` (which will contain the loop and cooldown logic).

## 3. Orchestrator Integration
- [ ] 3.1. Update `src/lib/llm/index.ts` to use `GeminiRotationProvider` instead of `GeminiService` directly if multiple keys exist.
- [ ] 3.2. Ensure the circular randomized fallback in the orchestrator still works.

## 4. Verification
- [ ] 4.1. Run all unit tests.
- [ ] 4.2. Verify OCR + Generation flow works (manual smoke test).
