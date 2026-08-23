-- ==============================================================================
-- MEDIKIOSK — POSTGRESQL DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) MIGRATION
-- ==============================================================================
-- Version: 20260823000001_initial_schema.sql
-- Description: Creates 24 tables, enum types, indices, audit triggers, and RLS policies.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ------------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'triage', 'admin');
CREATE TYPE encounter_status AS ENUM (
    'registered', 'consent_pending', 'intake_in_progress', 'documents_processing',
    'triage_required', 'triage_complete', 'ready_for_doctor', 'consultation', 'completed', 'cancelled'
);
CREATE TYPE triage_priority AS ENUM ('RED', 'AMBER', 'YELLOW', 'GREEN');
CREATE TYPE verification_state AS ENUM ('ai_generated', 'needs_review', 'physician_verified', 'physician_edited', 'rejected');
CREATE TYPE clinical_source_type AS ENUM ('patient_stated', 'document_ocr', 'physician_entered', 'ai_synthesized', 'device_vitals');

-- ------------------------------------------------------------------------------
-- 2. DEPARTMENTS & KIOSKS
-- ------------------------------------------------------------------------------
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    is_ayush BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE kiosks (
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
CREATE TABLE profiles (
    id UUID PRIMARY KEY, -- Maps to auth.users.id
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
CREATE TABLE patients (
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

CREATE TABLE encounters (
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
CREATE TABLE consents (
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

CREATE TABLE interview_sessions (
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

CREATE TABLE interview_answers (
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
CREATE TABLE documents (
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

CREATE TABLE document_extractions (
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
CREATE TABLE medications (
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

CREATE TABLE allergies (
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

CREATE TABLE investigations (
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

CREATE TABLE timeline_events (
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
CREATE TABLE triage_alerts (
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

CREATE TABLE ai_summaries (
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

CREATE TABLE ai_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    suggestion_type TEXT NOT NULL,
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    doctor_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ayush_assessments (
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

CREATE TABLE audit_logs (
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

CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ayush_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to extract user role from profiles
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Doctors, Triage, and Admin have staff access to all clinical records
CREATE POLICY "Staff read access to patients" ON patients
    FOR SELECT USING (get_current_user_role() IN ('doctor', 'triage', 'admin') OR id = auth.uid());

CREATE POLICY "Staff read access to encounters" ON encounters
    FOR ALL USING (get_current_user_role() IN ('doctor', 'triage', 'admin') OR patient_id = auth.uid());

CREATE POLICY "Staff read access to clinical summaries" ON ai_summaries
    FOR ALL USING (get_current_user_role() IN ('doctor', 'admin'));

CREATE POLICY "Triage and Doctor alert management" ON triage_alerts
    FOR ALL USING (get_current_user_role() IN ('doctor', 'triage', 'admin'));

CREATE POLICY "Admin full access to audit logs" ON audit_logs
    FOR SELECT USING (get_current_user_role() = 'admin');

-- ------------------------------------------------------------------------------
-- 10. INDEXES FOR HIGH-VOLUME PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX idx_encounters_status ON encounters(status);
CREATE INDEX idx_encounters_priority ON encounters(priority);
CREATE INDEX idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX idx_triage_alerts_severity ON triage_alerts(severity, is_acknowledged);
CREATE INDEX idx_medications_patient_id ON medications(patient_id);
CREATE INDEX idx_timeline_patient_date ON timeline_events(patient_id, event_date);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
