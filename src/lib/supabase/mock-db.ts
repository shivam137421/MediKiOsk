import { Patient, Encounter, Consent, InterviewAnswer, Document, DocumentExtraction, Medication, Allergy, Investigation, TimelineEvent, TriageAlert, AISummary, AISuggestion, AyushAssessment, AuditLog, DemoUserProfile } from '@/types/clinical';
import { UserRole } from '@/types/database';

export const DEMO_USERS: DemoUserProfile[] = [
  { id: 'usr-doc-01', role: 'doctor', name: 'Dr. Ananya Sen, MD (Med)', department: 'Cardiology & Internal Medicine', badge: 'Attending Physician' },
  { id: 'usr-doc-02', role: 'doctor', name: 'Vaidya Harishankar Sharma, BAMS MD', department: 'Ayurveda & Panchakarma', badge: 'AYUSH Specialist' },
  { id: 'usr-tri-01', role: 'triage', name: 'Nurse Rajesh Kumar, BSc (N)', department: 'Emergency & Triage', badge: 'Senior Triage Officer' },
  { id: 'usr-adm-01', role: 'admin', name: 'Vikramaditya Verma', department: 'Hospital Administration', badge: 'System Administrator' },
  { id: 'usr-pat-01', role: 'patient', name: 'Aarav Sharma', badge: 'Patient (Self-Checkin)' },
];

export interface MockDatabaseState {
  patients: Patient[];
  encounters: Encounter[];
  consents: Consent[];
  interviewAnswers: InterviewAnswer[];
  documents: Document[];
  documentExtractions: DocumentExtraction[];
  medications: Medication[];
  allergies: Allergy[];
  investigations: Investigation[];
  timelineEvents: TimelineEvent[];
  triageAlerts: TriageAlert[];
  aiSummaries: AISummary[];
  aiSuggestions: AISuggestion[];
  ayushAssessments: AyushAssessment[];
  auditLogs: AuditLog[];
  systemSettings: Record<string, any>;
}

