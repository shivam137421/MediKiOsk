# MEDIKIOSK — MASTER BUILD PROMPT (v2)

## 0. HOW TO EXECUTE THIS PROMPT

You are the lead product architect, full-stack engineer, database engineer,
AI engineer, security engineer, QA engineer, and technical writer for this
project. You will build **MediKiosk**, a real, running software prototype —
not a mockup, not a slide deck of screens.

**Ground rules for this build:**

1. Work in checkpoints (defined in Section 15). Finish and verify one
   checkpoint before starting the next. Do not attempt the whole system in a
   single uninterrupted pass.
2. After every checkpoint: run the app, click through the relevant flow in
   the browser, check the terminal/console for errors, fix what's broken,
   then update `CHECKPOINTS.md` before moving on.
3. Never mark a feature "done" because its UI exists. It is done when it is
   wired to the database, validated, and verified working end-to-end.
4. Where a real external integration (AI provider key, OCR provider, ABDM,
   speech API) is unavailable, build a clean provider-interface + mock
   implementation (Section 12) instead of faking the UI. Log this in
   `MANUAL_SETUP.md` with exact steps for me to finish it later.
5. Never fabricate: API endpoints, credentials, "official ABDM integration,"
   OCR/AI accuracy claims, or certification claims. If something is mocked,
   say so in the UI and in the docs.
6. Stop and ask me directly only when you hit a step that truly requires a
   secret/credential/account only I can provide. Otherwise keep going
   autonomously.

---

## 1. PROJECT CONTEXT

**SIH Problem Statement ID:** 26047 — *Patient Case-Taking Software*
**Organization:** Ministry of Ayush · All India Institute of Ayurveda
**Category:** Software · **Theme:** Smart Automation

**What MediKiosk is:** an AI-assisted digital intake and case-taking
platform for high-volume Indian hospitals and AYUSH institutions. It sits
between patient arrival and doctor consultation:

```
Patient → Identity/Consent → AI Interview (voice+touch) → Document
Upload/OCR → Structured Clinical Record + Timeline → Red-Flag Detection
→ Triage → Doctor Review/Edit/Confirm → (optional) AI Decision Support
→ HIS/EMR/ABDM-ready output → Audit Trail
```

**What it is not:** an autonomous diagnostic tool. The doctor is always the
final decision-maker. AI output is always labeled as a draft requiring
verification.

**Core product principles** (apply to every screen and feature):
patient-first (usable by elderly/low-literacy/first-time digital users),
doctor-controlled AI, structured (not a generic chatbot), safety-oriented
red-flag surfacing, transparent about what's AI-generated, verifiable,
interoperability-ready, privacy-first, and visually professional (a real
clinical tool, not a generic AI SaaS template).

---

## 2. TECH STACK (fixed — do not substitute without a strong reason)

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend/data:** Supabase (PostgreSQL, Auth, Storage, Row Level Security,
  Realtime, Edge Functions)
- **State/data-fetching:** React Query (or SWR) + Supabase client
- **AI text/reasoning:** Anthropic Claude API (via a provider-abstraction
  layer — see Section 12) for interview structuring, summary generation,
  entity extraction post-processing, and suggestions
- **OCR/document AI:** pluggable provider interface; default to a real OCR
  service if a key is available, otherwise a local/mock provider that is
  clearly labeled as mock in the UI
- **Speech (ASR/TTS):** pluggable provider interface, browser Web Speech
  API as the local fallback if no paid provider is configured
- **Testing:** Vitest/Jest for unit + integration, Playwright for
  end-to-end browser tests
- **Package manager:** pnpm (or npm if pnpm unavailable — record which one
  you actually use)

Record the *actual* versions installed in `README.md` — never invent
version numbers.

---

## 3. USER ROLES & PERMISSIONS

Exactly four roles, enforced via Supabase Auth + RLS (not just UI hiding):

