# Delta for UI

## MODIFIED Requirements

### Requirement: CV Input Handling

The system **MUST** handle CV uploads from various file formats and validate their size.
(Previously: Limited to PDF and DOCX, no explicit 5MB limit.)

#### Scenario: File Size Validation (Success)
- GIVEN a CV upload request
- WHEN the user selects a file under **5MB**
- THEN the system **SHALL** accept the file and proceed to extraction.

#### Scenario: File Size Validation (Failure)
- GIVEN a CV upload request
- WHEN the user selects a file over **5MB**
- THEN the system **MUST** reject the file
- AND display a clear error message: "El archivo excede el límite de 5MB."

#### Scenario: Supported File Formats
- GIVEN the CV upload input
- WHEN the file input is rendered
- THEN the `accept` attribute **MUST** include `.pdf`, `.doc`, `.docx`, `.jpg`, `.jpeg`, and `.png`.

#### Scenario: OCR Extraction Error Messaging
- GIVEN an OCR failure during extraction (e.g., timeout, API error)
- WHEN the backend returns an `OCR_FAILED` error
- THEN the UI **MUST** display a specific toast/message suggesting manual input.
