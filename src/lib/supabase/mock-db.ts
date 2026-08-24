import { 
  Patient, 
  Encounter, 
  Consent, 
  Document, 
  Medication, 
  Allergy, 
  Investigation, 
  TimelineEvent, 
  TriageAlert, 
  AISummary, 
  AISuggestion, 
  AyushAssessment, 
  AuditLog, 
  UserProfile 
} from '@/types/clinical';
import { UserRole } from '@/types/database';

export interface DoctorStaff {
  id: string;
  name: string;
  specialty: string;
  department: string;
  experienceYears: number;
  available: boolean;
  avatarInitials: string;
}

export const AVAILABLE_DOCTORS: DoctorStaff[] = [
  {
    id: 'usr-doc-01',
    name: 'Dr. Arvind Sen, MD DM',
    specialty: 'Cardiology',
    department: 'Cardiology & Internal Medicine',
    experienceYears: 16,
    available: true,
    avatarInitials: 'AS',
  },
  {
    id: 'usr-doc-02',
    name: 'Dr. Sunita Mehra, MD',
    specialty: 'General Medicine',
    department: 'General Medicine & Diabetology',
    experienceYears: 12,
    available: true,
    avatarInitials: 'SM',
  },
  {
    id: 'usr-doc-03',
    name: 'Dr. Rajesh Sharma, BAMS MD',
    specialty: 'Ayurveda & AYUSH',
    department: 'Ayurveda & Panchakarma',
    experienceYears: 14,
    available: true,
    avatarInitials: 'RS',
  },
  {
    id: 'usr-doc-04',
    name: 'Dr. Priya Nair, MD (Derm)',
    specialty: 'Dermatology',
    department: 'Dermatology & Skin Care',
    experienceYears: 9,
    available: true,
    avatarInitials: 'PN',
  },
];

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    role: 'patient',
    full_name: 'Aarav Sharma',
    email: 'aarav.sharma@example.in',
    phone: '+91 98765 43210',
    department_id: null,
    license_number: null,
    is_active: true,
  },
  {
    id: 'usr-doc-01',
    role: 'doctor',
    full_name: 'Dr. Arvind Sen, MD DM',
    email: 'arvind.sen@hospital.in',
    phone: '+91 98111 22334',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    specialty: 'Cardiology',
    license_number: 'MCI-DEL-2012-9842',
    is_active: true,
  },
  {
    id: 'usr-adm-01',
    role: 'admin',
    full_name: 'Vikram Joshi',
    email: 'admin.vikram@hospital.in',
    phone: '+91 98999 88776',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    license_number: null,
    is_active: true,
  },
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
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
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
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
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
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
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

