# Spec: gemini-key-decoupling

## Requirements

1. **GeminiService Agnosticism**:
   - `GeminiService` SHALL NOT iterate through keys internally.
   - It MUST receive the `apiKey` from the caller.
   - It SHALL throw `LLMRateLimitError` immediately if its (single) key fails.

2. **Key Rotation Layer**:
   - The logic for picking an available key MUST be external to `GeminiService`.
   - The system SHALL support a "rotation" pattern that tries multiple keys.

3. **Exclusion Protocol**:
   - If an `excludeGeminiIndex` is provided, the key at that index MUST be skipped before reaching the service.

## Scenarios

### Scenario 1: Successful Call with First Key
**Given** two Gemini keys [Key1, Key2] are available
**When** a request is made to `GeminiService` via the rotation layer
**And** Key1 is selected and succeeds
**Then** the response MUST be returned immediately.

### Scenario 2: Automatic Key Rotation on 429
**Given** two Gemini keys [Key1, Key2] are available
**When** Key1 is selected and returns a `LLMRateLimitError` (429)
**Then** the rotation layer MUST mark Key1 as exhausted in `GeminiKeyManager`
**And** it MUST retry with Key2.

### Scenario 3: All Keys Exhausted
**Given** all Gemini keys are in cooldown
**When** a request is made
**Then** it MUST throw a `LLMRateLimitError` with the message "ALL_KEYS_IN_COOLDOWN".
