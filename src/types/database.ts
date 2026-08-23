export type UserRole = 'patient' | 'doctor' | 'admin';

export type EncounterStatus = 
  | 'registered'
  | 'intake_in_progress'
  | 'submitted_waiting_assignment'
  | 'doctor_assigned'
  | 'appointment_proposed'
  | 'appointment_confirmed'
  | 'in_consultation'
  | 'completed'
  | 'cancelled';

export type TriagePriority = 'EMERGENCY' | 'RED' | 'AMBER' | 'YELLOW' | 'GREEN';
export type VerificationState = 'ai_generated' | 'needs_review' | 'physician_verified' | 'physician_edited' | 'rejected';
export type ClinicalSourceType = 'patient_stated' | 'document_ocr' | 'physician_entered' | 'ai_synthesized' | 'device_vitals';

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
          specialty: string | null;
          license_number: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
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
        Insert: Omit<Database['public']['Tables']['departments']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['departments']['Insert']>;
      };
      patients: {
        Row: {
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
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['patients']['Insert']>;
      };
      encounters: {
        Row: {
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
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['encounters']['Row'], 'created_at' | 'updated_at'>;
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
        Insert: Omit<Database['public']['Tables']['consents']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['consents']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          encounter_id: string;
          patient_id: string;
          file_name: string;
          file_path: string;
          file_type: string;
          file_size_bytes: number;
          ocr_status: string;
          ocr_provider: string;
          raw_ocr_text: string | null;
          confidence: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
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
        Insert: Omit<Database['public']['Tables']['medications']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['medications']['Insert']>;
      };
      allergies: {
        Row: {
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
        };
        Insert: Omit<Database['public']['Tables']['allergies']['Row'], 'created_at'>;
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
        Insert: Omit<Database['public']['Tables']['investigations']['Row'], 'created_at'>;
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
          event_type: string;
          source: ClinicalSourceType;
          source_document_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['timeline_events']['Row'], 'created_at'>;
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
        Insert: Omit<Database['public']['Tables']['triage_alerts']['Row'], 'created_at'>;
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
          recommended_specialty: string | null;
          ayush_summary: string | null;
          red_flags_highlighted: string[];
          is_verified: boolean;
          verified_by: string | null;
          verified_at: string | null;
          doctor_edited_summary: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ai_summaries']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['ai_summaries']['Insert']>;
      };
      ai_suggestions: {
        Row: {
          id: string;
          encounter_id: string;
          suggestion_type: string;
          title: string;
          details: string;
          status: string;
          doctor_feedback: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ai_suggestions']['Row'], 'created_at'>;
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
          agni_type: string;
          koshtha_type: string;
          dhatu_affected: string[];
          sattva_shakti: string;
          ahara_vihara_notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ayush_assessments']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['ayush_assessments']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          encounter_id: string | null;
          patient_id: string | null;
          actor_id: string | null;
          actor_role: string;
          action: string;
          details: Record<string, any>;
          ip_address: string | null;
          timestamp: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'timestamp'>;
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
      system_settings: {
        Row: {
          key: string;
          value: Record<string, any>;
          description: string | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['system_settings']['Row'], 'updated_at'>;
        Update: Partial<Database['public']['Tables']['system_settings']['Insert']>;
      };
    };
  };
}
