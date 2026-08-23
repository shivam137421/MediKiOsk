-- ==============================================================================
-- MEDIKIOSK — COMPLETE SUPABASE SQL SCHEMA & SEED SETUP
-- ==============================================================================
-- Run this complete script in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/mwnbovfyttvmtpccjxdn/sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'triage', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE encounter_status AS ENUM (
        'registered', 'consent_pending', 'intake_in_progress', 'documents_processing',
        'triage_required', 'triage_complete', 'ready_for_doctor', 'consultation', 'completed', 'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE triage_priority AS ENUM ('RED', 'AMBER', 'YELLOW', 'GREEN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE verification_state AS ENUM ('ai_generated', 'needs_review', 'physician_verified', 'physician_edited', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE clinical_source_type AS ENUM ('patient_stated', 'document_ocr', 'physician_entered', 'ai_synthesized', 'device_vitals');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------------------------
-- 2. DEPARTMENTS & KIOSKS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    is_ayush BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kiosks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    current_encounter_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. PROFILES (Users & Staff)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'patient',
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    license_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. PATIENTS & ENCOUNTERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    abha_id TEXT UNIQUE,
    demo_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    gender TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    age_years INTEGER NOT NULL,
    phone TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'hi',
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    kiosk_id UUID REFERENCES kiosks(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    attending_doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    triage_nurse_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status encounter_status NOT NULL DEFAULT 'registered',
    priority triage_priority NOT NULL DEFAULT 'GREEN',
    is_ayush_encounter BOOLEAN NOT NULL DEFAULT FALSE,
    chief_complaint_summary TEXT,
    intake_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    intake_completed_at TIMESTAMPTZ,
    consultation_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. CONSENTS & CLINICAL INTERVIEW
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consent_given BOOLEAN NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    language TEXT NOT NULL DEFAULT 'en',
    audio_explained BOOLEAN NOT NULL DEFAULT FALSE,
    consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    purpose TEXT NOT NULL,
    ip_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    current_step INTEGER NOT NULL DEFAULT 1,
    total_steps INTEGER NOT NULL DEFAULT 10,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    question_key TEXT NOT NULL,
    category TEXT NOT NULL,
    question_text TEXT NOT NULL,
    answer_raw TEXT NOT NULL,
    answer_structured JSONB NOT NULL DEFAULT '{}'::jsonb,
    input_mode TEXT NOT NULL DEFAULT 'touch',
    confidence NUMERIC(4, 3) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. DOCUMENTS & EXTRACTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    ocr_status TEXT NOT NULL DEFAULT 'pending',
    ocr_provider TEXT NOT NULL DEFAULT 'mock',
    raw_ocr_text TEXT,
    confidence NUMERIC(4, 3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_extractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    extracted_data JSONB NOT NULL,
    confidence_score NUMERIC(4, 3) NOT NULL,
    confidence_tier TEXT NOT NULL DEFAULT 'high',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. CLINICAL ENTITIES (Meds, Allergies, Investigations, Timeline)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    duration TEXT,
    route TEXT,
    source clinical_source_type NOT NULL DEFAULT 'patient_stated',
    source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    verification_state verification_state NOT NULL DEFAULT 'needs_review',
    doctor_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS allergies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergen TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'drug',
    reaction TEXT,
    severity TEXT NOT NULL DEFAULT 'moderate',
    source clinical_source_type NOT NULL DEFAULT 'patient_stated',
    verification_state verification_state NOT NULL DEFAULT 'needs_review',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    test_category TEXT,
    numeric_result NUMERIC,
    unit TEXT,
    reference_range TEXT,
    text_result TEXT,
    is_abnormal BOOLEAN NOT NULL DEFAULT FALSE,
    test_date DATE,
    source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_type TEXT NOT NULL,
    source clinical_source_type NOT NULL DEFAULT 'patient_stated',
    source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. TRIAGE, AI SUMMARIES & SUGGESTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS triage_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    severity triage_priority NOT NULL DEFAULT 'AMBER',
    trigger_symptom TEXT NOT NULL,
    clinical_rationale TEXT NOT NULL,
    is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    action_taken TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    summary_markdown TEXT NOT NULL,
    chief_complaint TEXT NOT NULL,
    hpi TEXT NOT NULL,
    pmh_psh TEXT NOT NULL,
    medications_summary TEXT NOT NULL,
    allergies_summary TEXT NOT NULL,
    investigations_summary TEXT NOT NULL,
    ayush_summary TEXT,
    red_flags_highlighted TEXT[] NOT NULL DEFAULT '{}',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    doctor_edited_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    suggestion_type TEXT NOT NULL,
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    doctor_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ayush_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    prakriti_primary TEXT NOT NULL,
    prakriti_secondary TEXT,
    vikriti_dosha TEXT NOT NULL,
    agni_type TEXT NOT NULL,
    koshtha_type TEXT NOT NULL,
    dhatu_affected TEXT[] NOT NULL DEFAULT '{}',
    sattva_shakti TEXT NOT NULL,
    ahara_vihara_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID,
    patient_id UUID,
    actor_id UUID,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. SEED DATA INSERTION (Valid Hexadecimal UUIDs: 0-9, a-f)
-- ------------------------------------------------------------------------------
INSERT INTO departments (id, name, code, is_ayush, description) VALUES
('d1111111-1111-1111-1111-111111111111', 'Cardiology & Internal Medicine', 'CARDIO', FALSE, 'Adult cardiology, hypertension, acute chest pain triage'),
('d2222222-2222-2222-2222-222222222222', 'General Medicine & Diabetology', 'GENMED', FALSE, 'Outpatient general medicine, chronic disease management'),
('d3333333-3333-3333-3333-333333333333', 'Ayurveda & Panchakarma (AYUSH)', 'AYUSH-AYU', TRUE, 'All India Institute of Ayurveda OPD, Prakriti & Nadi assessment'),
('d4444444-4444-4444-4444-444444444444', 'Emergency & Acute Triage', 'EMER-TRIAGE', FALSE, 'Resuscitation, critical red-flag triage, Manchester protocol')
ON CONFLICT (code) DO NOTHING;

INSERT INTO kiosks (id, name, location, department_id, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Kiosk 01 (OPD Main Lobby)', 'Main Hospital Atrium Gate 1', 'd1111111-1111-1111-1111-111111111111', TRUE),
('22222222-2222-2222-2222-222222222222', 'Kiosk 02 (Emergency Entrance)', 'Emergency Department Corridor', 'd4444444-4444-4444-4444-444444444444', TRUE),
('33333333-3333-3333-3333-333333333333', 'Kiosk 03 (AYUSH Wing)', 'AYUSH OPD Complex Room 102', 'd3333333-3333-3333-3333-333333333333', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO patients (id, abha_id, demo_id, full_name, gender, date_of_birth, age_years, phone, preferred_language, address, emergency_contact_name, emergency_contact_phone) VALUES
('a1111111-1111-1111-1111-111111111111', '91-4829-1029-4821', 'DEMO-P001', 'Aarav Sharma', 'male', '1976-05-14', 48, '+91 98765 43210', 'hi', 'Sector 14, Rohini, New Delhi 110085', 'Sunita Sharma (Spouse)', '+91 98765 43211'),
('a2222222-2222-2222-2222-222222222222', '91-8841-3920-5819', 'DEMO-P002', 'Radha Devi', 'female', '1962-11-20', 62, '+91 98112 34567', 'hi', 'Laxmi Nagar, East Delhi 110092', 'Amit Kumar (Son)', '+91 98112 34568'),
('a3333333-3333-3333-3333-333333333333', '91-3312-9012-4411', 'DEMO-P003', 'Ramesh Verma', 'male', '1969-02-18', 55, '+91 94550 12345', 'en', 'Aliganj, Lucknow, UP 226024', 'Meena Verma (Spouse)', '+91 94550 12346')
ON CONFLICT (demo_id) DO NOTHING;

INSERT INTO encounters (id, patient_id, kiosk_id, department_id, status, priority, is_ayush_encounter, chief_complaint_summary, intake_started_at, intake_completed_at) VALUES
('e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'ready_for_doctor', 'RED', FALSE, 'Substernal chest pressure radiating to left shoulder for 2 hours, diaphoresis', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '10 minutes'),
('e2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', 'ready_for_doctor', 'YELLOW', FALSE, 'Uncontrolled blood sugars, persistent fatigue, burning sensation in feet for 3 weeks', NOW() - INTERVAL '60 minutes', NOW() - INTERVAL '40 minutes'),
('e3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333', 'ready_for_doctor', 'GREEN', TRUE, 'Bilateral knee pain, morning stiffness (Sandhigata Vata)', NOW() - INTERVAL '120 minutes', NOW() - INTERVAL '90 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO triage_alerts (id, encounter_id, patient_id, severity, trigger_symptom, clinical_rationale, is_acknowledged, action_taken) VALUES
('b1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'RED', 'Crushing chest pressure radiating to left arm + profuse sweating', 'Suspected Acute Coronary Syndrome (ACS). Immediate ECG and physician evaluation required.', FALSE, 'ECG ordered, wheel-chaired to Emergency Resuscitation Bay 2')
ON CONFLICT (id) DO NOTHING;

INSERT INTO medications (id, encounter_id, patient_id, name, dosage, frequency, duration, route, source, verification_state) VALUES
('c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Tab Telmisartan', '40 mg', 'Once Daily (Morning)', 'Ongoing (2 years)', 'Oral', 'patient_stated', 'needs_review'),
('c2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Tab Atorvastatin', '20 mg', 'Once Daily (Night)', 'Ongoing (1 year)', 'Oral', 'document_ocr', 'needs_review'),
('c3333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Tab Metformin', '500 mg', 'Twice Daily (After meals)', '3 years', 'Oral', 'document_ocr', 'needs_review')
ON CONFLICT (id) DO NOTHING;

INSERT INTO allergies (id, encounter_id, patient_id, allergen, category, reaction, severity, source, verification_state) VALUES
('f1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Penicillin (Amoxicillin)', 'drug', 'Urticaria and facial angioedema', 'severe', 'patient_stated', 'needs_review'),
('f2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Sulfa Drugs (Cotrimoxazole)', 'drug', 'Maculopapular rash', 'moderate', 'patient_stated', 'needs_review')
ON CONFLICT (id) DO NOTHING;

INSERT INTO timeline_events (id, encounter_id, patient_id, event_date, title, description, event_type, source) VALUES
('e1111111-1111-1111-1111-111111111112', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '2022-04-10', 'Hypertension Diagnosed', 'Diagnosed at Max Super Speciality Hospital. Started on Tab Telmisartan 40mg.', 'diagnosis', 'patient_stated'),
('e1111111-1111-1111-1111-111111111113', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '2025-06-15', 'Lipid Profile Investigation', 'Total Cholesterol: 242 mg/dL, LDL: 168 mg/dL (Elevated). Started on Atorvastatin.', 'lab_test', 'document_ocr'),
('e1111111-1111-1111-1111-111111111114', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', CURRENT_DATE, 'Emergency Intake — Chest Pressure', 'Presented to MediKiosk with acute substernal chest discomfort radiating to left arm.', 'intake_visit', 'patient_stated')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_summaries (id, encounter_id, patient_id, chief_complaint, hpi, pmh_psh, medications_summary, allergies_summary, investigations_summary, red_flags_highlighted, summary_markdown, is_verified) VALUES
('01111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 
'Substernal chest pressure radiating to left shoulder and arm for 2 hours with diaphoresis',
'48-year-old male with known history of hypertension presenting with acute onset of severe retrosternal squeezing chest pain (8/10) that began 2 hours ago at rest. Radiating to left shoulder and jaw. Associated with profuse sweating and mild dyspnea.',
'Essential Hypertension (2022), Dyslipidemia (2025).',
'Tab Telmisartan 40mg OD, Tab Atorvastatin 20mg OD.',
'CRITICAL: Severe Penicillin Allergy (Urticaria/Angioedema)',
'Prior Lipid Profile (June 2025): Total Cholesterol 242 mg/dL, LDL 168 mg/dL. STAT ECG pending.',
ARRAY['Acute retrosternal chest pain > 30 mins radiating to left arm/jaw', 'Associated diaphoresis and dyspnea', 'High cardiovascular risk profile (Male, 48y, HTN, Dyslipidemia)'],
'### **AI-generated draft — physician verification required.**\n\n**Patient:** Aarav Sharma | 48Y / Male | ABHA: 91-4829-1029-4821\n**Triage Priority:** **RED (Immediate Assessment)**\n\n#### 1. Chief Complaint & HPI\n- **Chief Complaint:** Squeezing chest pressure for 2 hours.\n- **HPI:** Acute retrosternal pain (8/10) radiating to left arm and jaw with cold sweating.\n\n#### 2. Pertinent History & Medications\n- **PMH:** Hypertension (2 yrs), Hyperlipidemia (1 yr).\n- **Current Meds:** Telmisartan 40mg OD, Atorvastatin 20mg OD.\n- **Allergies:** **PENICILLIN (Severe Urticaria / Angioedema)**.\n\n#### 3. Red Flags & Triage Alerts\n- High suspicion of Acute Coronary Syndrome (ACS).\n- Immediate 12-lead ECG and Troponin I/T recommended.',
FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ayush_assessments (id, encounter_id, patient_id, prakriti_primary, prakriti_secondary, vikriti_dosha, agni_type, koshtha_type, dhatu_affected, sattva_shakti, ahara_vihara_notes) VALUES
('02222222-2222-2222-2222-222222222222', 'e3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'Vata-Kapha', 'Pitta', 'Vata Vriddhi (Sandhigata Vata)', 'Manda', 'Krura', ARRAY['Asthi', 'Majja', 'Mamsa'], 'Madhyama', 'Excessive cold/dry food intake, irregular sleep schedule')
ON CONFLICT (id) DO NOTHING;
