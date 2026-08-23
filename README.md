# MediKiosk — AI-Assisted Patient Intake & Doctor Appointment System

MediKiosk is an intelligent, clinical-grade medical intake and appointment platform. It streamlines the patient experience through natural voice conversation, automated clinical summarization, emergency detection, specialty doctor matching, and appointment scheduling.

---

## 1. System Overview & End-to-End Workflow

MediKiosk operates on a linear 5-step clinical lifecycle across three distinct roles:

```
[Step 1: Patient AI Intake]
  • Voice-first natural conversation in Hindi / English (+ text option)
  • Dynamic clarifying MCQs (voice or tap/type)
  • Prescription & lab report document upload with OCR extraction
  • Structured clinical summary draft + AI-recommended specialty
       │
       ▼ (Status: submitted_waiting_assignment)
[Step 2: Admin Triage & Doctor Assignment]
  • Incoming queue with automatic Emergency Prioritization (jumps to top)
  • Admin reviews recommended medical specialty (e.g. Cardiology, Ayurveda, General Medicine)
  • Assigns available matching specialist from doctor roster
       │
       ▼ (Status: doctor_assigned)
[Step 3: Doctor Review & Slot Proposal]
  • Doctor reviews full pre-visit clinical package & source-linked timeline
  • Proposes appointment date/time slot & consultation mode
       │
       ▼ (Status: appointment_proposed)
[Step 4: Admin Confirmation]
  • Admin confirms the appointment slot and pushes live to the patient
       │
       ▼ (Status: appointment_confirmed)
[Step 5: Patient Confirmed Consultation]
  • Patient dashboard displays official confirmed appointment card
  • Doctor conducts consultation with complete pre-visit history (no repeat questioning)
```

---

## 2. The Three Roles

1. **Patient (`/patient`):**
   - Natural spoken or typed symptom intake in Hindi or English.
   - Clarifying follow-up questions answered via voice or touch.
   - Upload past medical records, prescriptions, and lab panels.
   - Live appointment tracker showing assigned doctor, confirmed time, and consultation mode.

2. **Doctor (`/doctor`):**
   - View queue of assigned patients.
   - Inspect pre-visit clinical draft, source-attributed medications, OCR documents, and medical timeline.
   - Propose appointment slots and add clinical directives.
   - Complete consultation and digital sign-off.

3. **Admin (`/admin`):**
   - Live incoming patient triage queue (Emergency-flagged patients jump to top).
   - Match and assign specialist doctors based on AI recommendation.
   - Confirm proposed appointment slots to patients.
   - Hospital throughput analytics, staff directory, and tamper-evident audit logs.

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14.2.15 (App Router), React 18.3.1, TypeScript 5.6.3 |
| **Styling** | Tailwind CSS 3.4.14, CSS Variables, Lucide Icons |
| **Database** | PostgreSQL on Supabase + Row Level Security (RLS) + Local Fallback |
| **Speech Engine** | Web Speech API ASR & TTS (Hindi / English support) |
| **Document OCR** | Pluggable OCR Interface (Extracts prescriptions, lab panels, abnormal ranges) |
| **Clinical Rules** | Red-Flag Sentinel & Manchester Acuity Scoring |

---

## 4. Running the Platform Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript typecheck
npm run typecheck

# Run end-to-end acceptance tests
npm run test:e2e
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 5. Portal Navigation

- **Main Portal Hub:** [http://localhost:3000](http://localhost:3000)
- **Patient Care Portal:** [http://localhost:3000/patient](http://localhost:3000/patient)
- **Doctor Consultation Hub:** [http://localhost:3000/doctor](http://localhost:3000/doctor)
- **Admin Center & Triage Queue:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Role Switcher & Login:** [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
