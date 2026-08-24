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
    await new Promise((r) => setTimeout(r, 400));

    const name = file.name.toLowerCase();

    // 1. Diabetes / Endocrine
    if (name.includes('diabetes') || name.includes('sugar') || name.includes('glucose') || name.includes('hba1c')) {
      return {
        documentId: `doc-${Date.now()}`,
        fileName: file.name,
        documentType: 'lab_report',
        confidenceScore: 0.93,
        confidenceTier: 'high',
        provider: 'mock_clinical_ocr',
        rawText: `CLINICAL BIOCHEMISTRY REPORT\nTest: HbA1c & Fasting Plasma Glucose\nHbA1c: 8.4 % [Reference: < 5.7 %] (HIGH)\nFasting Blood Glucose: 162 mg/dL [Reference: 70 - 100 mg/dL] (HIGH)\nRx: Tab. Metformin 500mg BD after meals. Lifestyle & diabetic diet recommended.`,
        extractedEntities: {
          hospitalName: 'Apollo Diagnostics Centre',
          recordDate: new Date(Date.now() - 3600000 * 24 * 30).toISOString().split('T')[0],
          diagnoses: ['Type 2 Diabetes Mellitus (Uncontrolled)', 'Impaired Glycemic Control'],
          medications: [
            {
              drugName: 'Tab Metformin',
              strength: '500 mg',
              frequency: 'Twice Daily (After meals)',
              duration: 'Ongoing',
              route: 'Oral',
              confidence: 0.95,
            },
          ],
          labResults: [
            {
              testName: 'Glycated Hemoglobin (HbA1c)',
              resultValue: 8.4,
              unit: '%',
              referenceRange: '< 5.7 %',
              isAbnormal: true,
              notes: 'Significantly elevated — physician review recommended',
            },
            {
              testName: 'Fasting Plasma Glucose',
              resultValue: 162,
              unit: 'mg/dL',
              referenceRange: '70-100 mg/dL',
              isAbnormal: true,
              notes: 'Above fasting reference target',
            },
          ],
        },
      };
    }

    // 2. Orthopedics / Joint / Knee / X-Ray
    if (name.includes('knee') || name.includes('ortho') || name.includes('joint') || name.includes('xray') || name.includes('arthritis')) {
      return {
        documentId: `doc-${Date.now()}`,
        fileName: file.name,
        documentType: 'imaging',
        confidenceScore: 0.92,
        confidenceTier: 'high',
        provider: 'mock_clinical_ocr',
        rawText: `DEPARTMENT OF RADIODIAGNOSIS & ORTHOPEDICS\nInvestigation: X-Ray Both Knees AP & Lateral Views (Weight Bearing)\nFindings: Bilateral medial compartment joint space narrowing with marginal osteophyte formation. Subchondral sclerosis noted. Impression: Grade 2 Primary Osteoarthritis of bilateral knee joints.\nRx: Tab. Calcium + Vitamin D3 OD, Tab. Sallaki MR BD (Ayurvedic/NSAID alternative), Quadriceps strengthening exercises.`,
        extractedEntities: {
          hospitalName: 'Metro Orthopedic & Spine Centre',
          recordDate: new Date(Date.now() - 3600000 * 24 * 60).toISOString().split('T')[0],
          diagnoses: ['Primary Osteoarthritis of Bilateral Knees (Grade 2)', 'Sandhigata Vata (Joint Degeneration)'],
          medications: [
            {
              drugName: 'Tab Calcium + Vitamin D3',
              strength: '500mg/400IU',
              frequency: 'Once Daily',
              duration: '3 months',
              route: 'Oral',
              confidence: 0.94,
            },
            {
              drugName: 'Tab Sallaki MR (Boswellia Serrata)',
              strength: '400 mg',
              frequency: 'Twice Daily',
              duration: '1 month',
              route: 'Oral',
              confidence: 0.88,
            },
          ],
          labResults: [
            {
              testName: 'Medial Knee Joint Space Narrowing',
              resultValue: 'Moderate (Grade 2)',
              unit: '',
              referenceRange: 'Normal joint space',
              isAbnormal: true,
              notes: 'Bilateral medial subchondral sclerosis present',
            },
          ],
        },
      };
    }

    // 3. Cardiology & Hypertension
    if (name.includes('prescription') || name.includes('cardio') || name.includes('heart') || name.includes('bp')) {
      return {
        documentId: `doc-${Date.now()}`,
        fileName: file.name,
        documentType: 'prescription',
        confidenceScore: 0.94,
        confidenceTier: 'high',
        provider: 'mock_clinical_ocr',
        rawText: `MAX SUPER SPECIALITY HOSPITAL\nDepartment of Cardiology\nRx:\n1. Tab. Telmisartan 40mg - 1 Tab OD Morning (x 3 months)\n2. Tab. Atorvastatin 20mg - 1 Tab HS Night (x 3 months)\nAdv: Low salt diet, regular BP monitoring.`,
        extractedEntities: {
          hospitalName: 'Max Super Speciality Hospital',
          doctorName: 'Dr. S. K. Mehta, MD DM (Cardio)',
          recordDate: '2025-06-15',
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
    }

    // 4. Lipid Panel / Blood Report
    if (name.includes('lipid') || name.includes('lab') || name.includes('blood') || name.includes('cholesterol')) {
      return {
        documentId: `doc-${Date.now()}`,
        fileName: file.name,
        documentType: 'lab_report',
        confidenceScore: 0.91,
        confidenceTier: 'high',
        provider: 'mock_clinical_ocr',
        rawText: `DR. LAL PATHLABS CLINICAL LABORATORY REPORT\nTest: LIPID PROFILE (SERUM)\nTotal Cholesterol: 242 mg/dL [Reference: < 200 mg/dL] (HIGH)\nTriglycerides: 184 mg/dL [Reference: < 150 mg/dL] (HIGH)\nHDL Cholesterol: 38 mg/dL [Reference: > 40 mg/dL] (LOW)\nLDL Cholesterol: 168 mg/dL [Reference: < 100 mg/dL] (HIGH)`,
        extractedEntities: {
          hospitalName: 'Dr. Lal PathLabs',
          recordDate: '2025-06-15',
          diagnoses: ['Dyslipidemia'],
          labResults: [
            {
              testName: 'Serum Total Cholesterol',
              resultValue: 242,
              unit: 'mg/dL',
              referenceRange: '< 200 mg/dL',
              isAbnormal: true,
              notes: 'Elevated lipid fraction',
            },
            {
              testName: 'Serum LDL Cholesterol',
              resultValue: 168,
              unit: 'mg/dL',
              referenceRange: '< 100 mg/dL',
              isAbnormal: true,
              notes: 'Elevated',
            },
          ],
        },
      };
    }

    // 5. Generic Document Extraction
    const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    return {
      documentId: `doc-${Date.now()}`,
      fileName: file.name,
      documentType: file.type.includes('pdf') ? 'discharge_summary' : 'other',
      confidenceScore: 0.88,
      confidenceTier: 'high',
      provider: 'mock_clinical_ocr',
      rawText: `MEDICAL DOCUMENT: ${cleanBaseName.toUpperCase()}\nDocument file: ${file.name} (Size: ${(file.size / 1024).toFixed(1)} KB).\nContent extracted and categorized for physician verification.`,
      extractedEntities: {
        recordDate: new Date().toISOString().split('T')[0],
        diagnoses: [`Extracted from ${cleanBaseName}`],
      },
    };
  }
}

export const ocrProvider = new MockClinicalOCRProvider();
