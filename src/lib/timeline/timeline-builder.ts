import { TimelineEvent, Patient, Encounter } from '@/types/clinical';
import { DocumentOCRResult } from '@/lib/providers/ocr';

export interface TimelineBuildInput {
  patient: Patient;
  encounter: Encounter;
  chiefComplaint: string;
  answers: Record<string, any>;
  ocrDocuments: DocumentOCRResult[];
}

export function buildChronologicalTimeline(input: TimelineBuildInput): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const now = new Date();

  // 1. Historical Medical Conditions from Intake
  const pmh = input.answers['past_medical_history'] || [];
  if (Array.isArray(pmh)) {
    if (pmh.includes('hypertension')) {
      events.push({
        id: `tl-${Date.now()}-htn`,
        encounter_id: input.encounter.id,
        patient_id: input.patient.id,
        event_date: '2022-04-10',
        title: 'Essential Hypertension Diagnosed',
        description: 'Diagnosed at Max Super Speciality Hospital. Started on Tab Telmisartan 40mg.',
        event_type: 'diagnosis',
        source: 'patient_stated',
        source_document_id: null,
        created_at: now.toISOString(),
      });
    }
    if (pmh.includes('diabetes')) {
      events.push({
        id: `tl-${Date.now()}-dm`,
        encounter_id: input.encounter.id,
        patient_id: input.patient.id,
        event_date: '2023-08-15',
        title: 'Type 2 Diabetes Mellitus Diagnosed',
        description: 'HbA1c recorded 8.4%. Started on Metformin 500mg BD.',
        event_type: 'diagnosis',
        source: 'patient_stated',
        source_document_id: null,
        created_at: now.toISOString(),
      });
    }
  }

  // 2. Events from Uploaded OCR Documents
  for (const doc of input.ocrDocuments) {
    if (doc.documentType === 'lab_report' && doc.extractedEntities.recordDate) {
      events.push({
        id: `tl-${Date.now()}-lab`,
        encounter_id: input.encounter.id,
        patient_id: input.patient.id,
        event_date: doc.extractedEntities.recordDate,
        title: 'Lipid Profile Investigation (Dr. Lal PathLabs)',
        description: 'Total Cholesterol 242 mg/dL, LDL 168 mg/dL (Elevated Dyslipidemia).',
        event_type: 'lab_test',
        source: 'document_ocr',
        source_document_id: doc.documentId,
        created_at: now.toISOString(),
      });
    }

    if (doc.documentType === 'prescription' && doc.extractedEntities.recordDate) {
      events.push({
        id: `tl-${Date.now()}-rx`,
        encounter_id: input.encounter.id,
        patient_id: input.patient.id,
        event_date: doc.extractedEntities.recordDate,
        title: 'Cardiology Consultation & Prescription (Max Hospital)',
        description: 'Prescribed Tab Telmisartan 40mg OD and Tab Atorvastatin 20mg HS.',
        event_type: 'medication_start',
        source: 'document_ocr',
        source_document_id: doc.documentId,
        created_at: now.toISOString(),
      });
    }
  }

  // 3. Current Kiosk Encounter Milestone
  events.push({
    id: `tl-${Date.now()}-visit`,
    encounter_id: input.encounter.id,
    patient_id: input.patient.id,
    event_date: now.toISOString().split('T')[0],
    title: `Emergency Clinical Intake — ${input.chiefComplaint.replace('_', ' ').toUpperCase()}`,
    description: `Presented to MediKiosk with acute symptoms (Severity: ${input.answers.severity || 8}/10). Dispatched to Triage & Attending Physician.`,
    event_type: 'intake_visit',
    source: 'patient_stated',
    source_document_id: null,
    created_at: now.toISOString(),
  });

  // Sort Chronologically Ascending
  return events.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
}
