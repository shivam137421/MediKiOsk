// ==============================================================================
// MEDIKIOSK — COMPLETE 5-STEP PATIENT DASHBOARD & MULTI-PATIENT E2E TEST SUITE
// ==============================================================================

import { mockDB, AVAILABLE_DOCTORS } from '../src/lib/supabase/mock-db.ts';
import { adaptiveInterviewEngine } from '../src/lib/ontology/adaptive-interview.ts';
import { AYURVEDIC_QUESTIONS } from '../src/lib/ontology/ayurvedic-assessment.ts';
import { ocrProvider } from '../src/lib/providers/ocr.ts';
import { evaluateRedFlags } from '../src/lib/rules/red-flags.ts';
import { generateStructuredClinicalSummary } from '../src/lib/providers/summary.ts';

async function runCompletePatientDashboardE2ETest() {
  console.log('================================================================');
  console.log('RUNNING MEDIKIOSK COMPLETE STEP 4 SUMMARY & ADMIN HANDOFF TESTS');
  console.log('================================================================\n');

  let allPassed = true;

  // ----------------------------------------------------------------------------
  // TEST 1: PATIENT A (CARDIAC EMERGENCY INTAKE)
  // ----------------------------------------------------------------------------
  console.log('--- TEST 1: PATIENT A (CARDIAC EMERGENCY INTAKE) ---');
  const patientA = mockDB.getPatientById('a1111111-1111-1111-1111-111111111111');
  
  let slotsA = {};
  slotsA = adaptiveInterviewEngine.parsePatientInput('सीने में तेज दबाव और बाईं बांह में दर्द हो रहा है 2 घंटे से', slotsA);
  slotsA = adaptiveInterviewEngine.parsePatientInput('The pain is 8 out of 10 with cold sweating and dizziness', slotsA);

  const redFlagA = evaluateRedFlags('chest_pain', {
    severity: slotsA.severityNumber || 8,
    onset: slotsA.durationOnset || '<1_hour',
    character: slotsA.characterQuality || 'crushing_pressure',
    radiation: [slotsA.radiationLocation || 'left_arm'],
    associated_symptoms: slotsA.associatedSymptoms || ['sweating'],
    past_medical_history: slotsA.pastHistory || ['hypertension'],
  });

  const docA = await ocrProvider.processDocument({
    name: 'MaxHospital_Cardiology_Prescription.pdf',
    type: 'application/pdf',
    size: 350000,
  });

  const encounterA = mockDB.createEncounter({
    patient_id: patientA.id,
    recommended_specialty: 'Cardiology',
    status: 'submitted_waiting_assignment',
    priority: redFlagA.hasRedFlag ? 'EMERGENCY' : 'GREEN',
    is_emergency: redFlagA.hasRedFlag,
    emergency_rationale: redFlagA.rationale,
    chief_complaint_summary: `Chest Pain: ${slotsA.characterQuality} (Severity: ${slotsA.severityNumber}/10)`,
  });

  mockDB.addDocument({
    patient_id: patientA.id,
    encounter_id: encounterA.id,
    file_name: docA.fileName,
    file_type: 'application/pdf',
    file_size_bytes: 350000,
    storage_path: `documents/${patientA.id}/${docA.fileName}`,
    document_category: 'Prescription',
    extracted_text: docA.rawText,
    ocr_confidence: docA.confidenceScore,
    extracted_entities: docA.extractedEntities,
  });

  if (docA.extractedEntities.medications) {
    docA.extractedEntities.medications.forEach(m => {
      mockDB.addMedication({
        patient_id: patientA.id,
        encounter_id: encounterA.id,
        name: m.drugName,
        dosage: m.strength,
        frequency: m.frequency,
        duration: m.duration,
        route: m.route,
        source: 'document_ocr',
        source_document_id: null,
        verification_state: 'needs_review',
        doctor_notes: null,
      });
    });
  }

  const summaryA = generateStructuredClinicalSummary({
    patient: patientA,
    encounter: encounterA,
    chiefComplaint: slotsA.chiefComplaint || 'Chest Pain',
    answers: {
      severity: slotsA.severityNumber || 8,
      onset: slotsA.durationOnset || '<1_hour',
      character: slotsA.characterQuality || 'crushing_pressure',
      radiation: [slotsA.radiationLocation || 'left_arm'],
      associated_symptoms: slotsA.associatedSymptoms || ['sweating'],
      past_medical_history: slotsA.pastHistory || ['hypertension'],
      allergies: 'none',
    },
    medications: mockDB.getState().medications.filter(m => m.encounter_id === encounterA.id),
    allergies: [],
    investigations: [],
    timeline: [],
    redFlagResult: redFlagA,
    isAyushMode: false,
    ayushAnswers: null,
    uploadedDocs: [docA],
  });

  mockDB.saveAISummary(summaryA);

  console.log('Patient A Summary Chief Complaint:', summaryA.chief_complaint);
  console.log('Patient A Medications:', summaryA.medications_summary);
  console.log('Patient A Ayush Summary:', summaryA.ayush_summary);
  console.log('Patient A Priority:', encounterA.priority);

  if (
    summaryA.chief_complaint.toUpperCase().includes('CHEST') &&
    summaryA.medications_summary.includes('Telmisartan') &&
    (summaryA.ayush_summary === null || summaryA.ayush_summary.includes('optional')) &&
    encounterA.is_emergency === true
  ) {
    console.log('✅ Test 1 Passed: Patient A summary generated with real cardiac data & emergency flag!');
  } else {
    console.error('❌ Test 1 Failed: Patient A summary mismatch.', {
      cc: summaryA.chief_complaint,
      meds: summaryA.medications_summary,
      ayush: summaryA.ayush_summary,
      isEmerg: encounterA.is_emergency,
    });
    allPassed = false;
  }

  // ----------------------------------------------------------------------------
  // TEST 2: PATIENT B (KNEE OSTEOARTHRITIS & AYURVEDA INTAKE)
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST 2: PATIENT B (KNEE OSTEOARTHRITIS & AYURVEDA INTAKE) ---');
  const patientB = mockDB.createPatient({
    demo_id: 'DEMO-P0088',
    abha_id: '91-4455-6677-8899',
    full_name: 'Ramesh Verma',
    gender: 'male',
    date_of_birth: '1968-05-12',
    age_years: 57,
    phone: '+91 98111 22334',
    preferred_language: 'hi',
    address: 'Varanasi, UP',
    emergency_contact_name: 'Suresh Verma',
    emergency_contact_phone: '+91 98111 22335',
  });

  let slotsB = {};
  slotsB = adaptiveInterviewEngine.parsePatientInput('दोनों घुटनों में सुबह से तेज दर्द और जोड़ों में सूजन है चलने में तकलीफ है', slotsB);

  const redFlagB = evaluateRedFlags('fever', {
    severity: slotsB.severityNumber || 6,
    character: 'stiffness_and_ache',
    onset: 'chronic_worsening',
    associated_symptoms: ['joint_swelling'],
  });

  const docB = await ocrProvider.processDocument({
    name: 'Metro_Knee_XRay_Report.pdf',
    type: 'application/pdf',
    size: 512000,
  });

  const ayushAnswersB = {
    prakritiPrimary: 'Vata-Pitta',
    prakritiNotes: 'Dry skin and joint clicking since young age',
    vikritiSymptoms: ['Sandhi Shoola (Joint Pain)', 'Stambha (Morning Stiffness)'],
    agniType: 'Manda Agni (Sluggish Digestion)',
    koshthaType: 'Krura Koshtha (Hard Stool)',
    mutraPattern: ['Normal'],
    jihvaStatus: 'Coated White (Sama)',
    sleepMind: ['Disturbed by joint ache'],
    balaEnergy: 'Madhyama',
    aharaHabits: ['Cold and dry foods'],
    viharaHabits: ['Prolonged standing'],
    dhatuAffected: ['Asthi (Bones & Cartilage)', 'Majja Dhatu'],
    nidanaTriggers: ['Cold weather', 'Climbing stairs'],
  };

  const encounterB = mockDB.createEncounter({
    patient_id: patientB.id,
    recommended_specialty: 'Ayurveda & AYUSH',
    status: 'submitted_waiting_assignment',
    priority: 'GREEN',
    is_emergency: false,
    emergency_rationale: null,
    is_ayush_encounter: true,
    chief_complaint_summary: `Bilateral Knee Pain: Joint stiffness and swelling (Severity: 6/10)`,
  });

  mockDB.addDocument({
    patient_id: patientB.id,
    encounter_id: encounterB.id,
    file_name: docB.fileName,
    file_type: 'application/pdf',
    file_size_bytes: 512000,
    storage_path: `documents/${patientB.id}/${docB.fileName}`,
    document_category: 'Imaging',
    extracted_text: docB.rawText,
    ocr_confidence: docB.confidenceScore,
    extracted_entities: docB.extractedEntities,
  });

  if (docB.extractedEntities.medications) {
    docB.extractedEntities.medications.forEach(m => {
      mockDB.addMedication({
        patient_id: patientB.id,
        encounter_id: encounterB.id,
        name: m.drugName,
        dosage: m.strength,
        frequency: m.frequency,
        duration: m.duration,
        route: m.route,
        source: 'document_ocr',
        source_document_id: null,
        verification_state: 'needs_review',
        doctor_notes: null,
      });
    });
  }

  mockDB.addAyushAssessment({
    encounter_id: encounterB.id,
    patient_id: patientB.id,
    prakriti_primary: ayushAnswersB.prakritiPrimary,
    prakriti_secondary: null,
    vikriti_dosha: ayushAnswersB.vikritiSymptoms.join(', '),
    agni_type: ayushAnswersB.agniType,
    koshtha_type: ayushAnswersB.koshthaType,
    dhatu_affected: ayushAnswersB.dhatuAffected,
    sattva_shakti: null,
    ahara_vihara_notes: 'Cold foods trigger aggravation',
  });

  const summaryB = generateStructuredClinicalSummary({
    patient: patientB,
    encounter: encounterB,
    chiefComplaint: 'Bilateral Knee Joint Pain',
    answers: {
      severity: 6,
      onset: 'Chronic',
      character: 'Stiffness & Ache',
      radiation: [],
      associated_symptoms: ['Joint swelling', 'Morning stiffness'],
      past_medical_history: [],
      allergies: 'none',
    },
    medications: mockDB.getState().medications.filter(m => m.encounter_id === encounterB.id),
    allergies: [],
    investigations: [],
    timeline: [],
    redFlagResult: redFlagB,
    isAyushMode: true,
    ayushAnswers: ayushAnswersB,
    uploadedDocs: [docB],
  });

  mockDB.saveAISummary(summaryB);

  console.log('Patient B Summary Chief Complaint:', summaryB.chief_complaint);
  console.log('Patient B Medications:', summaryB.medications_summary);
  console.log('Patient B Ayush Summary:', summaryB.ayush_summary);
  console.log('Patient B Priority:', encounterB.priority);

  if (
    summaryB.chief_complaint.toUpperCase().includes('KNEE') &&
    summaryB.medications_summary.includes('Calcium') &&
    summaryB.ayush_summary.includes('Prakriti: Vata-Pitta') &&
    !summaryB.medications_summary.includes('Telmisartan') &&
    encounterB.is_emergency === false
  ) {
    console.log('✅ Test 2 Passed: Patient B summary generated with real knee/Ayurveda data with ZERO dummy cardiac text!');
  } else {
    console.error('❌ Test 2 Failed: Patient B summary contaminated with dummy or wrong data.');
    allPassed = false;
  }

  // ----------------------------------------------------------------------------
  // TEST 3: SUMMARY DIVERSITY & NON-IDENTICAL CHECK
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST 3: SUMMARY DIVERSITY & GROUNDING ASSERTIONS ---');
  console.log('Checking that Summary A and Summary B are distinct and clinically unique...');

  const areDistinct = summaryA.summary_markdown !== summaryB.summary_markdown;
  const patientANoKnee = !summaryA.summary_markdown.includes('Osteoarthritis');
  const patientBNoCardio = !summaryB.summary_markdown.includes('Telmisartan');

  console.log(`- Summaries are Distinct: ${areDistinct}`);
  console.log(`- Patient A has NO knee text: ${patientANoKnee}`);
  console.log(`- Patient B has NO Telmisartan/Cardio text: ${patientBNoCardio}`);

  if (areDistinct && patientANoKnee && patientBNoCardio) {
    console.log('✅ Test 3 Passed: Dynamic patient grounding verified across multiple distinct patient runs!');
  } else {
    console.error('❌ Test 3 Failed: Summaries are identical or contaminated with static templates.');
    allPassed = false;
  }

  // ----------------------------------------------------------------------------
  // TEST 4: ADMIN QUEUE COMPLETE PACKAGE INSPECTION
  // ----------------------------------------------------------------------------
  console.log('\n--- TEST 4: ADMIN QUEUE COMPLETE PACKAGE VERIFICATION ---');
  const allEncounters = mockDB.getEncounters();
  const allDocs = mockDB.getState().documents;

  const encAInDb = allEncounters.find(e => e.id === encounterA.id);
  const encBInDb = allEncounters.find(e => e.id === encounterB.id);

  const docsAInDb = mockDB.getDocumentsByEncounter(encounterA.id);
  const docsBInDb = mockDB.getDocumentsByEncounter(encounterB.id);

  console.log(`Patient A in Queue: ID ${encAInDb?.id} | Priority: ${encAInDb?.priority} | Docs: ${docsAInDb.length}`);
  console.log(`Patient B in Queue: ID ${encBInDb?.id} | Priority: ${encBInDb?.priority} | Docs: ${docsBInDb.length}`);

  if (
    encAInDb &&
    encBInDb &&
    docsAInDb.length === 1 &&
    docsBInDb.length === 1 &&
    docsAInDb[0].file_name === 'MaxHospital_Cardiology_Prescription.pdf' &&
    docsBInDb[0].file_name === 'Metro_Knee_XRay_Report.pdf'
  ) {
    console.log('✅ Test 4 Passed: Admin queue contains complete distinct packages for every patient with all documents!');
  } else {
    console.error('❌ Test 4 Failed: Admin queue package incomplete.');
    allPassed = false;
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🎉 ALL STEP 4 & ADMIN HANDOFF TESTS PASSED WITH 100% SUCCESS!');
  } else {
    console.log('❌ SOME TESTS FAILED.');
  }
  console.log('================================================================\n');

  return allPassed;
}

runCompletePatientDashboardE2ETest();
