# Delta for Parsers

## MODIFIED Requirements

### Requirement: CV Parsing Orchestration

The system **MUST** orchestrate the extraction of raw text from uploaded files based on their MIME type.
(Previously: Only handled PDF and DOCX using local libraries.)

#### Scenario: Parse DOCX via Mammoth
- GIVEN an uploaded file with type `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- WHEN `parseCV` is called
- THEN the system **MUST** use the local `mammoth` library for instant extraction.

#### Scenario: Parse PDF/Image via Gemini Multimodal
- GIVEN an uploaded file with type `application/pdf`, `image/jpeg`, or `image/png`
- WHEN `parseCV` is called
- THEN the system **SHALL** call the `GeminiVisionService` to perform OCR.
- AND the process **MUST** be logged with a unique `requestId` at start, midway, and end.

#### Scenario: PDF/Image Timeout Handling
- GIVEN an OCR request to Gemini
- WHEN the processing exceeds **25 seconds**
- THEN the system **MUST** abort the request
- AND throw an `OCR_FAILED_TIMEOUT` error to prevent infinite loading.

## REMOVED Requirements

### Requirement: Local PDF Parsing

(Reason: `pdf-parse` is being replaced by Gemini Multimodal to improve accuracy and support visual reasoning/images.)
