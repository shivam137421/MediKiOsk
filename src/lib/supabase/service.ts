import { supabase } from './client';
import { mockDB, AVAILABLE_DOCTORS, DoctorStaff } from './mock-db';
import { 
  Patient, 
  Encounter, 
  TriageAlert, 
  AISummary, 
  AISuggestion, 
  AuditLog 
} from '@/types/clinical';

class DataService {
  // 1. PATIENTS
  async getPatients(): Promise<Patient[]> {
    try {
      if (!supabase) return mockDB.getPatients();
      const { data, error } = await supabase.from('patients').select('*');
      if (error || !data || data.length === 0) {
        return mockDB.getPatients();
      }
      return data as Patient[];
    } catch {
      return mockDB.getPatients();
    }
  }

  async getPatientById(id: string): Promise<Patient | null> {
    try {
      if (!supabase) return mockDB.getPatientById(id) || null;
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`id.eq.${id},demo_id.eq.${id}`)
        .single();
      if (error || !data) {
        return mockDB.getPatientById(id) || null;
      }
      return data as Patient;
    } catch {
      return mockDB.getPatientById(id) || null;
    }
  }

  async createPatient(patientData: Omit<Patient, 'id' | 'created_at'>): Promise<Patient> {
    try {
      if (!supabase) return mockDB.createPatient(patientData);
      const { data, error } = await supabase
        .from('patients')
        .insert(patientData as any)
        .select()
        .single();
      if (error || !data) {
        return mockDB.createPatient(patientData);
      }
      return data as Patient;
    } catch {
      return mockDB.createPatient(patientData);
    }
  }

  // 2. ENCOUNTERS
  async getEncounters(): Promise<Encounter[]> {
    try {
      if (!supabase) return mockDB.getEncounters();
      const { data, error } = await supabase
        .from('encounters')
        .select('*')
        .order('is_emergency', { ascending: false })
        .order('created_at', { ascending: false });
      if (error || !data || data.length === 0) {
        return mockDB.getEncounters();
      }
      return data as Encounter[];
    } catch {
      return mockDB.getEncounters();
    }
  }

  async getEncountersByDoctor(doctorId: string): Promise<Encounter[]> {
    try {
      if (!supabase) return mockDB.getEncountersByDoctor(doctorId);
      const { data, error } = await supabase
        .from('encounters')
        .select('*')
        .eq('assigned_doctor_id', doctorId)
        .order('is_emergency', { ascending: false })
        .order('created_at', { ascending: false });
      if (error || !data || data.length === 0) {
        return mockDB.getEncountersByDoctor(doctorId);
      }
      return data as Encounter[];
    } catch {
      return mockDB.getEncountersByDoctor(doctorId);
    }
  }

  async createEncounter(encounterData: Partial<Encounter>): Promise<Encounter> {
    try {
      if (!supabase) return mockDB.createEncounter(encounterData);
      const { data, error } = await supabase
        .from('encounters')
        .insert(encounterData as any)
        .select()
        .single();
      if (error || !data) {
        return mockDB.createEncounter(encounterData);
      }
      return data as Encounter;
    } catch {
      return mockDB.createEncounter(encounterData);
    }
  }

  async updateEncounter(id: string, updates: Partial<Encounter>): Promise<Encounter | null> {
    try {
      if (!supabase) return mockDB.updateEncounter(id, updates);
      const { data, error } = await (supabase.from('encounters') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error || !data) {
        return mockDB.updateEncounter(id, updates);
      }
      return data as Encounter;
    } catch {
      return mockDB.updateEncounter(id, updates);
    }
  }

  // --- STEP 2: ADMIN ASSIGNS DOCTOR ---
  async assignDoctor(encounterId: string, doctorId: string, adminId: string, notes?: string): Promise<Encounter | null> {
    try {
      if (supabase) {
        await (supabase.from('encounters') as any)
          .update({
            assigned_doctor_id: doctorId,
            status: 'doctor_assigned',
          })
          .eq('id', encounterId);
      }
      return mockDB.assignDoctor(encounterId, doctorId, adminId, notes);
    } catch {
      return mockDB.assignDoctor(encounterId, doctorId, adminId, notes);
    }
  }

  // --- STEP 3: DOCTOR PROPOSES APPOINTMENT ---
  async proposeAppointment(
    encounterId: string,
    proposedTime: string,
    mode: 'in_person' | 'video_consult',
    notes: string,
    doctorId: string
  ): Promise<Encounter | null> {
    try {
      if (supabase) {
        await (supabase.from('encounters') as any)
          .update({
            proposed_appointment_time: proposedTime,
            appointment_mode: mode,
            doctor_proposed_notes: notes,
            status: 'appointment_proposed',
          })
          .eq('id', encounterId);
      }
      return mockDB.proposeAppointment(encounterId, proposedTime, mode, notes, doctorId);
    } catch {
      return mockDB.proposeAppointment(encounterId, proposedTime, mode, notes, doctorId);
    }
  }

  // --- STEP 4: ADMIN CONFIRMS APPOINTMENT ---
  async confirmAppointment(
    encounterId: string,
    confirmedTime: string,
    adminId: string,
    location?: string,
    notes?: string
  ): Promise<Encounter | null> {
    try {
      if (supabase) {
        await (supabase.from('encounters') as any)
          .update({
            confirmed_appointment_time: confirmedTime,
            appointment_location: location || 'Main Hospital Consultation Suite',
            admin_confirmation_notes: notes || 'Confirmed by Hospital Admin.',
            status: 'appointment_confirmed',
          })
          .eq('id', encounterId);
      }
      return mockDB.confirmAppointment(encounterId, confirmedTime, adminId, location, notes);
    } catch {
      return mockDB.confirmAppointment(encounterId, confirmedTime, adminId, location, notes);
    }
  }

  getAvailableDoctors(specialty?: string): DoctorStaff[] {
    return mockDB.getAvailableDoctors(specialty);
  }

  // 3. TRIAGE & RED FLAGS
  async getTriageAlerts(): Promise<TriageAlert[]> {
    try {
      if (!supabase) return mockDB.getTriageAlerts();
      const { data, error } = await supabase
        .from('triage_alerts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data || data.length === 0) {
        return mockDB.getTriageAlerts();
      }
      return data as TriageAlert[];
    } catch {
      return mockDB.getTriageAlerts();
    }
  }

  async acknowledgeTriageAlert(id: string, adminId: string, actionTaken: string): Promise<boolean> {
    try {
      if (supabase) {
        await (supabase.from('triage_alerts') as any)
          .update({
            is_acknowledged: true,
            acknowledged_by: adminId,
            acknowledged_at: new Date().toISOString(),
            action_taken: actionTaken,
          })
          .eq('id', id);
      }

      mockDB.logAudit({
        encounter_id: null,
        patient_id: null,
        actor_id: adminId,
        actor_role: 'admin',
        action: 'EMERGENCY_ALERT_ACKNOWLEDGED',
        details: { alertId: id, actionTaken },
      });

      return true;
    } catch {
      return true;
    }
  }

  // 4. AI SUMMARIES & SUGGESTIONS
  async getAISummaryByEncounter(encounterId: string): Promise<AISummary | null> {
    try {
      if (!supabase) return mockDB.getAISummaryByEncounter(encounterId) || null;
      const { data, error } = await supabase
        .from('ai_summaries')
        .select('*')
        .eq('encounter_id', encounterId)
        .single();
      if (error || !data) {
        return mockDB.getAISummaryByEncounter(encounterId) || null;
      }
      return data as AISummary;
    } catch {
      return mockDB.getAISummaryByEncounter(encounterId) || null;
    }
  }

  async saveAISummary(summary: Omit<AISummary, 'id' | 'created_at'>): Promise<AISummary> {
    try {
      if (!supabase) return mockDB.saveAISummary(summary);
      const { data, error } = await (supabase.from('ai_summaries') as any)
        .insert(summary)
        .select()
        .single();
      if (error || !data) {
        return mockDB.saveAISummary(summary);
      }
      return data as AISummary;
    } catch {
      return mockDB.saveAISummary(summary);
    }
  }

  async updateDoctorSummary(
    summaryId: string,
    doctorId: string,
    editedText: string,
    isVerified: boolean
  ): Promise<AISummary | null> {
    try {
      if (supabase) {
        await (supabase.from('ai_summaries') as any)
          .update({
            doctor_edited_summary: editedText,
            is_verified: isVerified,
            verified_by: doctorId,
            verified_at: isVerified ? new Date().toISOString() : null,
          })
          .eq('id', summaryId);
      }

      return mockDB.updateDoctorSummary(summaryId, doctorId, editedText, isVerified);
    } catch {
      return mockDB.updateDoctorSummary(summaryId, doctorId, editedText, isVerified);
    }
  }

  async getSuggestionsByEncounter(encounterId: string): Promise<AISuggestion[]> {
    return mockDB.getSuggestionsByEncounter(encounterId);
  }

  async updateSuggestionStatus(id: string, status: 'accepted' | 'rejected', doctorId: string, feedback?: string): Promise<boolean> {
    mockDB.logAudit({
      encounter_id: null,
      patient_id: null,
      actor_id: doctorId,
      actor_role: 'doctor',
      action: `AI_SUGGESTION_${status.toUpperCase()}`,
      details: { suggestionId: id, feedback },
    });
    return true;
  }

  // 5. AUDIT LOGS
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      if (!supabase) return mockDB.getAuditLogs();
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error || !data || data.length === 0) {
        return mockDB.getAuditLogs();
      }
      return data as AuditLog[];
    } catch {
      return mockDB.getAuditLogs();
    }
  }
}

export const dataService = new DataService();
