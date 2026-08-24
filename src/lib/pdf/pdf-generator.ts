import { jsPDF } from 'jspdf';
import { Patient, Encounter, AISummary, Medication, Allergy, Investigation } from '@/types/clinical';
import { AyurvedicAssessmentAnswers } from '@/lib/ontology/ayurvedic-assessment';
import { DocumentOCRResult } from '@/lib/providers/ocr';

export interface PDFReportData {
  patient: Patient;
  encounter?: Encounter | null;
  summary?: AISummary | null;
  ayushAnswers?: AyurvedicAssessmentAnswers | null;
  uploadedDocs?: DocumentOCRResult[];
  medications?: Medication[];
  allergies?: Allergy[];
  investigations?: Investigation[];
}

export function generateAndDownloadClinicalPDF(data: PDFReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { patient, encounter, summary, ayushAnswers, uploadedDocs, medications, allergies } = data;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  // Helper for adding horizontal divider
  const drawDivider = (posY: number, r = 200, g = 210, b = 220) => {
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.3);
    doc.line(14, posY, pageWidth - 14, posY);
  };

  // Helper for text wrapping
  const addWrappedText = (text: string, x: number, posY: number, maxWidth: number, lineHeight = 4.5): number => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, posY);
    return posY + (lines.length * lineHeight);
  };

  // ----------------------------------------------------------------------------
  // HEADER & BRANDING
  // ----------------------------------------------------------------------------
  doc.setFillColor(15, 23, 42); // Dark slate
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MEDIKIOSK CLINICAL INTAKE & APPOINTMENT REPORT', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Pre-Consultation Summary · Multi-Specialty & Ayurvedic Triage', 14, 17);

  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Generated: ${reportDate}`, pageWidth - 14, 17, { align: 'right' });

  y = 30;

  // ----------------------------------------------------------------------------
  // MANDATORY CLINICAL DISCLAIMER BANNER
  // ----------------------------------------------------------------------------
  doc.setFillColor(254, 243, 199); // Amber background
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, pageWidth - 28, 8, 1.5, 1.5, 'FD');

  doc.setTextColor(180, 83, 9);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('⚠ AI-GENERATED DRAFT — PHYSICIAN VERIFICATION & CLINICAL SIGN-OFF REQUIRED', pageWidth / 2, y + 5.2, { align: 'center' });

  y += 13;

  // ----------------------------------------------------------------------------
  // PATIENT & ENCOUNTER DEMOGRAPHICS
  // ----------------------------------------------------------------------------
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(patient.full_name, 18, y + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Age / Sex: ${patient.age_years} Y / ${patient.gender.toUpperCase()}`, 18, y + 12);
  doc.text(`ABHA ID: ${patient.abha_id || patient.demo_id || 'DEMO-PATIENT'}`, 18, y + 17);
  doc.text(`Contact: ${patient.phone || 'Not provided'}`, 18, y + 21);

  // Right-aligned Encounter Badges
  const recSpecialty = encounter?.recommended_specialty || summary?.recommended_specialty || 'General Medicine';
  const isEmerg = encounter?.is_emergency || false;

  doc.setTextColor(15, 23, 42);
  doc.text(`Recommended Specialty:`, pageWidth - 18, y + 6, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199); // Sky
  doc.text(recSpecialty.toUpperCase(), pageWidth - 18, y + 11, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  if (isEmerg) {
    doc.setTextColor(225, 29, 72); // Rose
    doc.text('● EMERGENCY TOP PRIORITY', pageWidth - 18, y + 17, { align: 'right' });
  } else {
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text('● ROUTINE OUTPATIENT', pageWidth - 18, y + 17, { align: 'right' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Encounter Status: ${(encounter?.status || 'Submitted').replace(/_/g, ' ').toUpperCase()}`, pageWidth - 18, y + 21, { align: 'right' });

  y += 29;

  // ----------------------------------------------------------------------------
  // SECTION 1: CHIEF COMPLAINT & HPI
  // ----------------------------------------------------------------------------
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Chief Complaint & History of Present Illness (HPI)', 14, y);
  y += 2;
  drawDivider(y, 14, 165, 233);
  y += 4;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const cc = summary?.chief_complaint || encounter?.chief_complaint_summary || 'Clinical intake recorded.';
  const hpi = summary?.hpi || 'Clinical interview notes recorded by AI triage assistant.';

  doc.setFont('helvetica', 'bold');
  doc.text(`• Chief Complaint: `, 16, y);
  doc.setFont('helvetica', 'normal');
  y = addWrappedText(cc, 48, y, pageWidth - 64);
  y += 1.5;

  doc.setFont('helvetica', 'bold');
  doc.text(`• HPI Narrative: `, 16, y);
  doc.setFont('helvetica', 'normal');
  y = addWrappedText(hpi, 48, y, pageWidth - 64);
  y += 4;

  // ----------------------------------------------------------------------------
  // SECTION 2: MEDICATIONS, ALLERGIES & MEDICAL HISTORY
  // ----------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Medications, Allergies & Chronic Conditions', 14, y);
  y += 2;
  drawDivider(y, 14, 165, 233);
  y += 4;

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  // Allergies
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72);
  doc.text('• Known Allergies:', 16, y);
  doc.setFont('helvetica', 'normal');
  const allergyText = summary?.allergies_summary || (allergies && allergies.length > 0 ? allergies.map(a => a.allergen).join(', ') : 'No known adverse drug reactions reported.');
  y = addWrappedText(allergyText, 48, y, pageWidth - 64);
  y += 1.5;

  // Medications
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('• Current Meds:', 16, y);
  doc.setFont('helvetica', 'normal');
  const medsText = summary?.medications_summary || (medications && medications.length > 0 ? medications.map(m => `${m.name} ${m.dosage || ''} (${m.frequency || ''})`).join('; ') : 'No active medications reported or found in uploaded documents.');
  y = addWrappedText(medsText, 48, y, pageWidth - 64);
  y += 4;

  // ----------------------------------------------------------------------------
  // SECTION 3: UPLOADED DOCUMENTS & OCR INVESTIGATION EXTRACTIONS
  // ----------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Uploaded Medical Documents & Diagnostic Findings', 14, y);
  y += 2;
  drawDivider(y, 14, 165, 233);
  y += 4;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  if (uploadedDocs && uploadedDocs.length > 0) {
    uploadedDocs.forEach((docItem, idx) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`[Doc ${idx + 1}] ${docItem.fileName} (${docItem.documentType})`, 16, y);
      doc.setFont('helvetica', 'normal');
      y += 4;
      const textPreview = docItem.rawText ? docItem.rawText.slice(0, 120) : 'Text extracted from file';
      y = addWrappedText(`Confidence: ${Math.round(docItem.confidenceScore * 100)}% | Summary: ${textPreview}...`, 20, y, pageWidth - 36);
      y += 2;
    });
  } else {
    y = addWrappedText('• No prior laboratory or diagnostic documents were uploaded for this encounter.', 16, y, pageWidth - 32);
    y += 2;
  }
  y += 2;

  // ----------------------------------------------------------------------------
  // SECTION 4: AYURVEDIC ASSESSMENT (ROGI & ROGA PARIKSHA)
  // ----------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Ayurvedic Clinical Assessment (Trividha / Ashtavidha Pariksha)', 14, y);
  y += 2;
  drawDivider(y, 14, 165, 233);
  y += 4;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const hasAyushAnswers = ayushAnswers && Object.keys(ayushAnswers).length > 0;
  if (hasAyushAnswers) {
    const prakriti = ayushAnswers?.prakritiPrimary ? `${ayushAnswers.prakritiPrimary}${ayushAnswers.prakritiNotes ? ` (${ayushAnswers.prakritiNotes})` : ''}` : 'Not assessed';
    const vikriti = Array.isArray(ayushAnswers?.vikritiSymptoms) && ayushAnswers.vikritiSymptoms.length > 0 ? ayushAnswers.vikritiSymptoms.join(', ') : (ayushAnswers?.vikritiDosha || 'None reported');
    const agni = ayushAnswers?.agniType || 'Not specified';
    const koshtha = ayushAnswers?.koshthaType || 'Not specified';
    const ahara = Array.isArray(ayushAnswers?.aharaHabits) ? ayushAnswers.aharaHabits.join(', ') : (ayushAnswers?.aharaHabits || 'Standard');
    const vihara = Array.isArray(ayushAnswers?.viharaHabits) ? ayushAnswers.viharaHabits.join(', ') : (ayushAnswers?.viharaHabits || 'Standard');
    const dhatu = Array.isArray(ayushAnswers?.dhatuAffected) ? ayushAnswers.dhatuAffected.join(', ') : (ayushAnswers?.dhatuAffected || 'None specified');
    const nidana = Array.isArray(ayushAnswers?.nidanaTriggers) ? ayushAnswers.nidanaTriggers.join(', ') : (ayushAnswers?.nidanaTriggers || 'None specified');

    doc.text(`• Deha Prakriti: ${prakriti}`, 16, y);
    doc.text(`• Current Vikriti: ${vikriti}`, 110, y);
    y += 4.5;
    doc.text(`• Jatharagni: ${agni}`, 16, y);
    doc.text(`• Koshtha: ${koshtha}`, 110, y);
    y += 4.5;
    y = addWrappedText(`• Ahara & Vihara: ${ahara} | Routine: ${vihara}`, 16, y, pageWidth - 32);
    y += 1.5;
    y = addWrappedText(`• Dhatu & Srotas: ${dhatu} | Triggers: ${nidana}`, 16, y, pageWidth - 32);
    y += 5;
  } else {
    y = addWrappedText('• Step 2 Ayurvedic assessment was optional and left unselected by patient.', 16, y, pageWidth - 32);
    y += 5;
  }

  // ----------------------------------------------------------------------------
  // SECTION 5: APPOINTMENT DIRECTIVE & PHYSICIAN SIGN-OFF
  // ----------------------------------------------------------------------------
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('5. Official Appointment Details & Clinical Directives', 18, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const doctorText = encounter?.assigned_doctor_id 
    ? `Assigned Doctor ID: ${encounter.assigned_doctor_id}`
    : 'Assigned Doctor: Pending Specialist Assignment (Triage Queue)';
  doc.text(doctorText, 18, y + 11);
  doc.text(`Confirmed Slot: ${encounter?.confirmed_appointment_time || encounter?.proposed_appointment_time || 'Awaiting Scheduling (Queue)'}`, 18, y + 16);
  doc.text(`Location: ${encounter?.appointment_location || `${recSpecialty} Consultation Bay`}`, 110, y + 16);

  // Footer note
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('This document was automatically synthesized by MediKiosk Clinical AI and submitted to Hospital Administration.', pageWidth / 2, 288, { align: 'center' });

  // Save / Trigger Download
  const cleanName = (patient.full_name || 'Patient').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const fileName = `MediKiosk_Clinical_Summary_${cleanName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
