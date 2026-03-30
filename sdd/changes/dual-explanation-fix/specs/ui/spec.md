# Spec: dual-explanation-fix

## Requirements

1. **In-Memory Data Flow**: The `cv_explanation` data MUST be passed from the LLM result directly to the frontend via the `GenerationService` return object.
2. **Zero DB impact**: The database schema SHALL NOT be modified. No new columns or insert logic.
3. **UI Symmetry**: 
   - Left: "Perché questo curriculum funziona" (ShieldCheck icon).
   - Right: "Perché questa lettera funziona" (PenTool icon).

## Scenarios

### Scenario 1: Successful display without DB save
**Given** a generation is completed
**When** the result is returned to the UI
**Then** both rationales MUST be visible in the dual-column panel.
