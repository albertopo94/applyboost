# Delta for LLM (Rotation & Handover)

## NEW Requirements

### Requirement: Centralized Gemini Key Management
The system **MUST** manage multiple Gemini API Keys from a comma-separated environment variable `GEMINI_API_KEYS`.

#### Scenario: Key Rotation on 429
- GIVEN a list of N Gemini keys
- WHEN a request returns a 429 error
- THEN the service **MUST** try the next key in the list
- UNTIL all keys are exhausted or a success is achieved.

### Requirement: Key Handover (Exclusion Logic)
The system **MUST** allow the Optimization engine to exclude the key that was successfully used by the Extraction engine to maximize quota availability.

#### Scenario: Extraction returns used key index
- GIVEN a successful OCR extraction
- WHEN returning the result to the API
- THEN the system **MUST** include the `usedKeyIndex`.

#### Scenario: Optimization ignores used key
- GIVEN an optimization request with `excludeKeyIndex`
- WHEN selecting a Gemini key
- THEN the system **MUST** skip the key at that index and try the others first.

## MODIFIED Requirements

### Requirement: Multi-Provider Fallback (callLLM)
(Previously: Just rotated providers)
The system **MUST** now coordinate the exclusion index between the extraction result and the Gemini provider instance.
