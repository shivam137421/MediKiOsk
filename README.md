# MediKiosk — AI-Assisted Clinical Intake & Triage System

**SIH Problem Statement ID:** 26047 — *Patient Case-Taking Software*  
**Organization:** Ministry of Ayush · All India Institute of Ayurveda  
**Category:** Software · **Theme:** Smart Automation

---

## 1. Overview

**MediKiosk** is a clinical-grade, AI-assisted digital intake and case-taking platform engineered for high-volume Indian hospitals and AYUSH institutions. It bridges the critical window between patient arrival and physician consultation:

```
Patient Arrival → Digital ID (ABHA/Demo) & Informed Consent → AI Clinical Interview (Voice + Touch) 
→ Document Upload & OCR → Medical Entity Extraction & Validation → Clinical Timeline Generation 
→ Red-Flag Detection & Triage Alerts → Doctor Review / Edit / Confirmation → AI Decision Support (Optional) 
→ FHIR / EMR / ABDM Ready Export → Comprehensive Audit Trail
```

### Safety & Clinical Principles
- **Decision-Support Only:** MediKiosk is not an autonomous diagnostic or prescription engine. All AI outputs are labeled:  
  `"AI-generated draft — physician verification required"`.
- **Doctor-in-the-Loop:** Physicians retain 100% control to edit, confirm, reject, or annotate any generated record or suggestion.
- **Provider Abstraction:** Real AI/OCR/Speech providers and reliable local/mock fallback engines are interchangeable via standard interfaces (`src/lib/providers/`).

---

## 2. Tech Stack & Verified Versions

| Layer | Technology | Actual Version Installed |
|---|---|---|
| **Runtime** | Node.js | `v24.11.0` |
| **Package Manager** | npm | `11.6.1` |
| **Web Framework** | Next.js (App Router) | `14.2.15` |
| **Language** | TypeScript | `5.6.3` |
| **UI Styling** | Tailwind CSS + CSS Variables | `3.4.14` |
| **Component System** | shadcn/ui design tokens + Lucide Icons | `lucide-react 0.453.0` |
| **Backend & DB** | Supabase (PostgreSQL, RLS, Auth, Realtime) | `@supabase/supabase-js 2.45.4` |
| **Auth SSR** | Supabase SSR Utilities | `@supabase/ssr 0.5.1` |
| **Speech (ASR/TTS)** | Web Speech API + Pluggable Speech Provider | Native Browser API / Fallback |
| **Document OCR** | Pluggable OCR Engine + Local Medical Parser | Provider Abstraction |
| **AI Text Engine** | Anthropic Claude API / Pluggable Mock Engine | Provider Abstraction |

---

## 3. Directory Structure

```
MediKiOsk/
├── .env.example                # Documented configuration template
├── README.md                   # Full system documentation & run guide
├── PROMPTS.md                  # Versioned AI system prompts
├── CHECKPOINTS.md              # Checkpoint log (CP-01 to CP-20)
├── ARCHITECTURE.md             # System & data-flow architecture
├── MANUAL_SETUP.md             # External integration setup guide
├── components.json             # shadcn/ui configuration
├── next.config.mjs             # Next.js configuration
├── package.json                # Project dependencies and scripts
├── postcss.config.mjs          # PostCSS configuration
├── tailwind.config.ts          # Tailwind clinical theme tokens
├── tsconfig.json               # TypeScript compiler config
├── supabase/
│   └── migrations/             # Versioned PostgreSQL DDL & RLS scripts
└── src/
    ├── app/                    # Next.js App Router pages
    │   ├── globals.css         # Clinical design system & CSS tokens
    │   ├── layout.tsx          # Root layout with theme & notifications
    │   ├── page.tsx            # Portal Hub (role selection & overview)
    │   ├── kiosk/              # Patient Kiosk flow (Identity -> Consent -> Interview -> Docs)
    │   ├── doctor/             # Physician Clinical Dashboard
    │   ├── triage/             # Emergency / Nurse Triage Dashboard
    │   ├── admin/              # Hospital Administration & Audit Portal
    │   └── auth/               # Role Login & Demo Switcher
    ├── components/             # Reusable UI & clinical components
    │   ├── ui/                 # Buttons, dialogs, cards, badges, inputs
    │   ├── kiosk/              # Voice visualizer, question cards, touch pickers
    │   ├── doctor/             # Summary editor, timeline viewer, suggestions box
    │   ├── triage/             # Red-flag live feed, patient priority queue
    │   ├── admin/              # Audit table, system analytics, kiosk toggles
    │   └── common/             # Navigation bars, role badges, alerts
    ├── lib/                    # Core business logic & providers
    │   ├── providers/          # AI, OCR, Speech, FHIR abstraction layer
    │   ├── ontology/           # Clinical interview rules & symptom trees
    │   ├── rules/              # Red-flag classification & triage scoring
    │   ├── supabase/           # Client, Server, and Mock DB implementations
    │   └── utils/              # Formatting, validation, date helpers
    └── types/                  # TypeScript domain models
        ├── database.ts         # Supabase PostgreSQL schema interfaces
        ├── clinical.ts         # Patient records, HPI, Meds, Allergies, AYUSH
        ├── fhir.ts             # FHIR R4 interoperability interfaces
        └── ontology.ts         # Interview tree & question schemas
```

