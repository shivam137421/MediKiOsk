# MediKiosk — System & Data Architecture

This document details the high-level architecture, module decomposition, data pipelines, and provider abstractions of the **MediKiosk** AI-assisted clinical intake system.

---

## 1. High-Level Architecture Diagram

```
+----------------------------------------------------------------------------------------------------+
|                                      PATIENT INTAKE KIOSK (Voice + Large Touch UI)                  |
|  - Language Selector (EN / HI)   - Consent Audio/Visual   - Symptom Ontology Trees  - Camera/Upload |
+--------------------------------------------------+-------------------------------------------------+
                                                   |
                                                   v
+----------------------------------------------------------------------------------------------------+
|                                    MEDIKIOSK ORCHESTRATION LAYER                                  |
|                                                                                                    |
|  +---------------------------+   +----------------------------+   +-----------------------------+  |
|  |     AI Dialogue Engine    |   |     OCR & Document AI      |   |      Red-Flag Sentinel      |  |
|  | (Anthropic / Local Rules) |   | (Textract/Vision/Local OCR)|   | (Emergency Triage Rulesets) |  |
|  +-------------+-------------+   +--------------+-------------+   +--------------+--------------+  |
|                |                                |                                |                 |
|                +--------------------------------+--------------------------------+                 |
|                                                 |                                                  |
|                                                 v                                                  |
|                               +----------------------------------+                                 |
|                               |  Validation & Confidence Layer   |                                 |
|                               | (Checks types, ranges, FHIR map) |                                 |
|                               +-----------------+----------------+                                 |
+-------------------------------------------------|--------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                               SUPABASE DATA LAYER (PostgreSQL + RLS + Realtime)                    |
|  - patients          - encounters         - consents           - interview_answers                 |
|  - documents         - extractions        - medications        - allergies                         |
|  - triage_alerts     - timeline_events    - ai_summaries       - audit_logs                        |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                  +-------------------------------+-------------------------------+
                  |                               |                               |
                  v                               v                               v
+--------------------------------+ +-----------------------------+ +---------------------------------+
|        DOCTOR DASHBOARD        | |       TRIAGE DASHBOARD      | |        ADMIN & AUDIT PORTAL     |
| - Patient Queue                | | - Live Emergency Queue      | | - Realtime Hospital Metrics     |
| - AI Summary (Draft Review)    | | - Red-Flag Interventions    | | - User & Role Management        |
| - Source-Linked Timeline       | | - Priority Assignment       | | - Department / AYUSH Config     |
| - AI Suggestions (Opt-In)      | | - Fast Escalation           | | - Tamper-Evident Audit Trails   |
| - Verification & Sign-off      | |                             | |                                 |
+--------------------------------+ +-----------------------------+ +---------------------------------+
```

---

## 2. Provider Abstraction Pattern (`src/lib/providers/`)

To prevent tight coupling to proprietary cloud APIs and guarantee 100% offline/local reliability, all external integrations follow strict TypeScript interfaces:

### A. Document OCR Provider
```typescript
export interface DocumentOCRResult {
  rawText: string;
  confidence: number;
  detectedLanguage: string;
  pages: number;
  extractedEntities: ExtractedMedicalEntities;
  provider: "google_vision" | "aws_textract" | "tesseract" | "mock";
}

export interface DocumentOCRProvider {
  processDocument(file: File | Blob, mimeType: string): Promise<DocumentOCRResult>;
}
```

### B. Speech Engine (ASR / TTS) Provider
```typescript
export interface SpeechProvider {
  startListening(onResult: (text: string, isFinal: boolean) => void, onError: (err: any) => void): void;
  stopListening(): void;
  synthesizeSpeech(text: string, language: "en" | "hi"): Promise<void>;
  cancelSpeech(): void;
}
```

### C. AI Clinical Reasoning Provider
```typescript
export interface AIReasoningProvider {
  parseDialogue(transcript: string, questionContext: QuestionContext): Promise<ParsedDialogueResponse>;
  generateSummary(intakeData: IntakeBundle): Promise<AISummaryResponse>;
  generateSuggestions(clinicalSummary: string, patientAge: number): Promise<AISuggestionsResponse>;
}
```

---

## 3. Data Flow & State Pipeline

1. **Intake Inception:** Patient creates or logs into an encounter (`encounters.status = 'consent_pending'`).
2. **Consent Stored:** Audio-explained consent stored in `consents` table with timestamp, version, and IP/terminal hash.
3. **Adaptive Interview:** Step-by-step questions dispatched from `ontology.ts`. Answers parsed and autosaved to `interview_answers`.
4. **Safety Sentinel Check:** If answers or vitals trigger threshold rules (e.g. chest pain + diaphoresis), a row is immediately inserted into `triage_alerts` (`severity = 'RED'`), and Supabase Realtime broadcasts to `/triage`.
5. **Document Ingestion:** Patient uploads prescription/lab images. OCR extracted into `document_extractions` with confidence scoring.
6. **Timeline Assembly:** An automated event builder aggregates historical diagnoses, past admissions, prescriptions, and current visit milestones chronologically.
7. **Clinical Summary Synthesis:** The AI Summary Engine produces structured Markdown with explicit source tags (`[Patient Stated]`, `[Doc OCR: Presc-01]`, `[AI Suggested]`).
8. **Physician Review:** Attending doctor in `/doctor` reviews the summary, corrects fields if necessary (saving original and edited version for audit), optionally toggles AI suggestions, and verifies.
9. **Finalization:** Encounter status set to `completed`, FHIR bundle exportable, audit log finalized.

---

## 4. FHIR R4 Interoperability Shape

MediKiosk maps internal clinical schemas to standard FHIR R4 resources:
- `FHIR Patient` ← `patients`
- `FHIR Encounter` ← `encounters`
- `FHIR Condition` ← `clinical_history` (Chief complaints & past diagnoses)
- `FHIR MedicationStatement` ← `medications`
- `FHIR AllergyIntolerance` ← `allergies`
- `FHIR DiagnosticReport` ← `investigations` + `document_extractions`
- `FHIR QuestionnaireResponse` ← `interview_answers`
