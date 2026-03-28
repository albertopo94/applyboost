# Delta for LLM

## NEW Requirements

### Requirement: Gemini Multimodal Vision API (Ojo de Dios)

The system **MUST** implement a dedicated service to extract structured content from PDFs and Images using the Gemini Multimodal Vision API.

#### Scenario: Extract CV Content (Success)
- GIVEN a PDF or Image CV file
- WHEN a request is made to the Gemini REST API (v1beta)
- THEN the response **MUST** be a JSON object containing `markdown_content`.
- AND the `markdown_content` **SHALL** be structured (headers, bullets, tables).

#### Scenario: Interpret Visual Skill Bars
- GIVEN a CV with visual progress bars or scales
- WHEN Gemini analyzes the file
- THEN the system **SHOULD** extract them as text (e.g., "Skill Level: 70%") or in a `visual_metadata` field.

#### Scenario: Logging and Traceability (Soplones)
- GIVEN a request to the `GeminiVisionService`
- WHEN the service is initialized
- THEN it **MUST** log the start of the OCR process with a `requestId` and the size of the Base64 data.
- AND it **MUST** log the successful response or any error with the corresponding `requestId`.

#### Scenario: Timeout Abort Handling
- GIVEN a Gemini Vision request
- WHEN the processing exceeds **25 seconds**
- THEN the system **MUST** abort the `fetch` and log a `TIMEOUT_ERROR`.
