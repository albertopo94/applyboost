# Design: Multimodal CV Extraction (Ojo de Dios)

## Technical Approach
We will implement a lightweight, REST-based extraction service that leverages Gemini 3 Flash Preview's multimodal capabilities. This service will replace the local `pdf-parse` library to improve accuracy and support images, while maintaining a strict 25s timeout and detailed logging ("soplones") to ensure stability on the 768MB VPS.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **API Method** | REST (v1beta) | Minimizes RAM usage compared to the full SDK; more stable in Next.js 15. |
| **Model** | `gemini-3-flash-preview` | Superior visual reasoning for progress bars and complex layouts. |
| **Response Format** | JSON with Markdown | Ensures structured extraction while providing rich text for the optimizer. |
| **DOCX Handling** | Keep Mammoth | Faster, free, and more reliable for text-only Word documents. |
| **Timeout** | 25s AbortController | Prevents infinite hangs; provides fail-fast behavior for the Wizard UI. |

## Data Flow
```
Wizard.tsx (Client) --[File <= 5MB]--> /api/generate (Next.js)
                                           │
                                           ▼
                                    cvParser.ts (Orchestrator)
                                           │
                                           ├─> .docx? --> mammoth (Local)
                                           │
                                           └─> .pdf/.jpg? --> gemini-vision.ts (REST)
                                                                 │
                                                                 ▼
                                                       Google AI Studio API
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/llm/gemini-vision.ts` | Create | New service for REST-based multimodal extraction. |
| `src/lib/parsers/cvParser.ts` | Modify | Implement orchestration logic and call `GeminiVisionService`. |
| `src/components/wizard/CVInput.tsx` | Modify | Add `.jpg/.png` support and 5MB frontend validation. |
| `package.json` | Modify | Remove `pdf-parse` and `@types/pdf-parse`. |

## Interfaces / Contracts

```typescript
export interface CVExtractionResult {
  markdown_content: string; // The full structured CV text
  personal_info: {
    full_name: string;
    email: string;
    phone?: string;
  };
  visual_metadata?: string[]; // Interpreted data (e.g., "English: 100%")
  detected_language: string;
}
```

## Testing Strategy
| Layer | What to Test | Approach |
|-------|-------------|----------|
| **Unit** | `GeminiVisionService` | Mock `fetch` to verify Base64 payload and JSON parsing. |
| **Integration** | `cvParser` | Verify that file types are correctly routed to Gemini or Mammoth. |
| **Manual** | OCR Accuracy | Test with `CV_Alberto_perez_Ojeda.pdf` and verify skill bar interpretation. |

## Migration / Rollout
No database migration required. We will keep `pdf-parse` in `package.json` until the new flow is verified in the development environment.

## Open Questions
- None.
