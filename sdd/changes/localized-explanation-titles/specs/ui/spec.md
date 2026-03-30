# Spec: localized-explanation-titles

## Requirements

1. **Title Localization**: The titles in the `ExplanationPanel` MUST be localized using the project's dictionary system.
2. **Supported Languages**: The titles MUST be available in English (en), Spanish (es), and Italian (it).
3. **Consistency**: The keys SHOULD be placed under `editor.explanation` in the JSON dictionaries.
4. **Dynamic Updates**: When the user changes the page language, these titles MUST update instantly.

## Scenarios

### Scenario 1: Language Switching
**Given** the user is viewing the optimized result
**When** the user switches the language from Italian to Spanish
**Then** the title "Perché questo curriculum funziona" MUST change to "Por qué este currículum funciona".
