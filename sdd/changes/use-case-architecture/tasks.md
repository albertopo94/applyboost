# Tasks: use-case-architecture (OptimizeCVFlow)

## 1. Foundation (TDD)
- [ ] 1.1. Create a unit test for `OptimizeCVUseCase` in `tests/unit/use-cases/OptimizeCVUseCase.test.ts`.
- [ ] 1.2. Define the `OptimizeCVRequest` and `OptimizeCVResponse` types.

## 2. Use Case Implementation
- [ ] 2.1. Create `src/lib/use-cases/OptimizeCVUseCase.ts`.
- [ ] 2.2. Extract Auth/Quota logic (Step 1).
- [ ] 2.3. Extract OCR logic (Step 2).
- [ ] 2.4. Extract Language & Prompt logic (Step 3).
- [ ] 2.5. Extract Generation logic (Step 4).
- [ ] 2.6. Extract Persistence logic (Step 5).
- [ ] 2.7. Implement the `onProgress` callback throughout the flow.

## 3. API Route Refactor
- [ ] 3.1. Simplify `src/app/api/generate/route.ts` to only handle stream and FormData.
- [ ] 3.2. Inject the `onProgress` callback into the stream writer.

## 4. Verification
- [ ] 4.1. Run unit tests for the Use Case.
- [ ] 4.2. Run E2E smoke test for the optimization flow.
- [ ] 4.3. Verify logs still contain the `requestId` for debugging.
