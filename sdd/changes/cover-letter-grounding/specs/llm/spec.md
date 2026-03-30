# Spec: cover-letter-grounding

## Requirements

1. **Fact-Based Justification**: Every claim in the Cover Letter MUST be linked to a specific experience or skill present in the `<CV_TEXT_ORIGINAL>`.
2. **Zero Geographic Speculation**: The model SHALL NOT mention relocation, commuting, or geographic proximity unless explicitly stated in `{{extraSections}}` or `<CV_TEXT_ORIGINAL>`.
3. **Explicit Placeholders**: If critical contact info (Email, Phone) is missing from the source, the model MUST use `[Inserire Email]` or `[Inserire Telefono]` instead of omitting or guessing.
4. **Clean Content**: No internal comments or instructions SHALL appear in the final `cover_letter` string.

## Scenarios

### Scenario 1: Missing Email Handling
**Given** a CV without a valid email address
**When** the Cover Letter is generated
**Then** the signature MUST include `[Inserire Email]`
**And** it SHALL NOT invent an email based on the candidate's name.

### Scenario 2: Gap Handling (Angular required but missing)
**Given** the job requires "Angular" but the CV only lists "JavaScript"
**When** generating the Cover Letter
**Then** the model SHALL NOT claim Angular expertise
**And** it SHOULD instead mention the "proven ability to master new frontend stacks like Angular based on existing JavaScript foundation".

### Scenario 3: Geographic Shield
**Given** the job is in "Aprilia (LT)" and the CV has no location
**When** generating the Cover Letter
**Then** the model SHALL NOT mention being "ready to relocate to Aprilia" or "nearby residence".
