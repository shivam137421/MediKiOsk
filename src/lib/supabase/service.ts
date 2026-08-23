import { supabase, isSupabaseConfigured } from './client';
import { mockDB } from './mock-db';
import { 
  Patient, 
  Encounter, 
  Consent, 
  InterviewAnswer, 
  Document, 
  Medication, 
  Allergy, 
  Investigation, 
  TimelineEvent, 
  TriageAlert, 
  AISummary, 
  AISuggestion, 
  AyushAssessment, 
  AuditLog 
} from '@/types/clinical';
import { Database } from '@/types/database';

export class MediKioskDataService {
  // 1. Patients
  async getPatients(): Promise<Patient[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as unknown as Patient[];
    }
    return mockDB.getPatients();
  }

  async getPatientById(id: string): Promise<Patient | undefined> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('patients').select('*').or(`id.eq.${id},demo_id.eq.${id}`).single();
      if (!error && data) return data as unknown as Patient;
    }
    return mockDB.getPatientById(id);
  }

  async createPatient(patient: Database['public']['Tables']['patients']['Insert']): Promise<Patient> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await (supabase.from('patients') as any).insert([patient]).select().single();
      if (!error && data) return data as unknown as Patient;
    }
    return mockDB.addPatient(patient as any);
  }

  // 2. Encounters
  async getEncounters(): Promise<Encounter[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('encounters').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as unknown as Encounter[];
    }
    return mockDB.getEncounters();
  }

  async getEncounterById(id: string): Promise<Encounter | undefined> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('encounters').select('*').eq('id', id).single();
      if (!error && data) return data as unknown as Encounter;
    }
    return mockDB.getEncounterById(id);
  }

  async createEncounter(encounter: Database['public']['Tables']['encounters']['Insert']): Promise<Encounter> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await (supabase.from('encounters') as any).insert([encounter]).select().single();
      if (!error && data) return data as unknown as Encounter;
    }
    return mockDB.addEncounter(encounter as any);
  }

  async updateEncounter(id: string, updates: Database['public']['Tables']['encounters']['Update']): Promise<Encounter | undefined> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await (supabase.from('encounters') as any).update(updates).eq('id', id).select().single();
      if (!error && data) return data as unknown as Encounter;
    }
    return mockDB.updateEncounter(id, updates);
  }

  // 3. Triage Alerts
  async getTriageAlerts(): Promise<TriageAlert[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('triage_alerts').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as unknown as TriageAlert[];
    }
    return mockDB.getTriageAlerts();
  }

  async createTriageAlert(alert: Database['public']['Tables']['triage_alerts']['Insert']): Promise<TriageAlert> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await (supabase.from('triage_alerts') as any).insert([alert]).select().single();
      if (!error && data) return data as unknown as TriageAlert;
    }
    return mockDB.addTriageAlert(alert as any);
  }

  async acknowledgeTriageAlert(alertId: string, actorId: string, actionTaken: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await (supabase.from('triage_alerts') as any)
        .update({
          is_acknowledged: true,
          acknowledged_by: actorId,
          acknowledged_at: new Date().toISOString(),
          action_taken: actionTaken,
        })
        .eq('id', alertId);
      if (!error) return true;
    }
    return mockDB.acknowledgeTriageAlert(alertId, actorId, actionTaken);
  }

  // 4. Clinical Summaries
  async getAISummaryByEncounter(encounterId: string): Promise<AISummary | undefined> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('ai_summaries').select('*').eq('encounter_id', encounterId).single();
      if (!error && data) return data as unknown as AISummary;
    }
    return mockDB.getAISummaryByEncounter(encounterId);
  }

  async saveAISummary(summary: Database['public']['Tables']['ai_summaries']['Insert']): Promise<AISummary> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await (supabase.from('ai_summaries') as any).insert([summary]).select().single();
      if (!error && data) return data as unknown as AISummary;
    }
    return mockDB.saveAISummary(summary as any);
  }

  async updateDoctorSummary(summaryId: string, doctorId: string, editedMarkdown: string, isVerified: boolean): Promise<AISummary | undefined> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await (supabase.from('ai_summaries') as any)
        .update({
          doctor_edited_summary: editedMarkdown,
          is_verified: isVerified,
          verified_by: doctorId,
          verified_at: isVerified ? new Date().toISOString() : null,
        })
        .eq('id', summaryId)
        .select()
        .single();
      if (!error && data) return data as unknown as AISummary;
    }
    return mockDB.updateDoctorSummary(summaryId, doctorId, editedMarkdown, isVerified);
  }

  // 5. AI Suggestions
  async getSuggestionsByEncounter(encounterId: string): Promise<AISuggestion[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('ai_suggestions').select('*').eq('encounter_id', encounterId);
      if (!error && data && data.length > 0) return data as unknown as AISuggestion[];
    }
    return mockDB.getSuggestionsByEncounter(encounterId);
  }

  async updateSuggestionStatus(suggestionId: string, status: 'accepted' | 'rejected' | 'modified', doctorId: string, feedback?: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await (supabase.from('ai_suggestions') as any)
        .update({ status, doctor_feedback: feedback || null })
        .eq('id', suggestionId);
      if (!error) return true;
    }
    return mockDB.updateSuggestionStatus(suggestionId, status, doctorId, feedback);
  }

  // 6. Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
      if (!error && data && data.length > 0) return data as unknown as AuditLog[];
    }
    return mockDB.getAuditLogs();
  }
}

export const dataService = new MediKioskDataService();
