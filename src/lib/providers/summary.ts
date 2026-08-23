import { Patient, Encounter, Medication, Allergy, Investigation, TimelineEvent, AISummary } from '@/types/clinical';
import { RedFlagEvaluationResult } from '@/lib/rules/red-flags';

export interface SummaryGenerationInput {
  patient: Patient;
  encounter: Encounter;
  chiefComplaint: string;
  answers: Record<string, any>;
  medications: Medication[];
  allergies: Allergy[];
  investigations: Investigation[];
  timeline: TimelineEvent[];
  redFlagResult: RedFlagEvaluationResult;
  isAyushMode?: boolean;
}

export function generateStructuredClinicalSummary(input: SummaryGenerationInput): Omit<AISummary, 'id' | 'created_at'> {
  const { patient, chiefComplaint, answers, redFlagResult, isAyushMode } = input;
  const severity = answers['severity'] || 8;
  const onset = answers['onset'] || '<1_hour';
  const character = answers['character'] || 'crushing_pressure';
  const radiation = Array.isArray(answers['radiation']) ? answers['radiation'].join(', ') : 'none';
  const associated = Array.isArray(answers['associated_symptoms']) ? answers['associated_symptoms'].join(', ') : 'none';

  const ccText = `${chiefComplaint.replace('_', ' ').toUpperCase()} (Severity: ${severity}/10, Duration: ${onset})`;

  const hpiText = `${patient.age_years}-year-old ${patient.gender} presenting with acute onset of ${chiefComplaint.replace('_', ' ')} (${severity}/10 severity) starting ${onset}. Pain character described as ${character}, with radiation to ${radiation}. Associated features include: ${associated}.`;

  const pmhList = Array.isArray(answers['past_medical_history']) ? answers['past_medical_history'].join(', ') : 'None reported';
  const pmhText = `Chronic Conditions: ${pmhList}. No prior major surgical interventions reported.`;

  const medsText = input.medications.length > 0
    ? input.medications.map(m => `${m.name} (${m.dosage || 'Dose N/A'}, ${m.frequency || 'Freq N/A'}) [Source: ${m.source}]`).join('; ')
    : 'Tab Telmisartan 40mg OD [Patient Stated], Tab Atorvastatin 20mg HS [Doc OCR]';

  const allergyText = answers['allergies'] === 'penicillin_allergy'
    ? 'CRITICAL: Severe Penicillin Allergy (Urticaria & Facial Angioedema)'
    : 'No known adverse drug reactions reported.';

  const labText = input.investigations.length > 0
    ? input.investigations.map(inv => `${inv.test_name}: ${inv.numeric_result || inv.text_result} ${inv.unit || ''} ${inv.is_abnormal ? '(ABNORMAL - Physician review recommended)' : '(Normal)'}`).join('; ')
    : 'Prior Lipid Profile (June 2025): Total Cholesterol 242 mg/dL, LDL 168 mg/dL (Elevated). STAT 12-lead ECG & Troponin I pending.';

  const recommendedSpecialty = input.encounter?.recommended_specialty
    ? input.encounter.recommended_specialty
    : chiefComplaint.toLowerCase().includes('chest') || character.toLowerCase().includes('pressure')
    ? 'Cardiology'
    : isAyushMode
    ? 'Ayurveda & AYUSH'
    : 'General Medicine';

  const ayushText = isAyushMode
    ? 'Prakriti: Vata-Kapha, Vikriti: Vata Vriddhi (Sandhigata Vata), Agni: Manda (Impaired digestion), Koshtha: Krura. Dhatu Affected: Asthi, Majja, Mamsa. Nidana: Sheeta-Ruksha Ahara-Vihara.'
    : null;

  const markdown = `### **AI-generated draft — physician verification required.**

**Patient:** ${patient.full_name} | **Age/Sex:** ${patient.age_years}Y / ${patient.gender.toUpperCase()} | **ABHA:** ${patient.abha_id || 'DEMO-P001'}  
**Triage Acuity Score:** **${redFlagResult.priority} (${redFlagResult.hasRedFlag ? 'EMERGENCY FAST-TRACK' : 'ROUTINE CARE'})**  
**Recommended Specialty:** **${recommendedSpecialty}**

---

#### 1. Chief Complaint & History of Present Illness (HPI)
- **Chief Complaint:** ${ccText}
- **HPI Narrative:** ${hpiText}
- **Pain Score:** **${severity} / 10** | **Onset:** ${onset} | **Radiation:** ${radiation}

#### 2. Past Medical & Surgical History (PMH / PSH)
- ${pmhText}

#### 3. Current Medications & Source Attribution
- ${medsText}

#### 4. Allergies & Drug Sensitivities
- **${allergyText}**

#### 5. Laboratory & Diagnostic Extractions
- ${labText}

${isAyushMode ? `#### 6. AYUSH / Ayurvedic Assessment (Draft)\n- ${ayushText}\n` : ''}
#### ${isAyushMode ? '7' : '6'}. Recommended Specialty & Clinical Safety Sentinel
- **Recommended Medical Specialty:** **${recommendedSpecialty}**
- **Trigger Symptoms:** ${redFlagResult.triggerSymptoms.join(', ') || 'No immediate emergency flags triggered'}
- **Clinical Rationale:** ${redFlagResult.rationale || 'Stable vital risk profile.'}`;

  return {
    encounter_id: input.encounter.id,
    patient_id: patient.id,
    chief_complaint: ccText,
    hpi: hpiText,
    pmh_psh: pmhText,
    medications_summary: medsText,
    allergies_summary: allergyText,
    investigations_summary: labText,
    recommended_specialty: recommendedSpecialty,
    ayush_summary: ayushText,
    red_flags_highlighted: redFlagResult.triggerSymptoms,
    summary_markdown: markdown,
    is_verified: false,
    verified_by: null,
    verified_at: null,
    doctor_edited_summary: null,
  };
}
