# MediKiosk — System Architecture & Workflow Specifications

MediKiosk is an AI-assisted patient intake and doctor appointment platform built around a linear 5-step clinical lifecycle and a 3-role permission model.

---

## 1. Role System Architecture

The application defines exactly **three user roles**:

```mermaid
graph TD
    A[MediKiosk Platform] --> B[Patient Role]
    A --> C[Doctor Role]
    A --> D[Admin Role]

    B --> B1[Voice/Text AI Intake]
    B --> B2[Clarifying MCQs]
    B --> B3[Document Upload]
    B --> B4[Appointment Tracker]

    C --> C1[Assigned Patient Queue]
    C --> C2[Clinical Summary Verification]
    C --> C3[Propose Appointment Slot]
    C --> C4[In-Person Consultation Sign-off]

    D --> D1[Triage Queue with Emergency Priority]
    D --> D2[Match & Assign Doctor]
    D --> D3[Confirm Appointment to Patient]
    D --> D4[Hospital Analytics & Audit Trail]
```

---

## 2. Linear End-to-End Workflow (5 Steps)

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    actor Admin
    actor Doctor
    participant System as MediKiosk AI & DB

    Note over Patient,System: Step 1: Patient AI Conversation Intake
    Patient->>System: Natural voice/text conversation in Hindi/English
    Patient->>System: Answers follow-up clarifying MCQs
    Patient->>System: Uploads previous prescriptions & lab reports
    System->>System: Extracts OCR entities, evaluates red-flags & recommends specialty
    System->>System: Status: submitted_waiting_assignment

    Note over Admin,System: Step 2: Admin Triage & Doctor Assignment
    Admin->>System: Reviews incoming queue (Emergencies jump to top)
    Admin->>System: Reviews AI-recommended specialty & assigns Doctor
    System->>System: Status: doctor_assigned

    Note over Doctor,System: Step 3: Doctor Review & Slot Proposal
    Doctor->>System: Reviews full patient package & history (no repeat questioning)
    Doctor->>System: Proposes appointment date/time slot & notes
    System->>System: Status: appointment_proposed

    Note over Admin,System: Step 4: Admin Confirmation
    Admin->>System: Confirms proposed appointment slot
    System->>System: Status: appointment_confirmed

    Note over Patient,Doctor: Step 5: Confirmed Consultation
    Patient->>System: Dashboard displays confirmed appointment card
    Doctor->>Patient: In-person consultation with verified pre-visit record
```

---

## 3. Queue Ordering & Emergency Prioritization

1. **Default Ordering:** First-come, first-served based on intake submission timestamp.
2. **Emergency Jump:** When an intake triggers a clinical red-flag (e.g. Acute Coronary Syndrome, severe pain >=7/10 with diaphoresis), `is_emergency = true`.
3. **Queue Behavior:** The database query and UI immediately place all emergency encounters at the **top of the Admin queue** with glowing visual badges and priority alerts.
