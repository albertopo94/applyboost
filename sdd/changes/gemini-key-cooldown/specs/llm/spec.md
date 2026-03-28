# Delta for LLM (Key Cooldown)

## ADDED Requirements

### Requirement: Global Key Cooldown Tracking

The `GeminiKeyManager` **MUST** provide a mechanism to track and query the cooldown status of each API key.

#### Scenario: Mark key as exhausted
- GIVEN a specific API key index
- WHEN `markAsExhausted(index)` is called
- THEN the system **MUST** store a cooldown expiration timestamp (current time + 60 seconds).

#### Scenario: Check key availability
- GIVEN a specific API key index
- WHEN `isKeyAvailable(index)` is called
- THEN it **MUST** return `false` if the current time is before the expiration timestamp.
- ELSE it **MUST** return `true`.

### Requirement: Pre-emptive Cooldown Check

LLM services **SHOULD** check the cooldown status of a key before making an external network request.

#### Scenario: Skip key in cooldown
- GIVEN a list of available Gemini keys
- WHEN a service iterates through the keys to find one to use
- THEN it **MUST** skip any key where `isKeyAvailable(index)` is `false`.
- AND log `[GEMINI_COOLDOWN] Skipping key #X`.

## MODIFIED Requirements

### Requirement: Reactive Cooldown Marking

(Previously: Just logged 429 and continued)

Services **MUST** reactively update the global cooldown state when a rate limit occurs.

#### Scenario: Mark on 429
- GIVEN a request to Google Gemini
- WHEN the response status is 429 (Rate Limit)
- THEN the service **MUST** call `GeminiKeyManager.markAsExhausted(index)`.
- AND continue the rotation loop.
