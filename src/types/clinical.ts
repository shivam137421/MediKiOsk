import { Database, UserRole, EncounterStatus, TriagePriority, VerificationState, ClinicalSourceType } from './database';

export type Patient = Database['public']['Tables']['patients']['Row'];
export type Encounter = Database['public']['Tables']['encounters']['Row'];
export type Consent = Database['public']['Tables']['consents']['Row'];
export type InterviewSession = Database['public']['Tables']['interview_sessions']['Row'];
export type InterviewAnswer = Database['public']['Tables']['interview_answers']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type DocumentExtraction = Database['public']['Tables']['document_extractions']['Row'];
export type Medication = Database['public']['Tables']['medications']['Row'];
export type Allergy = Database['public']['Tables']['allergies']['Row'];
export type Investigation = Database['public']['Tables']['investigations']['Row'];
export type TimelineEvent = Database['public']['Tables']['timeline_events']['Row'];
export type TriageAlert = Database['public']['Tables']['triage_alerts']['Row'];
export type AISummary = Database['public']['Tables']['ai_summaries']['Row'];
export type AISuggestion = Database['public']['Tables']['ai_suggestions']['Row'];
export type AyushAssessment = Database['public']['Tables']['ayush_assessments']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

export interface PatientIntakeBundle {
  patient: Patient;
  encounter: Encounter;
  consent?: Consent;
  interviewAnswers: InterviewAnswer[];
  documents: (Document & { extractions?: DocumentExtraction })[];
  medications: Medication[];
  allergies: Allergy[];
  investigations: Investigation[];
  timeline: TimelineEvent[];
  triageAlerts: TriageAlert[];
  aiSummary?: AISummary;
  aiSuggestions: AISuggestion[];
  ayushAssessment?: AyushAssessment;
}

export interface DemoUserProfile {
  id: string;
  role: UserRole;
  name: string;
  department?: string;
  badge: string;
}
