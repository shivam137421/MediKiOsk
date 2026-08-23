export interface ExtractedLabResult {
  testName: string;
  resultValue: number | string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  notes?: string;
}

export interface ExtractedPrescriptionItem {
  drugName: string;
  strength: string;
  frequency: string;
  duration: string;
  route: string;
  confidence: number;
}

export interface DocumentOCRResult {
  documentId: string;
  fileName: string;
  documentType: 'prescription' | 'lab_report' | 'discharge_summary' | 'imaging' | 'other';
  rawText: string;
  confidenceScore: number;
  confidenceTier: 'high' | 'needs_review' | 'low';
  extractedEntities: {
    hospitalName?: string;
    doctorName?: string;
    recordDate?: string;
    patientName?: string;
    diagnoses?: string[];
    medications?: ExtractedPrescriptionItem[];
    labResults?: ExtractedLabResult[];
    allergies?: string[];
  };
  provider: 'google_vision' | 'aws_textract' | 'tesseract' | 'mock_clinical_ocr';
}

export interface DocumentOCRProvider {
  processDocument(file: File | { name: string; type: string; size: number }): Promise<DocumentOCRResult>;
}

export class MockClinicalOCRProvider implements DocumentOCRProvider {
  async processDocument(file: { name: string; type: string; size: number }): Promise<DocumentOCRResult> {
    // Simulate OCR processing latency
    await new Promise((r) => setTimeout(r, 600));

    const name = file.name.toLowerCase();

    if (name.includes('prescription') || name.includes('cardio') || name.includes('dr')) {
      return {
        documentId: `doc-${Date.now()}`,
        fileName: file.name,
        documentType: 'prescription',
        confidenceScore: 0.94,
        confidenceTier: 'high',
        provider: 'mock_clinical_ocr',
        rawText: `MAX SUPER SPECIALITY HOSPITAL, NEW DELHI\nDepartment of Cardiology\nDate: 15-Jun-2025\nPatient: Aarav Sharma | Age: 47Y / Male\nRx:\n1. Tab. Telmisartan 40mg - 1 Tab OD Morning (x 3 months)\n2. Tab. Atorvastatin 20mg - 1 Tab HS Night (x 3 months)\nAdv: Low salt diet, regular BP monitoring. Review in 3 months.`,
        extractedEntities: {
          hospitalName: 'Max Super Speciality Hospital, New Delhi',
          doctorName: 'Dr. S. K. Mehta, MD DM (Cardio)',
          recordDate: '2025-06-15',
          patientName: 'Aarav Sharma',
          diagnoses: ['Essential Systemic Hypertension', 'Hypercholesterolemia'],
          medications: [
            {
              drugName: 'Tab Telmisartan',
              strength: '40 mg',
              frequency: 'Once Daily (Morning)',
              duration: '3 months',
              route: 'Oral',
              confidence: 0.96,
            },
            {
              drugName: 'Tab Atorvastatin',
              strength: '20 mg',
              frequency: 'Once Daily (Night)',
              duration: '3 months',
              route: 'Oral',
              confidence: 0.92,
            },
          ],
        },
      };
    } else if (name.includes('lipid') || name.includes('lab') || name.includes('blood')) {
      return {
        documentId: `doc-${Date.now()}`,
        fileName: file.name,
        documentType: 'lab_report',
        confidenceScore: 0.91,
        confidenceTier: 'high',
        provider: 'mock_clinical_ocr',
        rawText: `DR. LAL PATHLABS CLINICAL LABORATORY REPORT\nDate of Collection: 15-Jun-2025\nTest: LIPID PROFILE (SERUM)\nTotal Cholesterol: 242 mg/dL [Reference: < 200 mg/dL] (HIGH)\nTriglycerides: 184 mg/dL [Reference: < 150 mg/dL] (HIGH)\nHDL Cholesterol: 38 mg/dL [Reference: > 40 mg/dL] (LOW)\nLDL Cholesterol: 168 mg/dL [Reference: < 100 mg/dL] (HIGH)\nInterpretation: Dyslipidemia pattern noted. Physician review recommended.`,
        extractedEntities: {
          hospitalName: 'Dr. Lal PathLabs, New Delhi',
          recordDate: '2025-06-15',
          patientName: 'Aarav Sharma',
          labResults: [
            {
              testName: 'Serum Total Cholesterol',
              resultValue: 242,
              unit: 'mg/dL',
              referenceRange: '< 200 mg/dL',
              isAbnormal: true,
              notes: 'Outside provided reference range — physician review recommended',
            },
            {
              testName: 'Serum LDL Cholesterol',
              resultValue: 168,
              unit: 'mg/dL',
              referenceRange: '< 100 mg/dL',
              isAbnormal: true,
              notes: 'Outside provided reference range — physician review recommended',
            },
            {
              testName: 'Serum HDL Cholesterol',
              resultValue: 38,
              unit: 'mg/dL',
              referenceRange: '> 40 mg/dL',
              isAbnormal: true,
              notes: 'Outside provided reference range — physician review recommended',
            },
            {
              testName: 'Serum Triglycerides',
              resultValue: 184,
              unit: 'mg/dL',
              referenceRange: '< 150 mg/dL',
              isAbnormal: true,
              notes: 'Outside provided reference range — physician review recommended',
            },
          ],
        },
      };
    }

    // Generic discharge summary / report fallback
    return {
      documentId: `doc-${Date.now()}`,
      fileName: file.name,
      documentType: 'discharge_summary',
      confidenceScore: 0.85,
      confidenceTier: 'needs_review',
      provider: 'mock_clinical_ocr',
      rawText: `CLINICAL SUMMARY NOTE\nDate: 10-Apr-2022\nDiagnosis: Stage 1 Essential Hypertension.\nNotes: BP recorded 152/94 mmHg on two separate visits. Commenced lifestyle modification and anti-hypertensive therapy.`,
      extractedEntities: {
        recordDate: '2022-04-10',
        diagnoses: ['Essential Hypertension (Stage 1)'],
      },
    };
  }
}

export const ocrProvider = new MockClinicalOCRProvider();
