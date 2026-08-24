import {
  UserRole,
  EncounterStatus,
  TriagePriority,
  VerificationState,
  ClinicalSourceType,
} from './database';

export interface UserProfile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string | null;
  phone: string | null;
  department_id: string | null;
  specialty?: string | null;
  license_number: string | null;
  is_active: boolean;
}

export interface Patient {
  id: string;
  abha_id: string | null;
  demo_id: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  age_years: number;
  phone: string | null;
  preferred_language: string;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
}

export interface Encounter {
  id: string;
  patient_id: string;
  kiosk_id: string | null;
  department_id: string | null;
  recommended_specialty: string | null;
  assigned_doctor_id: string | null;
  proposed_appointment_time: string | null;
  confirmed_appointment_time: string | null;
  appointment_mode: 'in_person' | 'video_consult' | null;
  appointment_location: string | null;
  doctor_proposed_notes: string | null;
  admin_confirmation_notes: string | null;
  status: EncounterStatus;
  priority: TriagePriority;
  is_emergency: boolean;
  emergency_rationale: string | null;
  is_ayush_encounter: boolean;
  chief_complaint_summary: string | null;
  intake_started_at: string;
  intake_completed_at: string | null;
  consultation_completed_at: string | null;
  created_at: string;
}

export interface Consent {
  id: string;
  encounter_id: string;
  patient_id: string;
  consent_given: boolean;
  version: string;
  language: string;
  audio_explained: boolean;
  consent_timestamp: string;
  purpose: string;
  ip_hash: string | null;
}

export interface Document {
  id: string;
  encounter_id: string;
  patient_id: string;
  file_name: string;
  file_path?: string;
  file_type: string;
  file_size_bytes?: number;
  ocr_status?: string;
  ocr_provider?: string;
  raw_ocr_text?: string | null;
  confidence?: number | null;
  storage_path?: string;
  document_category?: string;
  extracted_text?: string;
  ocr_confidence?: number;
  extracted_entities?: any;
  created_at: string;
}

export interface Medication {
  id: string;
  encounter_id: string;
  patient_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  route: string | null;
  source: ClinicalSourceType;
  source_document_id: string | null;
  verification_state: VerificationState;
  doctor_notes: string | null;
  created_at: string;
}

export interface Allergy {
  id: string;
  encounter_id: string;
  patient_id: string;
  allergen: string;
  category: string;
  reaction: string | null;
  severity: string;
  source: ClinicalSourceType;
  verification_state: VerificationState;
  created_at: string;
}

export interface Investigation {
  id: string;
  encounter_id: string;
  patient_id: string;
  test_name: string;
  test_category: string | null;
  numeric_result: number | null;
  unit: string | null;
  reference_range: string | null;
  text_result: string | null;
  is_abnormal: boolean;
  test_date: string | null;
  source_document_id: string | null;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  encounter_id: string;
  patient_id: string;
  event_date: string;
  title: string;
  description: string;
  event_type: string;
  source: ClinicalSourceType;
  source_document_id: string | null;
  created_at: string;
}

export interface TriageAlert {
  id: string;
  encounter_id: string;
  patient_id: string;
  severity: TriagePriority;
  trigger_symptom: string;
  clinical_rationale: string;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  action_taken: string | null;
  created_at: string;
}

export interface AISummary {
  id: string;
  encounter_id: string;
  patient_id: string;
  summary_markdown: string;
  chief_complaint: string;
  hpi: string;
  pmh_psh: string;
  medications_summary: string;
  allergies_summary: string;
  investigations_summary: string;
  recommended_specialty: string | null;
  ayush_summary: string | null;
  red_flags_highlighted: string[];
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  doctor_edited_summary: string | null;
  created_at: string;
}

export interface AISuggestion {
  id: string;
  encounter_id: string;
  suggestion_type: string;
  title: string;
  details: string;
  suggestion_text?: string;
  confidence_score?: number;
  status: string;
  doctor_feedback: string | null;
  created_at: string;
}

export interface AyushAssessment {
  id: string;
  encounter_id: string;
  patient_id: string;
  prakriti_primary: string | null;
  prakriti_secondary: string | null;
  vikriti_dosha: string | null;
  agni_type: string | null;
  koshtha_type: string | null;
  dhatu_affected: string[];
  sattva_shakti: string | null;
  ahara_vihara_notes: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  encounter_id: string | null;
  patient_id: string | null;
  actor_id: string | null;
  actor_role: string;
  action: string;
  details: Record<string, any>;
  ip_address: string | null;
  timestamp: string;
}
