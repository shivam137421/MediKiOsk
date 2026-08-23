export type UserRole = 'patient' | 'doctor' | 'triage' | 'admin';

export type EncounterStatus = 
  | 'registered'
  | 'consent_pending'
  | 'intake_in_progress'
  | 'documents_processing'
  | 'triage_required'
  | 'triage_complete'
  | 'ready_for_doctor'
  | 'consultation'
  | 'completed'
  | 'cancelled';

export type TriagePriority = 'RED' | 'AMBER' | 'YELLOW' | 'GREEN';

export type VerificationState = 
  | 'ai_generated'
  | 'needs_review'
  | 'physician_verified'
  | 'physician_edited'
  | 'rejected';

export type ClinicalSourceType = 
  | 'patient_stated'
  | 'document_ocr'
  | 'physician_entered'
  | 'ai_synthesized'
  | 'device_vitals';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          email: string | null;
          phone: string | null;
          department_id: string | null;
          license_number: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      departments: {
        Row: {
          id: string;
          name: string;
          code: string;
          is_ayush: boolean;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['departments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['departments']['Insert']>;
      };
      kiosks: {
        Row: {
          id: string;
          name: string;
          location: string;
          department_id: string | null;
          is_active: boolean;
          current_encounter_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kiosks']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['kiosks']['Insert']>;
      };
      patients: {
        Row: {
          id: string;
          abha_id: string | null;
          demo_id: string;
          full_name: string;
          gender: 'male' | 'female' | 'other';
          date_of_birth: string;
          age_years: number;
          phone: string | null;
          preferred_language: 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr';
          address: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['patients']['Insert']>;
      };
      encounters: {
        Row: {
          id: string;
          patient_id: string;
          kiosk_id: string | null;
          department_id: string | null;
          attending_doctor_id: string | null;
          triage_nurse_id: string | null;
          status: EncounterStatus;
          priority: TriagePriority;
          is_ayush_encounter: boolean;
          chief_complaint_summary: string | null;
          intake_started_at: string;
          intake_completed_at: string | null;
          consultation_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['encounters']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['encounters']['Insert']>;
      };
      consents: {
        Row: {
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
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['consents']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['consents']['Insert']>;
      };
      interview_sessions: {
        Row: {
          id: string;
          encounter_id: string;
          patient_id: string;
          current_step: number;
          total_steps: number;
          is_completed: boolean;
          started_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['interview_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['interview_sessions']['Insert']>;
      };
      interview_answers: {
        Row: {
          id: string;
          session_id: string;
          question_id: string;
          question_key: string;
          category: string;
          question_text: string;
          answer_raw: string;
          answer_structured: any;
          input_mode: 'voice' | 'touch' | 'hybrid';
          confidence: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['interview_answers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['interview_answers']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          encounter_id: string;
          patient_id: string;
          file_name: string;
          file_path: string;
          file_type: 'prescription' | 'lab_report' | 'discharge_summary' | 'imaging' | 'other';
          file_size_bytes: number;
          ocr_status: 'pending' | 'processing' | 'completed' | 'failed';
          ocr_provider: string;
          raw_ocr_text: string | null;
          confidence: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      document_extractions: {
        Row: {
          id: string;
          document_id: string;
          encounter_id: string;
          patient_id: string;
          extracted_data: any;
          confidence_score: number;
          confidence_tier: 'high' | 'needs_review' | 'low';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['document_extractions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['document_extractions']['Insert']>;
      };
      medications: {
        Row: {
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
        };
        Insert: Omit<Database['public']['Tables']['medications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['medications']['Insert']>;
      };
      allergies: {
        Row: {
          id: string;
          encounter_id: string;
          patient_id: string;
          allergen: string;
          category: 'drug' | 'food' | 'environmental' | 'other' | 'none_known';
          reaction: string | null;
          severity: 'mild' | 'moderate' | 'severe' | 'life_threatening' | 'unknown';
          source: ClinicalSourceType;
          verification_state: VerificationState;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['allergies']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['allergies']['Insert']>;
      };
      investigations: {
        Row: {
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
        };
        Insert: Omit<Database['public']['Tables']['investigations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['investigations']['Insert']>;
      };
      timeline_events: {
        Row: {
          id: string;
          encounter_id: string;
          patient_id: string;
          event_date: string;
          title: string;
          description: string;
          event_type: 'diagnosis' | 'hospitalization' | 'surgery' | 'medication_start' | 'lab_test' | 'intake_visit';
          source: ClinicalSourceType;
          source_document_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['timeline_events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['timeline_events']['Insert']>;
      };
      triage_alerts: {
        Row: {
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
        };
        Insert: Omit<Database['public']['Tables']['triage_alerts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['triage_alerts']['Insert']>;
      };
      ai_summaries: {
        Row: {
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
          ayush_summary: string | null;
          red_flags_highlighted: string[];
          is_verified: boolean;
          verified_by: string | null;
          verified_at: string | null;
          doctor_edited_summary: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ai_summaries']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ai_summaries']['Insert']>;
      };
      ai_suggestions: {
        Row: {
          id: string;
          encounter_id: string;
          suggestion_type: 'follow_up_question' | 'investigation' | 'differential_consideration' | 'clinical_note';
          title: string;
          details: string;
          status: 'pending' | 'accepted' | 'rejected' | 'modified';
          doctor_feedback: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ai_suggestions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ai_suggestions']['Insert']>;
      };
      ayush_assessments: {
        Row: {
          id: string;
          encounter_id: string;
          patient_id: string;
          prakriti_primary: string;
          prakriti_secondary: string | null;
          vikriti_dosha: string;
          agni_type: 'Sama' | 'Vishama' | 'Tikshna' | 'Manda';
          koshtha_type: 'Mridu' | 'Madhyama' | 'Krura';
          dhatu_affected: string[];
          sattva_shakti: 'Pravara' | 'Madhyama' | 'Avara';
          ahara_vihara_notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ayush_assessments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ayush_assessments']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          encounter_id: string | null;
          patient_id: string | null;
          actor_id: string | null;
          actor_role: UserRole | 'system';
          action: string;
          details: any;
          ip_address: string | null;
          timestamp: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'timestamp'>;
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
      system_settings: {
        Row: {
          key: string;
          value: any;
          description: string | null;
          updated_at: string;
        };
        Insert: Database['public']['Tables']['system_settings']['Row'];
        Update: Partial<Database['public']['Tables']['system_settings']['Insert']>;
      };
    };
  };
}
