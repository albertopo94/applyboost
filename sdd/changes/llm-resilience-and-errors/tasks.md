# Tasks: llm-resilience-and-errors

## 1. Foundation & Testing Strategy (TDD)
- [ ] 1.1. Create a unit test for the new Error Hierarchy in `tests/unit/llm/errors.test.ts`.
- [ ] 1.2. Create a unit test for the stateless orchestrator logic in `tests/unit/llm/orchestrator.test.ts`.

## 2. Types & Interface Refactor
- [ ] 2.1. Implement `LLMBaseError` and subclasses in `src/lib/llm/types.ts`.
- [ ] 2.2. Update `AIService` interface if needed for better error standardization.

## 3. Provider Error Mapping
- [ ] 3.1. Refactor `GeminiService` (`gemini.ts`) to throw typed errors.
- [ ] 3.2. Refactor `GroqService` (`groq.ts`) to throw typed errors.
- [ ] 3.3. Refactor `CerebrasService` (`cerebras.ts`) to throw typed errors.
- [ ] 3.4. Refactor `OpenRouterService` (`openrouter.ts`) to throw typed errors.

## 4. Orchestrator Implementation (The "Heart")
- [ ] 4.1. Refactor `callLLM` in `src/lib/llm/index.ts`:
  - [ ] Remove `currentProviderIndex`.
  - [ ] Implement randomized `startIndex` loop.
  - [ ] Standardize logging and error collection.
  - [ ] Implement a clean per-provider retry loop for JSON validation.

## 5. Verification & Finalization
- [ ] 5.1. Run all unit tests and ensure they pass in **Strict TDD Mode**.
- [ ] 5.2. Perform a manual end-to-end smoke test using `/api/generate`.
- [ ] 5.3. Update `.env.example` if new LLM configuration flags are needed.
