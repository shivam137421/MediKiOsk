-- ==============================================================================
-- MEDIKIOSK — INITIAL SEED DATA MIGRATION
-- ==============================================================================
-- Version: 20260823000002_seed_data.sql
-- Description: Inserts standard departments, kiosks, demo patients, encounters,
--              triage alerts, medications, allergies, and AYUSH assessment data.
-- ==============================================================================

-- 1. DEPARTMENTS
INSERT INTO departments (id, name, code, is_ayush, description) VALUES
('d1111111-1111-1111-1111-111111111111', 'Cardiology & Internal Medicine', 'CARDIO', FALSE, 'Adult cardiology, hypertension, acute chest pain triage'),
('d2222222-2222-2222-2222-222222222222', 'General Medicine & Diabetology', 'GENMED', FALSE, 'Outpatient general medicine, chronic disease management'),
('d3333333-3333-3333-3333-333333333333', 'Ayurveda & Panchakarma (AYUSH)', 'AYUSH-AYU', TRUE, 'All India Institute of Ayurveda OPD, Prakriti & Nadi assessment'),
('d4444444-4444-4444-4444-444444444444', 'Emergency & Acute Triage', 'EMER-TRIAGE', FALSE, 'Resuscitation, critical red-flag triage, Manchester protocol')
ON CONFLICT (code) DO NOTHING;

-- 2. KIOSKS
INSERT INTO kiosks (id, name, location, department_id, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Kiosk 01 (OPD Main Lobby)', 'Main Hospital Atrium Gate 1', 'd1111111-1111-1111-1111-111111111111', TRUE),
('22222222-2222-2222-2222-222222222222', 'Kiosk 02 (Emergency Entrance)', 'Emergency Department Corridor', 'd4444444-4444-4444-4444-444444444444', TRUE),
('33333333-3333-3333-3333-333333333333', 'Kiosk 03 (AYUSH Wing)', 'AYUSH OPD Complex Room 102', 'd3333333-3333-3333-3333-333333333333', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. DEMO PATIENTS
INSERT INTO patients (id, abha_id, demo_id, full_name, gender, date_of_birth, age_years, phone, preferred_language, address, emergency_contact_name, emergency_contact_phone) VALUES
('a1111111-1111-1111-1111-111111111111', '91-4829-1029-4821', 'DEMO-P001', 'Aarav Sharma', 'male', '1976-05-14', 48, '+91 98765 43210', 'hi', 'Sector 14, Rohini, New Delhi 110085', 'Sunita Sharma (Spouse)', '+91 98765 43211'),
('a2222222-2222-2222-2222-222222222222', '91-8841-3920-5819', 'DEMO-P002', 'Radha Devi', 'female', '1962-11-20', 62, '+91 98112 34567', 'hi', 'Laxmi Nagar, East Delhi 110092', 'Amit Kumar (Son)', '+91 98112 34568'),
('a3333333-3333-3333-3333-333333333333', '91-3312-9012-4411', 'DEMO-P003', 'Ramesh Verma', 'male', '1969-02-18', 55, '+91 94550 12345', 'en', 'Aliganj, Lucknow, UP 226024', 'Meena Verma (Spouse)', '+91 94550 12346')
ON CONFLICT (demo_id) DO NOTHING;

-- 4. ENCOUNTERS
INSERT INTO encounters (id, patient_id, kiosk_id, department_id, status, priority, is_ayush_encounter, chief_complaint_summary, intake_started_at, intake_completed_at) VALUES
('e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'ready_for_doctor', 'RED', FALSE, 'Substernal chest pressure radiating to left shoulder for 2 hours, diaphoresis', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '10 minutes'),
('e2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', 'ready_for_doctor', 'YELLOW', FALSE, 'Uncontrolled blood sugars, persistent fatigue, burning sensation in feet for 3 weeks', NOW() - INTERVAL '60 minutes', NOW() - INTERVAL '40 minutes'),
('e3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333', 'ready_for_doctor', 'GREEN', TRUE, 'Bilateral knee pain, morning stiffness (Sandhigata Vata)', NOW() - INTERVAL '120 minutes', NOW() - INTERVAL '90 minutes')
ON CONFLICT (id) DO NOTHING;

-- 5. TRIAGE ALERTS (RED FLAG)
INSERT INTO triage_alerts (id, encounter_id, patient_id, severity, trigger_symptom, clinical_rationale, is_acknowledged, action_taken) VALUES
('b1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'RED', 'Crushing chest pressure radiating to left arm + profuse sweating', 'Suspected Acute Coronary Syndrome (ACS). Immediate ECG and physician evaluation required.', FALSE, 'ECG ordered, wheel-chaired to Emergency Resuscitation Bay 2')
ON CONFLICT (id) DO NOTHING;

-- 6. MEDICATIONS
INSERT INTO medications (id, encounter_id, patient_id, name, dosage, frequency, duration, route, source, verification_state) VALUES
('c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Tab Telmisartan', '40 mg', 'Once Daily (Morning)', 'Ongoing (2 years)', 'Oral', 'patient_stated', 'needs_review'),
('c2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Tab Atorvastatin', '20 mg', 'Once Daily (Night)', 'Ongoing (1 year)', 'Oral', 'document_ocr', 'needs_review'),
('c3333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Tab Metformin', '500 mg', 'Twice Daily (After meals)', '3 years', 'Oral', 'document_ocr', 'needs_review')
ON CONFLICT (id) DO NOTHING;

-- 7. ALLERGIES
INSERT INTO allergies (id, encounter_id, patient_id, allergen, category, reaction, severity, source, verification_state) VALUES
('f1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Penicillin (Amoxicillin)', 'drug', 'Urticaria and facial angioedema', 'severe', 'patient_stated', 'needs_review'),
('f2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Sulfa Drugs (Cotrimoxazole)', 'drug', 'Maculopapular rash', 'moderate', 'patient_stated', 'needs_review')
ON CONFLICT (id) DO NOTHING;

-- 8. TIMELINE EVENTS
INSERT INTO timeline_events (id, encounter_id, patient_id, event_date, title, description, event_type, source) VALUES
('e1111111-1111-1111-1111-111111111112', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '2022-04-10', 'Hypertension Diagnosed', 'Diagnosed at Max Super Speciality Hospital. Started on Tab Telmisartan 40mg.', 'diagnosis', 'patient_stated'),
('e1111111-1111-1111-1111-111111111113', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '2025-06-15', 'Lipid Profile Investigation', 'Total Cholesterol: 242 mg/dL, LDL: 168 mg/dL (Elevated). Started on Atorvastatin.', 'lab_test', 'document_ocr'),
('e1111111-1111-1111-1111-111111111114', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', CURRENT_DATE, 'Emergency Intake — Chest Pressure', 'Presented to MediKiosk with acute substernal chest discomfort radiating to left arm.', 'intake_visit', 'patient_stated')
ON CONFLICT (id) DO NOTHING;

-- 9. AI SUMMARIES (DRAFT)
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

-- 10. AYUSH ASSESSMENT
INSERT INTO ayush_assessments (id, encounter_id, patient_id, prakriti_primary, prakriti_secondary, vikriti_dosha, agni_type, koshtha_type, dhatu_affected, sattva_shakti, ahara_vihara_notes) VALUES
('02222222-2222-2222-2222-222222222222', 'e3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'Vata-Kapha', 'Pitta', 'Vata Vriddhi (Sandhigata Vata)', 'Manda', 'Krura', ARRAY['Asthi', 'Majja', 'Mamsa'], 'Madhyama', 'Excessive cold/dry food intake, irregular sleep schedule')
ON CONFLICT (id) DO NOTHING;
