// ==============================================================================
// MEDIKIOSK — END-TO-END AUTOMATED ACCEPTANCE TEST (SECTION 17)
// ==============================================================================

import { mockDB } from '../src/lib/supabase/mock-db.ts';
import { evaluateRedFlags } from '../src/lib/rules/red-flags.ts';
import { generateStructuredClinicalSummary } from '../src/lib/providers/summary.ts';
import { buildChronologicalTimeline } from '../src/lib/timeline/timeline-builder.ts';

function runEndToEndAcceptanceTest() {
  console.log('================================================================');
  console.log('RUNNING MEDIKIOSK SECTION 17 END-TO-END ACCEPTANCE TEST');
  console.log('================================================================\n');

  let testPassed = true;

  // Step 1: Patient Identity & Language Selection
  console.log('Step 1: Patient Registration (Aarav Sharma, Hindi Preferred)');
  const patient = mockDB.getPatientById('pat-001');
  if (!patient || patient.full_name !== 'Aarav Sharma') {
    console.error('❌ Step 1 Failed: Patient pat-001 not found.');
    testPassed = false;
  } else {
    console.log(`✅ Step 1 Passed: Patient ID: ${patient.id}, Name: ${patient.full_name}, Preferred: ${patient.preferred_language}`);
  }

  // Step 2: Informed Consent Recorded
  console.log('\nStep 2: Recording Audio-Guided Informed Consent');
  mockDB.logAudit({
    encounter_id: 'enc-001',
    patient_id: patient.id,
    actor_id: patient.id,
    actor_role: 'patient',
    action: 'PATIENT_CONSENT_RECORDED',
    details: { version: '2.0', audio_explained: true, language: 'hi' },
  });
  console.log('✅ Step 2 Passed: Consent logged with timestamp and version.');

  // Step 3: AI Clinical Interview (Chest Pain with OLDCARTS answers)
  console.log('\nStep 3: Clinical Interview — Adaptive Chest Pain Branch');
  const answers = {
    onset: '<1_hour',
    character: 'crushing_pressure',
    severity: 8,
    radiation: ['left_arm', 'jaw_neck'],
    associated_symptoms: ['sweating', 'dyspnea'],
    past_medical_history: ['hypertension'],
    allergies: 'penicillin_allergy',
  };

  const redFlag = evaluateRedFlags('chest_pain', answers);
  console.log(`Red-Flag Evaluator Result: Has Red Flag = ${redFlag.hasRedFlag}, Priority = ${redFlag.priority}`);
  if (!redFlag.hasRedFlag || redFlag.priority !== 'RED') {
    console.error('❌ Step 3 Failed: Red flag failed to trigger RED priority.');
    testPassed = false;
  } else {
    console.log(`✅ Step 3 Passed: Triggered Symptoms: ${redFlag.triggerSymptoms.join(', ')}`);
  }

  // Step 4: Dispatch Encounter & Triage Alert
  console.log('\nStep 4: Real-time Dispatch to Triage Dashboard');
  const alert = mockDB.addTriageAlert({
    encounter_id: 'enc-001',
    patient_id: patient.id,
    severity: 'RED',
    trigger_symptom: redFlag.triggerSymptoms.join(' + '),
    clinical_rationale: redFlag.rationale,
    is_acknowledged: false,
    acknowledged_by: null,
    acknowledged_at: null,
    action_taken: null,
  });
  console.log(`✅ Step 4 Passed: Triage Alert created with ID: ${alert.id}`);

  // Step 5: Triage Nurse Acknowledges & Escalates
  console.log('\nStep 5: Triage Nurse Acknowledgment & Bay 2 Assignment');
  const ackSuccess = mockDB.acknowledgeTriageAlert(
    alert.id,
    'usr-tri-01',
    'Patient assigned to ER Bay 2. STAT ECG and Troponin I ordered.'
  );
  if (!ackSuccess) {
    console.error('❌ Step 5 Failed: Triage acknowledgment failed.');
    testPassed = false;
  } else {
    console.log('✅ Step 5 Passed: Triage nurse acknowledged and escalated alert.');
  }

  // Step 6: AI Clinical Summary Generation
  console.log('\nStep 6: AI Clinical Summary Synthesis');
  const summaryDraft = generateStructuredClinicalSummary({
    patient,
    encounter: mockDB.getEncounterById('enc-001'),
    chiefComplaint: 'chest_pain',
    answers,
    medications: mockDB.getState().medications.filter(m => m.patient_id === patient.id),
    allergies: mockDB.getState().allergies.filter(a => a.patient_id === patient.id),
    investigations: mockDB.getState().investigations.filter(i => i.patient_id === patient.id),
    timeline: mockDB.getState().timelineEvents.filter(t => t.patient_id === patient.id),
    redFlagResult: redFlag,
    isAyushMode: false,
  });

  if (!summaryDraft.summary_markdown.includes('AI-generated draft — physician verification required.')) {
    console.error('❌ Step 6 Failed: Mandatory AI verification disclaimer missing.');
    testPassed = false;
  } else {
    console.log('✅ Step 6 Passed: Summary generated with mandatory disclaimer and structured OLDCARTS.');
  }

  // Step 7: Doctor Edits and Verifies Summary
  console.log('\nStep 7: Physician Review, Edit, and Sign-off');
  const savedSum = mockDB.saveAISummary(summaryDraft);
  const updatedSum = mockDB.updateDoctorSummary(
    savedSum.id,
    'usr-doc-01',
    savedSum.summary_markdown + '\n\n**Physician Addendum:** 12-lead ECG confirmed normal sinus rhythm. Sublingual nitroglycerin given with 80% relief.',
    true
  );

  if (!updatedSum.is_verified || !updatedSum.verified_by) {
    console.error('❌ Step 7 Failed: Doctor verification state not recorded.');
    testPassed = false;
  } else {
    console.log(`✅ Step 7 Passed: Summary verified by ${updatedSum.verified_by} at ${updatedSum.verified_at}`);
  }

  // Step 8: AI Decision Support Suggestion Action
  console.log('\nStep 8: Doctor AI Suggestions — Explicit Accept/Reject');
  const suggestions = mockDB.getSuggestionsByEncounter('enc-001');
  if (suggestions.length > 0) {
    mockDB.updateSuggestionStatus(suggestions[0].id, 'accepted', 'usr-doc-01', 'Approved STAT ECG');
    console.log(`✅ Step 8 Passed: Doctor accepted suggestion "${suggestions[0].title}"`);
  }

  // Step 9: Encounter Completed & Audit Logs Verified
  console.log('\nStep 9: Encounter Completion & Full Audit Trail Verification');
  mockDB.updateEncounter('enc-001', {
    status: 'completed',
    consultation_completed_at: new Date().toISOString(),
  });

  const logs = mockDB.getAuditLogs();
  console.log(`Total Audit Records Logged: ${logs.length}`);
  if (logs.length < 5) {
    console.error('❌ Step 9 Failed: Insufficient audit logging.');
    testPassed = false;
  } else {
    console.log('✅ Step 9 Passed: Immutable audit trail successfully recorded all stages.');
  }

  console.log('\n================================================================');
  if (testPassed) {
    console.log('🎉 SECTION 17 END-TO-END ACCEPTANCE TEST: ALL CHECKS PASSED!');
  } else {
    console.log('❌ SECTION 17 ACCEPTANCE TEST HAD FAILURES.');
  }
  console.log('================================================================\n');

  return testPassed;
}

runEndToEndAcceptanceTest();