---

## 4. Prerequisites

1. **Node.js**: `v18.0.0` or higher (Recommended: `v24.x`)
2. **npm**: `v9.x` or higher (Tested with `v11.6.1`)
3. **Web Browser**: Modern Chromium (Chrome, Edge) or Firefox with microphone permissions enabled for voice intake.

---

## 5. Environment Variables & Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### Key Environment Variables:
```ini
# Supabase Configuration (Optional for local demo mode, required for cloud Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Provider Configuration (Optional - falls back to built-in clinical rule & mock AI engine)
ANTHROPIC_API_KEY=your-anthropic-key-if-available
AI_PROVIDER=mock # or "anthropic"

# OCR Provider Configuration (Optional - falls back to built-in medical document parser)
OCR_PROVIDER=mock # or "google_vision" / "tesseract"
```

---

## 6. Running Locally

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Typecheck
```bash
npm run typecheck
npm run build
npm run start
```

---

## 7. Demo Accounts & Role Switcher

MediKiosk comes with pre-configured demo roles accessible from the navigation bar or login screen:

| Role | Access URL | Default User | Capabilities |
|---|---|---|---|
| **Patient** | `/kiosk` | Demo Patient (Aarav Sharma / Radha Devi) | Multilingual voice+touch intake, document upload, review summary |
| **Doctor** | `/doctor` | Dr. Ananya Sen (Cardiology / General) | Review clinical queue, edit AI draft summary, verify meds/allergies, AI suggestions |
| **Triage / Nurse** | `/triage` | Nurse Rajesh Kumar | Live red-flag queue, prioritize emergencies, assign departments |
| **Admin** | `/admin` | Admin Vikramaditya | View intake metrics, audit logs, toggle AYUSH mode & AI suggestions |

---

## 8. End-to-End Demo Workflow

1. Navigate to `/kiosk` — Select **Hindi** or **English**, enter ABHA ID or click **Use Demo Patient**.
2. Listen to audio consent, check consent box, and proceed to **Clinical Interview**.
3. Answer structured symptoms (e.g. Chest pain + shortness of breath) via Voice or Touch buttons.
4. Upload sample medical reports or prescriptions.
5. Watch the automated Red-Flag detection trigger high-priority status.
6. Open `/triage` in a new tab to see the live emergency alert.
7. Open `/doctor` to view the comprehensive structured summary, timeline, extracted lab values, and doctor-controlled AI suggestions.
8. Verify and sign off the consultation.
9. Open `/admin` to inspect the complete audit trail and analytics.

---

## 9. Known Limitations & Safe Operation

- **Browser Speech API:** Voice recognition uses Web Speech API. Accuracy depends on browser microphone permissions and ambient noise. Touch options are always available alongside voice.
- **Mock OCR & AI:** When no Anthropic or OCR API keys are supplied in `.env.local`, the system runs on the built-in deterministic clinical rule engine and returns realistic clinical extractions with a prominent `"Demo Mock Provider"` tag.
- **Interoperability:** Generated FHIR resources conform to FHIR R4 schema structures for forward-compatibility without claiming official ABDM certification.