// Initial Realistic Clinical Demo Data
const initialPatients: Patient[] = [
  {
    id: 'pat-001',
    abha_id: '91-4829-1029-4821',
    demo_id: 'DEMO-P001',
    full_name: 'Aarav Sharma',
    gender: 'male',
    date_of_birth: '1976-05-14',
    age_years: 48,
    phone: '+91 98765 43210',
    preferred_language: 'hi',
    address: 'Sector 14, Rohini, New Delhi 110085',
    emergency_contact_name: 'Sunita Sharma (Spouse)',
    emergency_contact_phone: '+91 98765 43211',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pat-002',
    abha_id: '91-8841-3920-5819',
    demo_id: 'DEMO-P002',
    full_name: 'Radha Devi',
    gender: 'female',
    date_of_birth: '1962-11-20',
    age_years: 62,
    phone: '+91 98112 34567',
    preferred_language: 'hi',
    address: 'Laxmi Nagar, East Delhi 110092',
    emergency_contact_name: 'Amit Kumar (Son)',
    emergency_contact_phone: '+91 98112 34568',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pat-003',
    abha_id: '91-3312-9012-4411',
    demo_id: 'DEMO-P003',
    full_name: 'Ramesh Verma',
    gender: 'male',
    date_of_birth: '1969-02-18',
    age_years: 55,
    phone: '+91 94550 12345',
    preferred_language: 'en',
    address: 'Aliganj, Lucknow, UP 226024',
    emergency_contact_name: 'Meena Verma (Spouse)',
    emergency_contact_phone: '+91 94550 12346',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const initialEncounters: Encounter[] = [
  {
    id: 'enc-001',
    patient_id: 'pat-001',
    kiosk_id: 'kiosk-01',
    department_id: 'dept-cardio',
    attending_doctor_id: 'usr-doc-01',
    triage_nurse_id: 'usr-tri-01',
    status: 'ready_for_doctor',
    priority: 'RED',
    is_ayush_encounter: false,
    chief_complaint_summary: 'Substernal chest pressure radiating to left shoulder for 2 hours, diaphoresis',
    intake_started_at: new Date(Date.now() - 1800000).toISOString(),
    intake_completed_at: new Date(Date.now() - 600000).toISOString(),
    consultation_completed_at: null,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'enc-002',
    patient_id: 'pat-002',
    kiosk_id: 'kiosk-02',
    department_id: 'dept-general',
    attending_doctor_id: 'usr-doc-01',
    triage_nurse_id: 'usr-tri-01',
    status: 'ready_for_doctor',
    priority: 'YELLOW',
    is_ayush_encounter: false,
    chief_complaint_summary: 'Uncontrolled blood sugars, persistent fatigue, burning sensation in feet for 3 weeks',
    intake_started_at: new Date(Date.now() - 3600000).toISOString(),
    intake_completed_at: new Date(Date.now() - 2400000).toISOString(),
    consultation_completed_at: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'enc-003',
    patient_id: 'pat-003',
    kiosk_id: 'kiosk-03',
    department_id: 'dept-ayush',
    attending_doctor_id: 'usr-doc-02',
    triage_nurse_id: null,
    status: 'ready_for_doctor',
    priority: 'GREEN',
    is_ayush_encounter: true,
    chief_complaint_summary: 'Bilateral knee pain, early morning stiffness, aggravated in cold weather (Sandhigata Vata)',
    intake_started_at: new Date(Date.now() - 7200000).toISOString(),
    intake_completed_at: new Date(Date.now() - 5400000).toISOString(),
    consultation_completed_at: null,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const initialTriageAlerts: TriageAlert[] = [
  {
    id: 'tri-001',
    encounter_id: 'enc-001',
    patient_id: 'pat-001',
    severity: 'RED',
    trigger_symptom: 'Crushing chest pressure radiating to left arm + profuse sweating',
    clinical_rationale: 'Suspected Acute Coronary Syndrome (ACS). Immediate ECG and physician evaluation required.',
    is_acknowledged: true,
    acknowledged_by: 'usr-tri-01',
    acknowledged_at: new Date(Date.now() - 900000).toISOString(),
    action_taken: 'ECG ordered, wheel-chaired to Emergency Resuscitation Bay 2',
    created_at: new Date(Date.now() - 1200000).toISOString(),
  }
];

const initialMedications: Medication[] = [
  {
    id: 'med-001',
    encounter_id: 'enc-001',
    patient_id: 'pat-001',
    name: 'Tab Telmisartan',
    dosage: '40 mg',
    frequency: 'Once Daily (Morning)',
    duration: 'Ongoing (2 years)',
    route: 'Oral',
    source: 'patient_stated',
    source_document_id: null,
    verification_state: 'needs_review',
    doctor_notes: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'med-002',
    encounter_id: 'enc-001',
    patient_id: 'pat-001',
    name: 'Tab Atorvastatin',
    dosage: '20 mg',
    frequency: 'Once Daily (Night)',
    duration: 'Ongoing (1 year)',
    route: 'Oral',
    source: 'document_ocr',
    source_document_id: 'doc-001',
    verification_state: 'needs_review',
    doctor_notes: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'med-003',
    encounter_id: 'enc-002',
    patient_id: 'pat-002',
    name: 'Tab Metformin',
    dosage: '500 mg',
    frequency: 'Twice Daily (After meals)',
    duration: '3 years',
    route: 'Oral',
    source: 'document_ocr',
    source_document_id: 'doc-002',
    verification_state: 'needs_review',
    doctor_notes: null,
    created_at: new Date().toISOString(),
  }
];

const initialAllergies: Allergy[] = [
  {
    id: 'alg-001',
    encounter_id: 'enc-001',
    patient_id: 'pat-001',
    allergen: 'Penicillin (Amoxicillin)',
    category: 'drug',
    reaction: 'Urticaria and facial angioedema',
    severity: 'severe',
    source: 'patient_stated',
    verification_state: 'needs_review',
    created_at: new Date().toISOString(),
  },
  {
    id: 'alg-002',
    encounter_id: 'enc-002',
    patient_id: 'pat-002',
    allergen: 'Sulfa Drugs (Cotrimoxazole)',
    category: 'drug',
    reaction: 'Maculopapular rash',
    severity: 'moderate',
    source: 'patient_stated',
    verification_state: 'needs_review',
    created_at: new Date().toISOString(),
  }
];

const initialTimelineEvents: TimelineEvent[] = [
  {
    id: 'tl-001',
    encounter_id: 'enc-001',
    patient_id: 'pat-001',
    event_date: '2022-04-10',
    title: 'Hypertension Diagnosed',
    description: 'Diagnosed at Max Super Speciality Hospital. Started on Tab Telmisartan 40mg.',
    event_type: 'diagnosis',
    source: 'patient_stated',
    source_document_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'tl-002',
    encounter_id: 'enc-001',
    patient_id: 'pat-001',
    event_date: '2025-06-15',
    title: 'Lipid Profile Investigation',
    description: 'Total Cholesterol: 242 mg/dL, LDL: 168 mg/dL (Elevated). Started on Atorvastatin.',
    event_type: 'lab_test',
    source: 'document_ocr',
    source_document_id: 'doc-001',
    created_at: new Date().toISOString(),
  },
  {
    id: 'tl-003',
    encounter_id: 'enc-001',
    patient_id: 'pat-001',
    event_date: new Date().toISOString().split('T')[0],
    title: 'Emergency Intake — Chest Pressure',
    description: 'Presented to MediKiosk with acute substernal chest discomfort radiating to left arm. Triggered RED priority alert.',
    event_type: 'intake_visit',
    source: 'patient_stated',
    source_document_id: null,
    created_at: new Date().toISOString(),
  }
];

const initialAISummaries: AISummary[] = [
  {
    id: 'sum-001',
    encounter_id: 'enc-001',
    patient_id: 'pat-001',
    chief_complaint: 'Substernal chest pressure radiating to left shoulder and arm for 2 hours with diaphoresis',
    hpi: '48-year-old male with known history of hypertension (2 years) presenting with acute onset of severe retrosternal squeezing chest pain (severity 8/10) that began 2 hours ago while at rest. Describes radiation to left shoulder and jaw. Associated with profuse sweating and mild shortness of breath. No relief with rest. No prior history of myocardial infarction.',
    pmh_psh: 'Essential Hypertension (diagnosed 2022), Dyslipidemia (2025). No prior surgeries.',
    medications_summary: 'Tab Telmisartan 40mg OD, Tab Atorvastatin 20mg OD.',
    allergies_summary: 'CRITICAL: Severe Penicillin Allergy (Urticaria/Angioedema)',
    investigations_summary: 'Prior Lipid Profile (June 2025): Total Cholesterol 242 mg/dL, LDL 168 mg/dL. Current visit STAT ECG pending.',
    ayush_summary: null,
    red_flags_highlighted: [
      'Acute retrosternal chest pain > 30 mins radiating to left arm/jaw',
      'Associated diaphoresis and dyspnea',
      'High cardiovascular risk profile (Male, 48y, HTN, Dyslipidemia)'
    ],
    summary_markdown: `### **AI-generated draft — physician verification required.**\n\n**Patient:** Aarav Sharma | 48Y / Male | ABHA: 91-4829-1029-4821\n**Triage Priority:** **RED (Immediate Assessment)**\n\n#### 1. Chief Complaint & HPI\n- **Chief Complaint:** Squeezing chest pressure for 2 hours.\n- **HPI:** Acute retrosternal pain (8/10) radiating to left arm and jaw with cold sweating. Onset at rest.\n\n#### 2. Pertinent History & Medications\n- **PMH:** Hypertension (2 yrs), Hyperlipidemia (1 yr).\n- **Current Meds:** Telmisartan 40mg OD, Atorvastatin 20mg OD.\n- **Allergies:** **PENICILLIN (Severe Urticaria / Angioedema)**.\n\n#### 3. Red Flags & Triage Alerts\n- High suspicion of Acute Coronary Syndrome (ACS / STEMI / NSTEMI).\n- Immediate 12-lead ECG and Troponin I/T recommended.`,
    is_verified: false,
    verified_by: null,
    verified_at: null,
    doctor_edited_summary: null,
    created_at: new Date(Date.now() - 600000).toISOString(),
  }
];

const initialAISuggestions: AISuggestion[] = [
  {
    id: 'sug-001',
    encounter_id: 'enc-001',
    suggestion_type: 'investigation',
    title: 'STAT 12-Lead ECG & Serum Troponin I / T',
    details: 'Evaluate for ST-segment elevation or acute ischemic changes given 8/10 chest pain with left arm radiation.',
    status: 'pending',
    doctor_feedback: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sug-002',
    encounter_id: 'enc-001',
    suggestion_type: 'follow_up_question',
    title: 'Inquire about recent NSAID or Sildenafil intake',
    details: 'Verify prior to administering sublingual nitrates if indicated.',
    status: 'pending',
    doctor_feedback: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sug-003',
    encounter_id: 'enc-001',
    suggestion_type: 'differential_consideration',
    title: 'Differential: Acute Coronary Syndrome vs Aortic Dissection vs GERD spasm',
    details: 'Check bilateral brachial blood pressure symmetry to rule out dissection before antiplatelet/anticoagulation load.',
    status: 'pending',
    doctor_feedback: null,
    created_at: new Date().toISOString(),
  }
];

const initialAyushAssessments: AyushAssessment[] = [
  {
    id: 'ayu-001',
    encounter_id: 'enc-003',
    patient_id: 'pat-003',
    prakriti_primary: 'Vata-Kapha',
    prakriti_secondary: 'Pitta',
    vikriti_dosha: 'Vata Vriddhi (Vata-Kapha Anubandha)',
    agni_type: 'Manda',
    koshtha_type: 'Krura',
    dhatu_affected: ['Asthi', 'Majja', 'Mamsa'],
    sattva_shakti: 'Madhyama',
    ahara_vihara_notes: 'Excessive consumption of dry/cold foods (Ruksha-Sheeta Ahara), irregular sleep schedule, sedentary job.',
    created_at: new Date(Date.now() - 5400000).toISOString(),
  }
];

const initialAuditLogs: AuditLog[] = [
  {
    id: 'aud-001',
    encounter_id: 'enc-001',
    patient_id: 'pat-001',
    actor_id: 'pat-001',
    actor_role: 'patient',
    action: 'PATIENT_INTAKE_COMPLETED',
    details: { kioskId: 'kiosk-01', language: 'hi', questionsAnswered: 8, redFlagTriggered: true },
    ip_address: '192.168.1.101',
    timestamp: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 'aud-002',
    encounter_id: 'enc-001',
    patient_id: 'pat-001',
    actor_id: 'usr-tri-01',
    actor_role: 'triage',
    action: 'TRIAGE_ALERT_ACKNOWLEDGED',
    details: { alertId: 'tri-001', severity: 'RED', actionTaken: 'Escalated to ER Bay 2' },
    ip_address: '192.168.1.50',
    timestamp: new Date(Date.now() - 540000).toISOString(),
  }
];

class MockDatabase {
  private state: MockDatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = {
      patients: initialPatients,
      encounters: initialEncounters,
      consents: [],
      interviewAnswers: [],
      documents: [],
      documentExtractions: [],
      medications: initialMedications,
      allergies: initialAllergies,
      investigations: [],
      timelineEvents: initialTimelineEvents,
      triageAlerts: initialTriageAlerts,
      aiSummaries: initialAISummaries,
      aiSuggestions: initialAISuggestions,
      ayushAssessments: initialAyushAssessments,
      auditLogs: initialAuditLogs,
      systemSettings: {
        enable_ayush_mode: true,
        enable_ai_suggestions_by_default: false,
        kiosk_auto_expire_minutes: 15,
        default_language: 'hi',
      },
    };
  }

  public getState(): MockDatabaseState {
    return this.state;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error notifying mock DB listener:', err);
      }
    });
  }

  // --- Patients & Encounters ---
  public getPatients(): Patient[] {
    return this.state.patients;
  }

  public getPatientById(id: string): Patient | undefined {
    return this.state.patients.find((p) => p.id === id || p.demo_id === id);
  }

  public getEncounters(): Encounter[] {
    return this.state.encounters;
  }

  public getEncounterById(id: string): Encounter | undefined {
    return this.state.encounters.find((e) => e.id === id);
  }

  public addPatient(patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Patient {
    const newPatient: Patient = {
      ...patientData,
      id: `pat-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.state.patients = [newPatient, ...this.state.patients];
    this.logAudit({
      encounter_id: null,
      patient_id: newPatient.id,
      actor_id: newPatient.id,
      actor_role: 'patient',
      action: 'PATIENT_REGISTERED',
      details: { demoId: newPatient.demo_id, language: newPatient.preferred_language },
    });
    this.notify();
    return newPatient;
  }

  public addEncounter(encounterData: Omit<Encounter, 'id' | 'created_at' | 'updated_at'>): Encounter {
    const newEncounter: Encounter = {
      ...encounterData,
      id: `enc-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.state.encounters = [newEncounter, ...this.state.encounters];
    this.notify();
    return newEncounter;
  }

  public updateEncounter(id: string, updates: Partial<Encounter>): Encounter | undefined {
    const index = this.state.encounters.findIndex((e) => e.id === id);
    if (index === -1) return undefined;

    const updated = {
      ...this.state.encounters[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.state.encounters[index] = updated;
    this.notify();
    return updated;
  }

  // --- Triage Alerts ---
  public getTriageAlerts(): TriageAlert[] {
    return this.state.triageAlerts;
  }

  public addTriageAlert(alertData: Omit<TriageAlert, 'id' | 'created_at'>): TriageAlert {
    const newAlert: TriageAlert = {
      ...alertData,
      id: `tri-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.state.triageAlerts = [newAlert, ...this.state.triageAlerts];
    this.logAudit({
      encounter_id: alertData.encounter_id,
      patient_id: alertData.patient_id,
      actor_id: 'system',
      actor_role: 'system',
      action: 'TRIAGE_RED_FLAG_TRIGGERED',
      details: { severity: alertData.severity, symptom: alertData.trigger_symptom },
    });
    this.notify();
    return newAlert;
  }

  public acknowledgeTriageAlert(alertId: string, actorId: string, actionTaken: string): boolean {
    const alert = this.state.triageAlerts.find((a) => a.id === alertId);
    if (!alert) return false;

    alert.is_acknowledged = true;
    alert.acknowledged_by = actorId;
    alert.acknowledged_at = new Date().toISOString();
    alert.action_taken = actionTaken;

    this.logAudit({
      encounter_id: alert.encounter_id,
      patient_id: alert.patient_id,
      actor_id: actorId,
      actor_role: 'triage',
      action: 'TRIAGE_ALERT_ACKNOWLEDGED',
      details: { alertId, actionTaken },
    });
    this.notify();
    return true;
  }

  // --- AI Summaries & Doctor Signoff ---
  public getAISummaryByEncounter(encounterId: string): AISummary | undefined {
    return this.state.aiSummaries.find((s) => s.encounter_id === encounterId);
  }

  public saveAISummary(summaryData: Omit<AISummary, 'id' | 'created_at'>): AISummary {
    const newSummary: AISummary = {
      ...summaryData,
      id: `sum-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.state.aiSummaries = [newSummary, ...this.state.aiSummaries];
    this.notify();
    return newSummary;
  }

  public updateDoctorSummary(
    summaryId: string,
    doctorId: string,
    editedMarkdown: string,
    isVerified: boolean
  ): AISummary | undefined {
    const summary = this.state.aiSummaries.find((s) => s.id === summaryId);
    if (!summary) return undefined;

    summary.doctor_edited_summary = editedMarkdown;
    summary.is_verified = isVerified;
    summary.verified_by = doctorId;
    summary.verified_at = isVerified ? new Date().toISOString() : null;

    this.logAudit({
      encounter_id: summary.encounter_id,
      patient_id: summary.patient_id,
      actor_id: doctorId,
      actor_role: 'doctor',
      action: isVerified ? 'DOCTOR_SUMMARY_VERIFIED' : 'DOCTOR_SUMMARY_EDITED',
      details: { summaryId, isVerified },
    });
    this.notify();
    return summary;
  }

  // --- AI Suggestions ---
  public getSuggestionsByEncounter(encounterId: string): AISuggestion[] {
    return this.state.aiSuggestions.filter((s) => s.encounter_id === encounterId);
  }

  public updateSuggestionStatus(
    suggestionId: string,
    status: 'accepted' | 'rejected' | 'modified',
    doctorId: string,
    feedback?: string
  ): boolean {
    const suggestion = this.state.aiSuggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return false;

    suggestion.status = status;
    suggestion.doctor_feedback = feedback || null;

    this.logAudit({
      encounter_id: suggestion.encounter_id,
      patient_id: null,
      actor_id: doctorId,
      actor_role: 'doctor',
      action: `AI_SUGGESTION_${status.toUpperCase()}`,
      details: { suggestionId, title: suggestion.title },
    });
    this.notify();
    return true;
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return this.state.auditLogs;
  }

  public logAudit(logData: {
    encounter_id: string | null;
    patient_id: string | null;
    actor_id: string | null;
    actor_role: UserRole | 'system';
    action: string;
    details: any;
  }): void {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      encounter_id: logData.encounter_id,
      patient_id: logData.patient_id,
      actor_id: logData.actor_id,
      actor_role: logData.actor_role,
      action: logData.action,
      details: logData.details,
      ip_address: '127.0.0.1',
      timestamp: new Date().toISOString(),
    };
    this.state.auditLogs = [newLog, ...this.state.auditLogs];
  }
}

// Global Singleton Instance
export const mockDB = new MockDatabase();