export const INITIAL_ENCOUNTERS: Encounter[] = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    patient_id: 'a1111111-1111-1111-1111-111111111111',
    kiosk_id: '11111111-1111-1111-1111-111111111111',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    recommended_specialty: 'Cardiology',
    assigned_doctor_id: 'usr-doc-01',
    proposed_appointment_time: 'Today, 03:30 PM',
    confirmed_appointment_time: 'Today, 03:30 PM',
    appointment_mode: 'in_person',
    appointment_location: 'Cardiology OPD Suite 204',
    doctor_proposed_notes: 'Urgent cardiac evaluation required due to substernal pressure and diaphoresis.',
    admin_confirmation_notes: 'Priority confirmed by Admin. Patient alerted.',
    status: 'appointment_confirmed',
    priority: 'EMERGENCY',
    is_emergency: true,
    emergency_rationale: 'Acute substernal chest pressure (8/10) radiating to left arm + profuse diaphoresis.',
    is_ayush_encounter: false,
    chief_complaint_summary: 'Substernal chest pressure radiating to left arm with diaphoresis (Severity: 8/10)',
    intake_started_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    intake_completed_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    consultation_completed_at: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'e2222222-2222-2222-2222-222222222222',
    patient_id: 'a2222222-2222-2222-2222-222222222222',
    kiosk_id: '22222222-2222-2222-2222-222222222222',
    department_id: 'd2222222-2222-2222-2222-222222222222',
    recommended_specialty: 'General Medicine',
    assigned_doctor_id: null,
    proposed_appointment_time: null,
    confirmed_appointment_time: null,
    appointment_mode: null,
    appointment_location: null,
    doctor_proposed_notes: null,
    admin_confirmation_notes: null,
    status: 'submitted_waiting_assignment',
    priority: 'AMBER',
    is_emergency: false,
    emergency_rationale: null,
    is_ayush_encounter: false,
    chief_complaint_summary: 'Uncontrolled blood sugars, persistent fatigue, and burning feet sensation for 3 weeks',
    intake_started_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    intake_completed_at: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    consultation_completed_at: null,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'e3333333-3333-3333-3333-333333333333',
    patient_id: 'a3333333-3333-3333-3333-333333333333',
    kiosk_id: '33333333-3333-3333-3333-333333333333',
    department_id: 'd3333333-3333-3333-3333-333333333333',
    recommended_specialty: 'Ayurveda & AYUSH',
    assigned_doctor_id: 'usr-doc-03',
    proposed_appointment_time: 'Tomorrow, 11:00 AM',
    confirmed_appointment_time: null,
    appointment_mode: 'in_person',
    appointment_location: 'AYUSH OPD Room 102',
    doctor_proposed_notes: 'Joint examination and Sandhigata Vata panchakarma assessment.',
    admin_confirmation_notes: null,
    status: 'appointment_proposed',
    priority: 'GREEN',
    is_emergency: false,
    emergency_rationale: null,
    is_ayush_encounter: true,
    chief_complaint_summary: 'Bilateral knee joint pain, stiffness, and difficulty walking (Sandhigata Vata)',
    intake_started_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    intake_completed_at: new Date(Date.now() - 3600000 * 5.5).toISOString(),
    consultation_completed_at: null,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

