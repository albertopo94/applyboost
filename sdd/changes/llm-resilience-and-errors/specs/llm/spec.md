# Spec: llm-resilience-and-errors

## Requirements

1. **Error Hierarchy**:
   - `LLMBaseError` (parent)
   - `LLMRateLimitError` (429/503 fallback-able)
   - `LLMTimeoutError` (fallback-able)
   - `LLMInvalidResponseError` (JSON validation failed after retries)
   - `LLMProviderError` (Unhandled provider errors)

2. **Stateless Orchestrator**:
   - The provider index MUST NOT be stored in global memory.
   - For each request, the starting provider SHALL be randomized.
   - The orchestrator SHALL try providers in a circular fashion until success or all failed.

3. **Retry Strategy**:
   - If a provider returns invalid JSON, the orchestrator SHOULD retry ONCE with the same provider before moving to the next one.

4. **Consistency**:
   - All providers MUST throw errors from the new hierarchy.
   - Logging SHALL be standardized across all providers.

## Scenarios

### Scenario 1: Successful Round-Robin Fallback
**Given** a list of providers [Groq, Cerebras, Gemini]
**And** Groq returns a `RateLimitError`
**When** `callLLM` is executed
**Then** it MUST fallback to Cerebras automatically
**And** it SHALL return the successful response from Cerebras.

### Scenario 2: JSON Validation Retry
**Given** Cerebras returns invalid JSON on the first attempt
**When** `callLLM` is executed
**Then** it MUST retry Cerebras exactly once
**And** if the second attempt succeeds, it SHALL return the result.

### Scenario 3: All Providers Fail
**Given** all configured providers are hitting rate limits
**When** `callLLM` is executed
**Then** it MUST throw `LLMInvalidResponseError` (or a composite error) after exhausting the registry.

### Scenario 4: Statelessness Verification
**Given** two concurrent requests to `callLLM`
**When** they are executed simultaneously
**Then** they SHOULD start with different providers (statistically) even if the server was just restarted.