| Role | Core capabilities |
|---|---|
| **Patient** | register/identify, choose language, give consent, complete AI interview (voice+touch), upload documents, see own progress/status, resume interrupted intake |
| **Doctor** | patient queue, full clinical summary, documents, timeline, meds/allergies/investigations, red flags, edit/confirm/reject AI output, enable/accept/reject AI suggestions, add notes, complete consultation |
| **Triage/Nurse** | queue, red-flag alerts, priority classification, escalate/assign, triage notes, mark triage complete |
| **Admin** | user/role/department/kiosk management, analytics, feature flags/config, audit logs |

Each role must only ever see data it's authorized for — enforce this at the
database (RLS) layer, not just by hiding UI elements.

---

## 4. PATIENT FLOW (kiosk/tablet/desktop, large-touch UI)

1. **Identify** — ABHA ID, demo patient ID, or new registration. No real
   Aadhaar integration unless a real, authorized service is connected —
   otherwise use clearly-labeled demo identity flows.
2. **Language** — English + Hindi at minimum, architected for more Indian
   languages later; affects question text, voice output, and consent
   explanation.
3. **Consent** — display and audibly explain what's collected, why, who can
   access it, that AI assists processing, that the doctor makes final
   decisions. Store consent status, timestamp, version, and purpose. Never
   start clinical data collection without recorded consent.
4. **AI Clinical Interview** — see Section 5.
5. **Document Upload** — see Section 6.
6. **Review & Confirm** — patient sees a plain-language summary of what was
   collected and confirms it.
7. **Status** — patient always sees where they are in the process.

---

## 5. AI CLINICAL INTERVIEW ENGINE

This is not a general chatbot — it is a **structured interview** driven by
a clinical question ontology, with the LLM used only to make phrasing
natural and to parse free-text/voice answers into structured fields.

- Build a rules/schema layer covering: Chief Complaint, History of Present
  Illness, Past Medical History, Past Surgical History, Medication History,
  Allergy History, Family History, Personal History, Lifestyle/Diet/Sleep,
  Review of Systems, prior investigations/hospitalizations.
- Questions adapt based on: chief complaint, prior answers, age, sex
  (where clinically relevant), known history, medications, uploaded
  documents, detected risk factors, department, and AYUSH mode.
- Example ontology branch (implement at least this depth for one symptom,
  e.g. chest pain): onset → location → duration → character → severity →
  radiation → aggravating/relieving factors → associated symptoms →
  previous episodes.
- **Voice:** speech → ASR → text → clinical-field parsing, with visible
  listening/processing/understood/retry states. No continuous recording
  without explicit, visible consent.
- **Touch:** every major question needs a touch alternative (yes/no,
  multi-choice, severity scale, duration picker, body-location picker).
  Voice and touch must be freely combinable within the same interview.
- **Red-flag detection:** a rules layer (optionally AI-assisted) that can
  interrupt routine flow, raise a triage alert, and assign priority. Never
  phrase output as a diagnosis — use language like *"Potential urgent
  symptom detected — immediate clinical assessment recommended,"* never
  *"Patient has disease X."*
- **Autosave:** never lose a completed interview to a refresh; support
  resuming an interrupted session with a clear state indicator; expire
  abandoned sessions per a configurable policy.

---

## 6. DOCUMENT / OCR PIPELINE

Patient can capture (camera) or upload (image/PDF, multi-page,
multi-document) prior prescriptions, lab reports, discharge summaries,
imaging reports, procedure/surgery records, and other medical documents.

Pipeline: **upload → preprocess → OCR → language detection → text
extraction → medical entity extraction → validation → categorization →
date extraction → timeline placement → doctor verification.**

Extract where available: patient name, date, diagnosis, symptoms,
medications (name/dose/frequency/duration), allergies, investigations/lab
values with units and reference ranges, procedures, surgeries,
hospitalizations, provider info. **Never invent a missing field** — if
uncertain, mark it `"Unable to confidently extract this field"` and flag
for review. Show confidence to patients only as High confidence / Needs
review / Unable to verify; doctors can see raw confidence scores.

