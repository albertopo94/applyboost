# Spec: use-case-architecture (OptimizeCVFlow)

## Requirements

1. **Separation of Concerns**:
   - The API Route SHALL ONLY handle HTTP/Streaming infrastructure (extracting FormData, sending events).
   - All business logic MUST reside in the `OptimizeCVUseCase`.

2. **Asynchronous Progress Updates**:
   - The Use Case MUST provide a mechanism to notify progress (Step 1 to 5) to the UI.
   - The notification SHALL NOT depend on the `Response` or `Stream` objects directly (use callbacks).

3. **Dependency Injection**:
   - The Use Case SHOULD be instantiated with its required services (Generation, Usage, OCR, etc.).

4. **Error Handling**:
   - The Use Case SHALL throw domain-specific errors (QuotaExceeded, InvalidInput).
   - The API Route SHALL map these domain errors to appropriate HTTP status codes.

## Flow (Steps 1-5)

### Step 1: Identity & Quota
**Given** a user or anonymous ID
**When** the Use Case starts
**Then** it MUST verify authentication and check usage limits.

### Step 2: Content Extraction (OCR)
**Given** a CV file
**When** it's provided
**Then** it MUST extract text using the `cvParser`.

### Step 3: Analysis & Prompting
**Given** extracted CV text and Job Description
**When** a language is detected or specified
**Then** it MUST build the master prompt.

### Step 4: LLM Generation
**When** the prompt is ready
**Then** it MUST call the LLM Orchestrator and return the optimized result.

### Step 5: Persistence
**When** generation succeeds
**Then** it MUST persist the result and update user stats.