class MockDatabase {
  private users: UserProfile[] = [...MOCK_USERS];
  private patients: Patient[] = [...INITIAL_PATIENTS];
  private encounters: Encounter[] = [...INITIAL_ENCOUNTERS];
  private documents: Document[] = [];
  private medications: Medication[] = [
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      encounter_id: 'e1111111-1111-1111-1111-111111111111',
      patient_id: 'a1111111-1111-1111-1111-111111111111',
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
      id: 'c2222222-2222-2222-2222-222222222222',
      encounter_id: 'e1111111-1111-1111-1111-111111111111',
      patient_id: 'a1111111-1111-1111-1111-111111111111',
      name: 'Tab Atorvastatin',
      dosage: '20 mg',
      frequency: 'Once Daily (Night)',
      duration: 'Ongoing (1 year)',
      route: 'Oral',
      source: 'document_ocr',
      source_document_id: null,
      verification_state: 'needs_review',
      doctor_notes: null,
      created_at: new Date().toISOString(),
    },
  ];
  private allergies: Allergy[] = [
    {
      id: 'f1111111-1111-1111-1111-111111111111',
      encounter_id: 'e1111111-1111-1111-1111-111111111111',
      patient_id: 'a1111111-1111-1111-1111-111111111111',
      allergen: 'Penicillin (Amoxicillin)',
      category: 'drug',
      reaction: 'Urticaria and facial angioedema',
      severity: 'severe',
      source: 'patient_stated',
      verification_state: 'needs_review',
      created_at: new Date().toISOString(),
    },
  ];
  private investigations: Investigation[] = [
    {
      id: 'inv-001',
      encounter_id: 'e1111111-1111-1111-1111-111111111111',
      patient_id: 'a1111111-1111-1111-1111-111111111111',
      test_name: 'Serum Total Cholesterol',
      test_category: 'Biochemistry / Lipid Profile',
      numeric_result: 242,
      unit: 'mg/dL',
      reference_range: '< 200 mg/dL',
      text_result: null,
      is_abnormal: true,
      test_date: '2025-06-15',
      source_document_id: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 'inv-002',
      encounter_id: 'e1111111-1111-1111-1111-111111111111',
      patient_id: 'a1111111-1111-1111-1111-111111111111',
      test_name: 'Serum LDL Cholesterol',
      test_category: 'Biochemistry / Lipid Profile',
      numeric_result: 168,
      unit: 'mg/dL',
      reference_range: '< 100 mg/dL',
      text_result: null,
      is_abnormal: true,
      test_date: '2025-06-15',
      source_document_id: null,
      created_at: new Date().toISOString(),
    },
  ];
  private timelineEvents: TimelineEvent[] = [
    {
      id: 'e1111111-1111-1111-1111-111111111112',
      encounter_id: 'e1111111-1111-1111-1111-111111111111',
      patient_id: 'a1111111-1111-1111-1111-111111111111',
      event_date: '2022-04-10',
      title: 'Essential Hypertension Diagnosed',
      description: 'Diagnosed at Max Hospital. Commenced on Tab Telmisartan 40mg.',
      event_type: 'diagnosis',
      source: 'patient_stated',
      source_document_id: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 'e1111111-1111-1111-1111-111111111113',
      encounter_id: 'e1111111-1111-1111-1111-111111111111',
      patient_id: 'a1111111-1111-1111-1111-111111111111',
      event_date: '2025-06-15',
      title: 'Lipid Profile Investigation',
      description: 'Total Cholesterol 242 mg/dL, LDL 168 mg/dL. Commenced on Atorvastatin 20mg.',
      event_type: 'lab_test',
      source: 'document_ocr',
      source_document_id: null,
      created_at: new Date().toISOString(),
    },
  ];
  private triageAlerts: TriageAlert[] = [
    {
      id: 'b1111111-1111-1111-1111-111111111111',
      encounter_id: 'e1111111-1111-1111-1111-111111111111',
      patient_id: 'a1111111-1111-1111-1111-111111111111',
      severity: 'EMERGENCY',
      trigger_symptom: 'Crushing chest pressure radiating to left arm + diaphoresis',
      clinical_rationale: 'Suspected Acute Coronary Syndrome (ACS). Fast-track cardiologist review required.',
      is_acknowledged: true,
      acknowledged_by: 'usr-adm-01',
      acknowledged_at: new Date().toISOString(),
      action_taken: 'Assigned to Dr. Arvind Sen (Cardiology). Urgent 12-lead ECG ordered.',
      created_at: new Date().toISOString(),
    },
  ];
  private aiSummaries: AISummary[] = [
    {
      id: '01111111-1111-1111-1111-111111111111',
      encounter_id: 'e1111111-1111-1111-1111-111111111111',
      patient_id: 'a1111111-1111-1111-1111-111111111111',
      chief_complaint: 'CHEST PAIN (Severity: 8/10, Duration: 2 hours)',
      hpi: '48-year-old male with known hypertension presenting with acute onset of crushing retrosternal chest pain (8/10) that began 2 hours ago at rest. Radiating to left shoulder and jaw. Associated with cold diaphoresis and breathlessness.',
      pmh_psh: 'Chronic Conditions: Essential Hypertension (2022), Dyslipidemia (2025).',
      medications_summary: 'Tab Telmisartan 40mg OD [Patient Stated]; Tab Atorvastatin 20mg HS [Document OCR]',
      allergies_summary: 'CRITICAL: Severe Penicillin Allergy (Urticaria & Facial Angioedema)',
      investigations_summary: 'Prior Lipid Profile (June 2025): Total Cholesterol 242 mg/dL, LDL 168 mg/dL. STAT 12-lead ECG & Troponin I pending.',
      recommended_specialty: 'Cardiology',
      ayush_summary: null,
      red_flags_highlighted: [
        'Acute crushing retrosternal pain > 30 mins',
        'Radiation to left arm and jaw',
        'Diaphoresis and dyspnea',
      ],
      summary_markdown: `### **AI-generated draft — physician verification required.**

**Patient:** Aarav Sharma | **Age/Sex:** 48Y / MALE | **ABHA:** 91-4829-1029-4821  
**Triage Acuity:** **EMERGENCY (URGENT CARDIOLOGY FAST-TRACK)**  
**Recommended Specialty:** **Cardiology**

---

#### 1. Chief Complaint & History of Present Illness (HPI)
- **Chief Complaint:** Acute crushing retrosternal chest pressure (8/10 severity, 2 hours duration).
- **HPI Narrative:** 48-year-old male with known hypertension presenting with sudden onset of severe retrosternal pressure radiating to left arm and jaw with profuse sweating.
- **Pain Score:** 8/10 | **Onset:** < 2 hours | **Radiation:** Left arm, jaw

#### 2. Past Medical History & Medications
- **PMH:** Essential Hypertension (2 years), Hypercholesterolemia (1 year).
- **Current Meds:** Tab Telmisartan 40mg OD, Tab Atorvastatin 20mg HS.
- **Allergies:** **PENICILLIN (Severe Urticaria & Angioedema)**.

#### 3. Recommended Specialty & Safety Sentinel
- **Recommended Specialty:** **Cardiology** (Immediate ECG & Troponin evaluation).
- **Red-Flag Rationale:** Suspected Acute Coronary Syndrome (ACS).`,
      is_verified: false,
      verified_by: null,
      verified_at: null,
      doctor_edited_summary: null,
      created_at: new Date().toISOString(),
    },
  ];
  private aiSuggestions: AISuggestion[] = [
    {
      id: 'sug-001',
      encounter_id: 'e1111111-1111-1111-1111-111111111111',
      suggestion_type: 'investigation',
      title: 'STAT 12-Lead Electrocardiogram (ECG) & Serum Troponin I / T',
      details: 'Given acute retrosternal pressure radiating to left arm with diaphoresis, immediate 12-lead ECG is indicated to evaluate for ST-elevation myocardial infarction (STEMI) or non-STEMI.',
      status: 'pending',
      doctor_feedback: null,
      created_at: new Date().toISOString(),
    },
  ];
  private ayushAssessments: AyushAssessment[] = [
    {
      id: '02222222-2222-2222-2222-222222222222',
      encounter_id: 'e3333333-3333-3333-3333-333333333333',
      patient_id: 'a3333333-3333-3333-3333-333333333333',
      prakriti_primary: 'Vata-Kapha',
      prakriti_secondary: 'Pitta',
      vikriti_dosha: 'Vata Vriddhi (Sandhigata Vata)',
      agni_type: 'Manda',
      koshtha_type: 'Krura',
      dhatu_affected: ['Asthi', 'Majja', 'Mamsa'],
      sattva_shakti: 'Madhyama',
      ahara_vihara_notes: 'Excessive cold/dry food intake, irregular sleep schedule',
      created_at: new Date().toISOString(),
    },
  ];
  private auditLogs: AuditLog[] = [
    {
      id: 'log-001',
      encounter_id: 'e1111111-1111-1111-1111-111111111111',
      patient_id: 'a1111111-1111-1111-1111-111111111111',
      actor_id: 'a1111111-1111-1111-1111-111111111111',
      actor_role: 'patient',
      action: 'PATIENT_INTAKE_SUBMITTED',
      details: { complaint: 'Chest pain', recommended_specialty: 'Cardiology', is_emergency: true },
      ip_address: '127.0.0.1',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'log-002',
      encounter_id: 'e1111111-1111-1111-1111-111111111111',
      patient_id: 'a1111111-1111-1111-1111-111111111111',
      actor_id: 'usr-adm-01',
      actor_role: 'admin',
      action: 'DOCTOR_ASSIGNED',
      details: { doctor_id: 'usr-doc-01', doctor_name: 'Dr. Arvind Sen', specialty: 'Cardiology' },
      ip_address: '127.0.0.1',
      timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
    },
  ];

  private subscribers: Array<() => void> = [];

  public subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  private notify() {
    this.subscribers.forEach((s) => s());
  }

  // --- QUERY METHODS ---
  public getPatients() {
    return [...this.patients];
  }

  public getPatientById(id: string) {
    return this.patients.find((p) => p.id === id || p.demo_id === id);
  }

  public getEncounters() {
    // Priority Sorting: Emergencies always jump to top, then chronological
    return [...this.encounters].sort((a, b) => {
      if (a.is_emergency && !b.is_emergency) return -1;
      if (!a.is_emergency && b.is_emergency) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  public getEncounterById(id: string) {
    return this.encounters.find((e) => e.id === id);
  }

  public getEncountersByDoctor(doctorId: string) {
    return this.encounters.filter((e) => e.assigned_doctor_id === doctorId);
  }

  public getAvailableDoctors(specialty?: string) {
    if (!specialty) return AVAILABLE_DOCTORS;
    return AVAILABLE_DOCTORS.filter((d) => 
      d.specialty.toLowerCase().includes(specialty.toLowerCase()) ||
      specialty.toLowerCase().includes(d.specialty.toLowerCase())
    );
  }

  public getTriageAlerts() {
    return [...this.triageAlerts];
  }

  public getAISummaryByEncounter(encounterId: string) {
    return this.aiSummaries.find((s) => s.encounter_id === encounterId);
  }

  public getSuggestionsByEncounter(encounterId: string) {
    return this.aiSuggestions.filter((s) => s.encounter_id === encounterId);
  }

  public getAuditLogs() {
    return [...this.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // --- MUTATION METHODS ---
  public createPatient(patientData: Omit<Patient, 'id' | 'created_at'>): Patient {
    const newPatient: Patient = {
      ...patientData,
      id: `a${Date.now()}`.padEnd(36, '0'),
      created_at: new Date().toISOString(),
    };
    this.patients.push(newPatient);
    this.notify();
    return newPatient;
  }

  public createEncounter(encounterData: Partial<Encounter>): Encounter {
    const newEncounter: Encounter = {
      id: `e${Date.now()}`.padEnd(36, '0'),
      patient_id: encounterData.patient_id || this.patients[0].id,
      kiosk_id: encounterData.kiosk_id || '11111111-1111-1111-1111-111111111111',
      department_id: encounterData.department_id || 'd1111111-1111-1111-1111-111111111111',
      recommended_specialty: encounterData.recommended_specialty || 'General Medicine',
      assigned_doctor_id: encounterData.assigned_doctor_id || null,
      proposed_appointment_time: encounterData.proposed_appointment_time || null,
      confirmed_appointment_time: encounterData.confirmed_appointment_time || null,
      appointment_mode: encounterData.appointment_mode || null,
      appointment_location: encounterData.appointment_location || null,
      doctor_proposed_notes: encounterData.doctor_proposed_notes || null,
      admin_confirmation_notes: encounterData.admin_confirmation_notes || null,
      status: encounterData.status || 'submitted_waiting_assignment',
      priority: encounterData.priority || 'GREEN',
      is_emergency: encounterData.is_emergency || false,
      emergency_rationale: encounterData.emergency_rationale || null,
      is_ayush_encounter: encounterData.is_ayush_encounter || false,
      chief_complaint_summary: encounterData.chief_complaint_summary || 'Patient intake completed.',
      intake_started_at: encounterData.intake_started_at || new Date().toISOString(),
      intake_completed_at: new Date().toISOString(),
      consultation_completed_at: null,
      created_at: new Date().toISOString(),
    };

    this.encounters.push(newEncounter);

    this.logAudit({
      encounter_id: newEncounter.id,
      patient_id: newEncounter.patient_id,
      actor_id: newEncounter.patient_id,
      actor_role: 'patient',
      action: 'PATIENT_INTAKE_SUBMITTED',
      details: { 
        recommended_specialty: newEncounter.recommended_specialty, 
        is_emergency: newEncounter.is_emergency,
        priority: newEncounter.priority 
      },
    });

    this.notify();
    return newEncounter;
  }

  public updateEncounter(encounterId: string, updates: Partial<Encounter>): Encounter | null {
    const idx = this.encounters.findIndex((e) => e.id === encounterId);
    if (idx === -1) return null;
    this.encounters[idx] = { ...this.encounters[idx], ...updates };
    this.notify();
    return this.encounters[idx];
  }

  // --- STEP 2: ADMIN ASSIGNS DOCTOR ---
  public assignDoctor(encounterId: string, doctorId: string, adminId: string, notes?: string): Encounter | null {
    const enc = this.getEncounterById(encounterId);
    if (!enc) return null;
    const doctor = AVAILABLE_DOCTORS.find((d) => d.id === doctorId);

    const updated = this.updateEncounter(encounterId, {
      assigned_doctor_id: doctorId,
      status: 'doctor_assigned',
    });

    this.logAudit({
      encounter_id: encounterId,
      patient_id: enc.patient_id,
      actor_id: adminId,
      actor_role: 'admin',
      action: 'DOCTOR_ASSIGNED_BY_ADMIN',
      details: { doctor_id: doctorId, doctor_name: doctor?.name, specialty: doctor?.specialty, notes },
    });

    return updated;
  }

  // --- STEP 3: DOCTOR PROPOSES APPOINTMENT ---
  public proposeAppointment(
    encounterId: string, 
    proposedTime: string, 
    mode: 'in_person' | 'video_consult', 
    notes: string, 
    doctorId: string
  ): Encounter | null {
    const enc = this.getEncounterById(encounterId);
    if (!enc) return null;

    const updated = this.updateEncounter(encounterId, {
      proposed_appointment_time: proposedTime,
      appointment_mode: mode,
      doctor_proposed_notes: notes,
      status: 'appointment_proposed',
    });

    this.logAudit({
      encounter_id: encounterId,
      patient_id: enc.patient_id,
      actor_id: doctorId,
      actor_role: 'doctor',
      action: 'APPOINTMENT_PROPOSED_BY_DOCTOR',
      details: { proposed_time: proposedTime, mode, notes },
    });

    return updated;
  }

  // --- STEP 4: ADMIN CONFIRMS APPOINTMENT TO PATIENT ---
  public confirmAppointment(
    encounterId: string, 
    confirmedTime: string, 
    adminId: string, 
    location?: string, 
    notes?: string
  ): Encounter | null {
    const enc = this.getEncounterById(encounterId);
    if (!enc) return null;

    const updated = this.updateEncounter(encounterId, {
      confirmed_appointment_time: confirmedTime,
      appointment_location: location || 'Main Hospital Consultation Suite',
      admin_confirmation_notes: notes || 'Confirmed by Hospital Admin.',
      status: 'appointment_confirmed',
    });

    this.logAudit({
      encounter_id: encounterId,
      patient_id: enc.patient_id,
      actor_id: adminId,
      actor_role: 'admin',
      action: 'APPOINTMENT_CONFIRMED_BY_ADMIN',
      details: { confirmed_time: confirmedTime, location, notes },
    });

    return updated;
  }

  public saveAISummary(summary: Omit<AISummary, 'id' | 'created_at'>): AISummary {
    const newSummary: AISummary = {
      ...summary,
      id: `0${Date.now()}`.padEnd(36, '0'),
      created_at: new Date().toISOString(),
    };
    this.aiSummaries.push(newSummary);
    this.notify();
    return newSummary;
  }

  public updateDoctorSummary(summaryId: string, doctorId: string, editedText: string, isVerified: boolean): AISummary | null {
    const idx = this.aiSummaries.findIndex((s) => s.id === summaryId);
    if (idx === -1) return null;

    this.aiSummaries[idx] = {
      ...this.aiSummaries[idx],
      doctor_edited_summary: editedText,
      is_verified: isVerified,
      verified_by: doctorId,
      verified_at: isVerified ? new Date().toISOString() : null,
    };

    this.logAudit({
      encounter_id: this.aiSummaries[idx].encounter_id,
      patient_id: this.aiSummaries[idx].patient_id,
      actor_id: doctorId,
      actor_role: 'doctor',
      action: isVerified ? 'PHYSICIAN_SUMMARY_VERIFIED' : 'PHYSICIAN_SUMMARY_EDITED',
      details: { summary_id: summaryId, is_verified: isVerified },
    });

    this.notify();
    return this.aiSummaries[idx];
  }

  public addDocument(doc: Omit<Document, 'id' | 'created_at'>): Document {
    const newDoc: Document = {
      ...doc,
      id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    this.documents.push(newDoc);
    this.notify();
    return newDoc;
  }

  public getDocumentsByEncounter(encounterId: string): Document[] {
    return this.documents.filter((d) => d.encounter_id === encounterId);
  }

  public getDocumentsByPatient(patientId: string): Document[] {
    return this.documents.filter((d) => d.patient_id === patientId);
  }

  public addMedication(med: Omit<Medication, 'id' | 'created_at'>): Medication {
    const newMed: Medication = {
      ...med,
      id: `med-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    this.medications.push(newMed);
    this.notify();
    return newMed;
  }

  public addAllergy(allergy: Omit<Allergy, 'id' | 'created_at'>): Allergy {
    const newAllergy: Allergy = {
      ...allergy,
      id: `alg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    this.allergies.push(newAllergy);
    this.notify();
    return newAllergy;
  }

  public addInvestigation(inv: Omit<Investigation, 'id' | 'created_at'>): Investigation {
    const newInv: Investigation = {
      ...inv,
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    this.investigations.push(newInv);
    this.notify();
    return newInv;
  }

  public addAyushAssessment(ayush: Omit<AyushAssessment, 'id' | 'created_at'>): AyushAssessment {
    const newAyush: AyushAssessment = {
      ...ayush,
      id: `ayush-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    this.ayushAssessments.push(newAyush);
    this.notify();
    return newAyush;
  }

  public addTriageAlert(alert: Omit<TriageAlert, 'id' | 'created_at'>): TriageAlert {
    const newAlert: TriageAlert = {
      ...alert,
      id: `b${Date.now()}`.padEnd(36, '0'),
      created_at: new Date().toISOString(),
    };
    this.triageAlerts.push(newAlert);
    this.notify();
    return newAlert;
  }

  public logAudit(log: Omit<AuditLog, 'id' | 'timestamp' | 'ip_address'> & { ip_address?: string }) {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      encounter_id: log.encounter_id || null,
      patient_id: log.patient_id || null,
      actor_id: log.actor_id || null,
      actor_role: log.actor_role,
      action: log.action,
      details: log.details || {},
      ip_address: log.ip_address || '127.0.0.1',
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
    this.notify();
  }

  public getState() {
    return {
      users: this.users,
      patients: this.patients,
      encounters: this.encounters,
      documents: this.documents,
      medications: this.medications,
      allergies: this.allergies,
      investigations: this.investigations,
      timelineEvents: this.timelineEvents,
      triageAlerts: this.triageAlerts,
      aiSummaries: this.aiSummaries,
      aiSuggestions: this.aiSuggestions,
      ayushAssessments: this.ayushAssessments,
      auditLogs: this.auditLogs,
    };
  }
}

export const mockDB = new MockDatabase();
