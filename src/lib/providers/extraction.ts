import { DocumentOCRResult } from './ocr';
import { Medication, Allergy, Investigation } from '@/types/clinical';

export interface ValidatedMedicalEntities {
  medications: Array<Omit<Medication, 'id' | 'encounter_id' | 'patient_id' | 'created_at'>>;
  allergies: Array<Omit<Allergy, 'id' | 'encounter_id' | 'patient_id' | 'created_at'>>;
  investigations: Array<Omit<Investigation, 'id' | 'encounter_id' | 'patient_id' | 'created_at'>>;
  validationConfidence: 'high' | 'needs_review' | 'low';
}

export function validateAndStructureExtractions(ocrResult: DocumentOCRResult): ValidatedMedicalEntities {
  const validatedMeds: Array<Omit<Medication, 'id' | 'encounter_id' | 'patient_id' | 'created_at'>> = [];
  const validatedLabs: Array<Omit<Investigation, 'id' | 'encounter_id' | 'patient_id' | 'created_at'>> = [];
  const validatedAllergies: Array<Omit<Allergy, 'id' | 'encounter_id' | 'patient_id' | 'created_at'>> = [];

  // 1. Process Extracted Medications
  if (ocrResult.extractedEntities.medications) {
    for (const med of ocrResult.extractedEntities.medications) {
      if (med.drugName && med.drugName.trim().length > 0) {
        validatedMeds.push({
          name: med.drugName,
          dosage: med.strength || null,
          frequency: med.frequency || null,
          duration: med.duration || null,
          route: med.route || 'Oral',
          source: 'document_ocr',
          source_document_id: ocrResult.documentId,
          verification_state: med.confidence >= 0.9 ? 'needs_review' : 'needs_review',
          doctor_notes: null,
        });
      }
    }
  }

  // 2. Process Extracted Lab Results
  if (ocrResult.extractedEntities.labResults) {
    for (const lab of ocrResult.extractedEntities.labResults) {
      if (lab.testName) {
        validatedLabs.push({
          test_name: lab.testName,
          test_category: 'Biochemistry / Lipid Panel',
          numeric_result: typeof lab.resultValue === 'number' ? lab.resultValue : null,
          text_result: typeof lab.resultValue === 'string' ? lab.resultValue : null,
          unit: lab.unit || null,
          reference_range: lab.referenceRange || null,
          is_abnormal: Boolean(lab.isAbnormal),
          test_date: ocrResult.extractedEntities.recordDate || null,
          source_document_id: ocrResult.documentId,
        });
      }
    }
  }

  return {
    medications: validatedMeds,
    allergies: validatedAllergies,
    investigations: validatedLabs,
    validationConfidence: ocrResult.confidenceTier,
  };
}
