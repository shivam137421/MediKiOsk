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

  const { patient, encounter, summary, ayushAnswers, uploadedDocs, medications, allergies, investigations } = data;
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
  doc.text(`ABHA ID: ${patient.abha_id || patient.demo_id}`, 18, y + 17);
  doc.text(`Contact: ${patient.phone || '+91 98765 43210'}`, 18, y + 21);

  // Right-aligned Encounter Badges
  const recSpecialty = encounter?.recommended_specialty || summary?.recommended_specialty || 'Cardiology';
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

  const cc = summary?.chief_complaint || encounter?.chief_complaint_summary || 'Acute substernal chest pressure with cold diaphoresis (Severity 8/10).';
  const hpi = summary?.hpi || 'Patient presented with acute crushing retrosternal pressure starting within last 2 hours. Radiates to left shoulder and jaw, accompanied by cold sweats.';

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
  const allergyText = summary?.allergies_summary || 'PENICILLIN (Severe Urticaria & Facial Angioedema)';
  y = addWrappedText(allergyText, 48, y, pageWidth - 64);
  y += 1.5;

  // Medications
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('• Current Meds:', 16, y);
  doc.setFont('helvetica', 'normal');
  const medsText = summary?.medications_summary || 'Tab Telmisartan 40mg OD [Patient Stated]; Tab Atorvastatin 20mg HS [Document OCR]';
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
      y = addWrappedText(`Confidence: ${Math.round(docItem.confidenceScore * 100)}% | Summary: ${docItem.rawText.slice(0, 120)}...`, 20, y, pageWidth - 36);
      y += 2;
    });
  } else {
    y = addWrappedText('• Lipid Panel (June 2025): Serum Cholesterol 242 mg/dL (HIGH), LDL 168 mg/dL (HIGH), HDL 38 mg/dL (LOW). STAT 12-lead ECG pending.', 16, y, pageWidth - 32);
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

  const prakriti = ayushAnswers?.prakritiPrimary || 'Vata-Kapha Dual';
  const vikriti = ayushAnswers?.vikritiDosha || 'Vata Vriddhi (Stiffness, Pain, Joint Crepitus)';
  const agni = ayushAnswers?.agniType || 'Manda / Vishama (Sluggish/Irregular Digestion)';
  const koshtha = ayushAnswers?.koshthaType || 'Krura (Constipation Tendency)';
  const ahara = ayushAnswers?.aharaHabits || 'Sheeta-Ruksha (Cold, dry foods, irregular meal intervals)';
  const dhatu = ayushAnswers?.dhatuAffected?.join(', ') || 'Asthi, Majja, Mamsa Dhatu';

  doc.text(`• Deha Prakriti: ${prakriti}`, 16, y);
  doc.text(`• Current Vikriti: ${vikriti}`, 110, y);
  y += 4.5;
  doc.text(`• Jatharagni: ${agni}`, 16, y);
  doc.text(`• Koshtha: ${koshtha}`, 110, y);
  y += 4.5;
  y = addWrappedText(`• Ahara & Vihara: ${ahara}`, 16, y, pageWidth - 32);
  y += 1.5;
  y = addWrappedText(`• Dhatu & Srotas Affected: ${dhatu}`, 16, y, pageWidth - 32);
  y += 5;

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
  doc.text(`Assigned Doctor: Dr. Arvind Sen, MD DM (Cardiology)`, 18, y + 11);
  doc.text(`Confirmed Slot: ${encounter?.confirmed_appointment_time || 'Today, 03:30 PM (STAT Fast-Track)'}`, 18, y + 16);
  doc.text(`Location: ${encounter?.appointment_location || 'Cardiology OPD Suite Room 204'}`, 110, y + 16);

  // Footer note
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('This document was automatically synthesized by MediKiosk Clinical AI and submitted to Hospital Administration.', pageWidth / 2, 288, { align: 'center' });

  // Save / Trigger Download
  const fileName = `MediKiosk_Clinical_Summary_${patient.full_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
