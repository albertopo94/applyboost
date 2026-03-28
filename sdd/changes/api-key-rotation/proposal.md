# Proposal: API Key Rotation for Gemini

## Intent
Increase the resilience and quota limits of the Gemini-based services (both Vision and Chat) by implementing an automatic rotation mechanism for multiple API Keys. This ensures that a "Rate Limit (429)" error on one key automatically triggers a retry with the next available key.

## Scope

### In Scope
- Support `GEMINI_API_KEYS` environment variable (comma-separated list).
- Implement rotation logic in `GeminiVisionService` (OCR).
- Implement rotation logic in `GeminiService` (Optimization Chat).
- Add logging to track which key is currently being used and when a rotation occurs.

### Out of Scope
- Rotation for other providers (Groq, Cerebras) unless explicitly requested (they currently have stable quotas).
- Persisting "exhausted" state across requests (we will try sequentially per request for simplicity and statelessness).

## Approach
We will refactor the Gemini services to parse the API keys into an array. When a 429 error is detected, the service will catch the error, log the rotation, and retry the request with the next key in the array. Only after exhausting all keys will it propagate the `LLMRateLimitError`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/llm/gemini.ts` | Modified | Add internal loop for key rotation in `chat()`. |
| `src/lib/llm/gemini-vision.ts` | Modified | Add internal loop for key rotation in `extractTextFromFile()`. |
| `.env.example` | Modified | Add documentation for `GEMINI_API_KEYS`. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Latency accumulation | Low | 429 errors are returned almost instantly by Google. |
| Duplicate requests | Low | We only retry on 429, not on structural errors. |

## Rollback Plan
Setting `GEMINI_API_KEYS` to a single key or reverting to the previous single-key logic.

## Success Criteria
- [ ] A 429 error on the first key automatically triggers a successful request with the second key.
- [ ] Logs show `[GEMINI_ROTATION]` when a key is swapped.
- [ ] The system still falls back to Groq/Cerebras if ALL Gemini keys are exhausted.