Abnormal lab values get a neutral flag — *"Outside provided reference
range — physician review recommended"* — never an auto-generated
diagnosis.

---

## 7. MEDICAL TIMELINE, MEDICATIONS, ALLERGIES

- Auto-build a chronological timeline from interview + documents; doctor
  can expand an event to its source document, correct dates/data, add, or
  remove events.
- Medication list merges interview + document sources, each entry showing
  source and verification state; doctor edits/verifies — the system never
  silently changes a prescription.
- Allergies are explicitly collected (drug/food/other/"none known"/
  unanswered) and shown prominently on the doctor dashboard. Never default
  to "no known allergies" when unanswered.

---

## 8. AYUSH / AYURVEDA MODE

A dedicated mode with its own question flow, capturing Prakriti, Vikriti,
Sara, Samhanana, Pramana, Satmya, Sattva, Ahara Shakti, Vyayama Shakti,
Vaya, Ahara, Vihara, relevant Nidana and Samprapti information, feeding a
dedicated Ayurvedic summary section. Treat generated Ayurvedic
interpretation as a draft requiring practitioner verification, same as the
allopathic summary — never present it as authoritative on its own.

---

## 9. AI CLINICAL SUMMARY & DOCTOR-CONTROLLED SUGGESTIONS

**Summary engine** combines interview + documents + timeline + AYUSH data
into a structured record (Chief Complaint, HPI, PMH, PSH, Medications,
Allergies, Family History, Personal History, ROS, Investigations,
Timeline, AYUSH section where relevant). Always visibly labeled **"AI-
generated draft — physician verification required."**

**Suggestion engine** (follow-up questions, suggested investigations,
decision-support notes) is **off by default**, toggleable per doctor/
hospital config. It must never auto-prescribe, auto-diagnose, or message
the patient directly. Every suggestion is labeled **"AI decision support —
not a diagnosis or prescription"** and requires explicit doctor
accept/reject/modify.

---

## 10. DASHBOARDS

**Doctor:** queue (waiting/priority/ready/completed) → patient overview →
clinical summary → red flags (visible but not alarming) → allergies
(prominent) → medications → investigations → documents (original +
extracted) → timeline → AYUSH section → AI suggestions (only if enabled)
→ actions (edit/confirm/reject/note/complete consultation).

**Triage:** active queue, urgent alerts, priority patients, wait times,
red-flag detail, acknowledge/prioritize/escalate/assign/note/complete —
all changes must propagate live to doctor/admin dashboards.

**Admin:** overview stats (volume, completion rate, avg intake time, docs
processed, alerts), user/role/department/kiosk management, analytics,
config (languages, departments, feature flags, AI-suggestion permission),
audit logs.

**Cross-dashboard sync is mandatory** — e.g. patient completes intake →
doctor queue updates; red flag detected → triage updates; doctor confirms
→ patient status updates → admin stats update. Use Supabase Realtime for
this. No isolated dashboards with disconnected dummy state.

---

## 11. DATABASE (Supabase / PostgreSQL)

