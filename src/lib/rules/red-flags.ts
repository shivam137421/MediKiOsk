import { TriagePriority } from '@/types/database';

export interface RedFlagEvaluationResult {
  hasRedFlag: boolean;
  priority: TriagePriority;
  triggerSymptoms: string[];
  rationale: string;
  recommendedDepartment: string;
}

export function evaluateRedFlags(
  chiefComplaint: string,
  answers: Record<string, any>
): RedFlagEvaluationResult {
  const triggers: string[] = [];
  let highestPriority: TriagePriority = 'GREEN';
  const rationales: string[] = [];
  let dept = 'General OPD';

  // 1. Acute Chest Pain / Cardiovascular Red Flags
  if (chiefComplaint === 'chest_pain') {
    highestPriority = 'AMBER';
    dept = 'Cardiology & Emergency';

    const character = answers['character'];
    const radiation = answers['radiation'] || [];
    const severity = Number(answers['severity']) || 5;
    const associated = answers['associated_symptoms'] || [];
    const onset = answers['onset'];

    if (character === 'crushing_pressure' || character === 'Heavy crushing / Pressure / Squeezing') {
      triggers.push('Crushing retrosternal chest pressure');
      highestPriority = 'RED';
    }

    if (radiation.includes('left_arm') || radiation.includes('jaw_neck')) {
      triggers.push('Radiation to left arm or jaw/neck');
      highestPriority = 'RED';
    }

    if (associated.includes('sweating') || associated.includes('dyspnea') || associated.includes('presyncope')) {
      triggers.push('Associated diaphoresis / breathlessness / presyncope');
      highestPriority = 'RED';
    }

    if (severity >= 7) {
      triggers.push(`Severe pain intensity score: ${severity}/10`);
    }

    if (highestPriority === 'RED') {
      rationales.push('Suspected Acute Coronary Syndrome (ACS) / Ischemic Heart Disease.');
      rationales.push('Immediate 12-lead ECG, Troponin I/T, and emergency physician evaluation required.');
    }
  }

  // 2. Severe Breathlessness
  else if (chiefComplaint === 'breathlessness') {
    highestPriority = 'RED';
    dept = 'Emergency & Respiratory Care';
    triggers.push('Acute respiratory distress');
    rationales.push('Potential acute bronchospasm, pulmonary edema, or pulmonary embolism.');
  }

  // 3. Severe Neurological Red Flags
  else if (chiefComplaint === 'headache_dizziness' && answers['sudden_weakness']) {
    highestPriority = 'RED';
    dept = 'Emergency Neurology';
    triggers.push('Acute onset severe headache with neurological deficit');
    rationales.push('Suspected Stroke or Subarachnoid Hemorrhage. Immediate CT Brain recommended.');
  }

  // 4. Moderate/Priority conditions
  else if (chiefComplaint === 'fever' && answers['duration'] === '>1_week') {
    highestPriority = 'YELLOW';
    triggers.push('Prolonged pyrexia > 7 days');
    rationales.push('Requires workup for enteric fever, malaria/dengue, or focus of infection.');
  }

  return {
    hasRedFlag: triggers.length > 0,
    priority: highestPriority,
    triggerSymptoms: triggers,
    rationale: rationales.join(' '),
    recommendedDepartment: dept,
  };
}
