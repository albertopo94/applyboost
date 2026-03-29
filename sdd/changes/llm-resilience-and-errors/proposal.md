# Proposal: llm-resilience-and-errors

## Intent
Standardize error handling and make the LLM Orchestrator stateless and robust.

## Current Problems
1. **Global Mutable State**: `currentProviderIndex` in `index.ts` is not stateless (breaks in Serverless/Multi-node).
2. **String Matching Errors**: Catching errors by `.message.includes("429")` is fragile.
3. **Hardcoded Retries**: Nested try-catch in `callLLM` is hard to maintain.
4. **Inconsistent Logging**: Different log formats for different providers.

## Proposed Changes
1. **Error Hierarchy**: Define `LLMBaseError` and subclasses (`RateLimitError`, `TimeoutError`, `InvalidResponseError`, `ProviderError`) in `types.ts`.
2. **Stateless Orchestrator**: Refactor `callLLM` to remove `currentProviderIndex`. Use a randomized starting index for each request to achieve load balancing without shared state.
3. **Standardized Fallback**: The orchestrator will try all providers in a shuffled order, with a clear fallback logic.
4. **Clean Retries**: Implement a simpler retry loop for JSON validation errors.

## Impact
- **Modules**: `src/lib/llm/*`, `src/app/api/generate/route.ts` (error handling only).
- **Stability**: Much higher resilience against provider failures and better debugging.

## Rollback Plan
Revert changes to `src/lib/llm/` using git.