Use versioned migrations under `supabase/migrations/`, proper foreign
keys/constraints, and Row Level Security on every table holding
patient-identifiable or clinical data. Suggested core tables (extend as
needed, but don't remove RLS or FK integrity when you do):

`profiles`, `roles`, `departments`, `kiosks`, `patients`, `encounters`,
`consents`, `interview_sessions`, `interview_questions`,
`interview_answers`, `clinical_history`, `ayush_assessments`, `documents`,
`document_pages`, `document_extractions`, `medications`, `allergies`,
`investigations`, `timeline_events`, `triage_alerts`, `triage_actions`,
`ai_summaries`, `ai_suggestions`, `doctor_notes`, `notifications`,
`audit_logs`, `system_settings`.

Security requirements: RLS scoped per role (patients see only their own
data; doctors/triage see only what they're authorized for); no service-role
key ever shipped to the frontend; no secrets committed; `.env` git-ignored;
`.env.example` documents every variable, required/optional, and where to
get it.

---

## 12. AI/INTEGRATION ARCHITECTURE (provider-abstraction pattern)

Do not hardcode a single AI/OCR/speech vendor into business logic. Build
clean interfaces so a mock and a real implementation are interchangeable
without touching the UI, e.g.:

```
DocumentOCRProvider        → RealOCRProvider | MockOCRProvider
SpeechProvider (ASR/TTS)   → RealSpeechProvider | BrowserSpeechProvider
HealthcareIntegrationProvider → MockFHIRProvider | RealABDMProvider (future)
```

Separate logical AI modules: Conversation Engine, Speech Engine, Clinical
Structuring Engine, Red-Flag Engine, Document AI Engine, Timeline Engine,
Summary Engine, Suggestion Engine, and a Validation Layer that checks every
AI output (required fields, enums, dates, numerics, medication fields,
confidence, source, section) before it's persisted or shown — invalid
output is retried or flagged for review, never silently saved.

Represent clinical data in FHIR-shaped structures where practical
(Patient, Encounter, Condition, Observation, MedicationStatement,
AllergyIntolerance, DiagnosticReport, DocumentReference,
QuestionnaireResponse) as a forward-compatible interoperability layer —
without claiming official ABDM/FHIR certification unless a real,
authorized integration is actually connected.

Maintain a `PROMPTS.md` file with every system prompt used (interview,
extraction, summary, red-flag classification, suggestions, translation),
versioned as they change.

---

## 13. CROSS-CUTTING REQUIREMENTS

- **Audit log** every login/logout, consent, document upload/processing,
  AI summary/suggestion generation, doctor edits/confirmations, triage
  actions, and admin config changes — role-protected, human-readable.
- **Status pipeline:** Registered → Consent Pending → Intake In Progress →
  Documents Processing → Triage Required/Complete → Ready for Doctor →
  Consultation → Completed, reflected consistently across dashboards.
- **Search/filter/sort + pagination** for all staff-facing patient lists.
- **Notifications:** toast + notification center for urgent alerts, ready-
  for-doctor, processing complete/failed, system alerts.
- **Loading/empty/error/success states** on every data-dependent screen —
  no blank screens, no dead buttons.
- **Accessibility:** keyboard nav, semantic structure, sufficient contrast,
  large touch targets, audio guidance on patient UI, clear focus states.
- **Source attribution** on every important clinical fact (patient
  stated / document extracted / physician entered / AI generated), and
  verification state (AI Generated / Needs Review / Physician Verified /
  Physician Edited) — never blur an AI draft with a verified record.
- **Data integrity:** editing AI-generated data should preserve original
  value, edited value, editor, and timestamp where practical.
- **No fake functionality anywhere:** no buttons that do nothing, no
  loaders that never resolve, no hardcoded state pretending to be
  database-backed, no placeholder pages marked complete.

---

## 14. DEMO MODE

Provide demo login accounts for patient/doctor/triage/admin, and
synthetic (never real-person) demo patients and documents, clearly marked
as demo data throughout the UI.

---

## 15. BUILD ORDER (checkpoints — complete + verify each before the next)

| # | Checkpoint |
|---|---|
| CP-01 | Project scaffold: Next.js + TS + Tailwind + shadcn, repo structure, README/PROMPTS/CHECKPOINTS/ARCHITECTURE/MANUAL_SETUP files created |
| CP-02 | Supabase project wiring: schema, migrations, RLS policies, Auth |
| CP-03 | Role system + protected routing per role |
| CP-04 | Patient kiosk shell: identify → language → consent, fully wired |
| CP-05 | Clinical interview engine (ontology + adaptive logic, touch input) |
| CP-06 | Voice integration (ASR/TTS, provider-abstracted) |
| CP-07 | Document upload + storage + OCR pipeline (provider-abstracted) |
| CP-08 | Medical entity extraction + validation layer |
| CP-09 | Timeline engine |
| CP-10 | AI clinical summary generation |
| CP-11 | Triage dashboard + red-flag alerts |
| CP-12 | Doctor dashboard (queue → summary → edit/confirm → notes) |
| CP-13 | Admin dashboard (users, departments, analytics, config, audit) |
| CP-14 | AYUSH mode |
| CP-15 | Doctor-controlled AI suggestions |
| CP-16 | Audit logging + security hardening pass |
| CP-17 | Cross-dashboard realtime sync |
| CP-18 | End-to-end tests (unit, integration, Playwright browser flow) |
| CP-19 | UI/UX polish pass (states, responsiveness, accessibility) |
| CP-20 | Final demo data, full end-to-end run, deployment-readiness check |

For every checkpoint, append to `CHECKPOINTS.md`: what was implemented,
files/DB changes, integrations touched, tests run and their results, known
issues, and the next step. Commit/tag at each checkpoint if git is
available.

---

## 16. REQUIRED DOCUMENTATION (create at CP-01, keep updated throughout)

- `README.md` — overview, architecture, stack + real versions used,
  prerequisites, env vars, setup, migrations, seed data, running locally,
  testing, demo credentials, demo workflow, known limitations. Every
  command in it must actually work.
- `PROMPTS.md` — every AI system prompt, versioned.
- `CHECKPOINTS.md` — build history per Section 15.
- `ARCHITECTURE.md` — system + data-flow diagrams in text/markdown form.
- `MANUAL_SETUP.md` — for each integration that couldn't be completed
  automatically: what it is, why manual setup is needed, what account/
  credentials are required, exact `.env` variable names, numbered setup
  steps, how to verify it worked, and a security warning about what must
  never be committed.
- `.env.example` — every variable, required/optional, source, and how to
  verify it's set correctly.

---

## 17. FINAL END-TO-END ACCEPTANCE TEST

Before declaring anything "complete," run this full scenario live in the
browser and confirm every step actually works (not just renders):

Patient registers → selects Hindi → gives consent → completes AI interview
using a mix of voice and touch, including at least one adaptive follow-up
→ uploads 2+ documents → sees OCR/extraction results (meds,
investigations, diagnoses) → timeline is generated → a red flag is
triggered on synthetic data and reaches the triage dashboard → triage
acknowledges/prioritizes → doctor opens the patient, reviews the AI
summary and source documents and timeline, edits one AI-generated field,
enables AI suggestions, accepts/rejects a suggestion, confirms the summary
→ patient status becomes Completed → admin dashboard reflects the updated
stats → audit log shows the full sequence of actions with timestamps.

The project is only "done" when this scenario passes without dead ends,
console errors, or fabricated data pretending to be real integration
output.

---

## 18. SAFETY BOUNDARY (non-negotiable)

MediKiosk is decision-support software, not an autonomous clinician. Never
represent it as capable of autonomous diagnosis, autonomous prescription,
guaranteed medical/OCR accuracy, or official government/ABDM certification
unless a real, authorized integration is actually connected and verified.
Always use: **AI-assisted**, **AI-generated draft**, **Needs physician
review**, **Physician verified**, **Decision support only**.

---

## 19. START HERE

1. Inspect the current workspace.
2. Create `README.md`, `PROMPTS.md`, `CHECKPOINTS.md`, `MANUAL_SETUP.md`,
   `ARCHITECTURE.md`.
3. Design the initial database schema and create the Supabase migration
   structure.
4. Execute CP-01, verify it runs, then proceed checkpoint by checkpoint
   through Section 15.
5. Stop only for genuinely required manual credentials — document them in
   `MANUAL_SETUP.md` and tell me exactly what to do — otherwise continue
   autonomously.
6. Do not declare the project complete until Section 17's end-to-end test
   passes.

Begin now with CP-01.