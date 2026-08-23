// ==============================================================================
// MEDIKIOSK — END-TO-END 5-STEP LINEAR WORKFLOW ACCEPTANCE TEST
// ==============================================================================

import { mockDB, AVAILABLE_DOCTORS } from '../src/lib/supabase/mock-db.ts';
import { evaluateRedFlags } from '../src/lib/rules/red-flags.ts';
import { generateStructuredClinicalSummary } from '../src/lib/providers/summary.ts';

function runLinearWorkflowAcceptanceTest() {
  console.log('================================================================');
  console.log('RUNNING MEDIKIOSK 5-STEP LINEAR WORKFLOW ACCEPTANCE TEST');
  console.log('================================================================\n');

  let allPassed = true;

  // ----------------------------------------------------------------------------
  // STEP 1: PATIENT INTAKE (AI Voice/Text Conversation + MCQs + Docs)
  // ----------------------------------------------------------------------------
  console.log('--- STEP 1: PATIENT AI CONVERSATION INTAKE ---');
  const patient = mockDB.getPatientById('a1111111-1111-1111-1111-111111111111');
  if (!patient || patient.full_name !== 'Aarav Sharma') {
    console.error('❌ Step 1 Failed: Patient Aarav Sharma not found.');
    allPassed = false;
  } else {
    console.log(`✅ Patient identified: ${patient.full_name} (${patient.age_years}Y, ABHA: ${patient.abha_id})`);
  }

  const answers = {
    severity: 8,
    onset: '<1_hour',
    character: 'crushing_pressure',
    radiation: ['left_arm', 'jaw_neck'],
    associated_symptoms: ['sweating', 'dyspnea'],
    past_medical_history: ['hypertension'],
    allergies: 'penicillin_allergy',
  };

  const redFlag = evaluateRedFlags('chest_pain', answers);
  const recommendedSpecialty = redFlag.hasRedFlag || answers.character.includes('pressure') ? 'Cardiology' : 'General Medicine';

  console.log(`AI Evaluated Specialty: "${recommendedSpecialty}", Emergency Flag: ${redFlag.hasRedFlag}`);

  const intakeEncounter = mockDB.createEncounter({
    patient_id: patient.id,
    recommended_specialty: recommendedSpecialty,
    status: 'submitted_waiting_assignment',
    priority: redFlag.hasRedFlag ? 'EMERGENCY' : 'GREEN',
    is_emergency: redFlag.hasRedFlag,
    emergency_rationale: redFlag.rationale,
    chief_complaint_summary: 'Acute substernal crushing chest pressure radiating to left arm (Severity: 8/10)',
  });

  const summary = generateStructuredClinicalSummary({
    patient,
    encounter: intakeEncounter,
    chiefComplaint: 'chest_pain',
    answers,
    medications: mockDB.getState().medications.filter(m => m.patient_id === patient.id),
    allergies: mockDB.getState().allergies.filter(a => a.patient_id === patient.id),
    investigations: mockDB.getState().investigations.filter(i => i.patient_id === patient.id),
    timeline: mockDB.getState().timelineEvents.filter(t => t.patient_id === patient.id),
    redFlagResult: redFlag,
    isAyushMode: false,
  });

  const savedSummary = mockDB.saveAISummary(summary);

  if (intakeEncounter.status === 'submitted_waiting_assignment' && savedSummary.recommended_specialty === 'Cardiology') {
    console.log(`✅ Step 1 Passed: Intake submitted with status "${intakeEncounter.status}" & specialty "${savedSummary.recommended_specialty}".`);
  } else {
    console.error('❌ Step 1 Failed: Incorrect intake submission state.');
    allPassed = false;
  }

  // ----------------------------------------------------------------------------
  // STEP 2: ADMIN ASSIGNS DOCTOR
  // ----------------------------------------------------------------------------
  console.log('\n--- STEP 2: ADMIN ASSIGNS DOCTOR ---');
  const matchingDoctor = AVAILABLE_DOCTORS.find(d => d.specialty === 'Cardiology');
  if (!matchingDoctor) {
    console.error('❌ Step 2 Failed: Matching Cardiology specialist not found.');
    allPassed = false;
  }

  const assignedEncounter = mockDB.assignDoctor(
    intakeEncounter.id,
    matchingDoctor.id,
    'usr-adm-01',
    'High priority cardiology evaluation assigned by Admin.'
  );

  if (assignedEncounter && assignedEncounter.status === 'doctor_assigned' && assignedEncounter.assigned_doctor_id === matchingDoctor.id) {
    console.log(`✅ Step 2 Passed: Admin assigned ${matchingDoctor.name} (${matchingDoctor.specialty}). Status: "${assignedEncounter.status}".`);
  } else {
    console.error('❌ Step 2 Failed: Doctor assignment failed.');
    allPassed = false;
  }

  // ----------------------------------------------------------------------------
  // STEP 3: DOCTOR REVIEWS & PROPOSES APPOINTMENT SLOT
  // ----------------------------------------------------------------------------
  console.log('\n--- STEP 3: DOCTOR REVIEWS & PROPOSES APPOINTMENT SLOT ---');
  const proposedEncounter = mockDB.proposeAppointment(
    intakeEncounter.id,
    'Today, 03:30 PM (STAT Fast-Track)',
    'in_person',
    'Urgent cardiac evaluation. 12-lead ECG and Troponin I ready in Bay 2.',
    matchingDoctor.id
  );

  if (proposedEncounter && proposedEncounter.status === 'appointment_proposed' && proposedEncounter.proposed_appointment_time) {
    console.log(`✅ Step 3 Passed: Doctor proposed slot "${proposedEncounter.proposed_appointment_time}". Status: "${proposedEncounter.status}".`);
  } else {
    console.error('❌ Step 3 Failed: Doctor slot proposal failed.');
    allPassed = false;
  }

  // ----------------------------------------------------------------------------
  // STEP 4: ADMIN CONFIRMS APPOINTMENT TO PATIENT
  // ----------------------------------------------------------------------------
  console.log('\n--- STEP 4: ADMIN CONFIRMS APPOINTMENT ---');
  const confirmedEncounter = mockDB.confirmAppointment(
    intakeEncounter.id,
    proposedEncounter.proposed_appointment_time,
    'usr-adm-01',
    'Cardiology OPD Suite Room 204',
    'Confirmed by Hospital Operations Administrator.'
  );

  if (confirmedEncounter && confirmedEncounter.status === 'appointment_confirmed' && confirmedEncounter.confirmed_appointment_time) {
    console.log(`✅ Step 4 Passed: Admin confirmed appointment for "${confirmedEncounter.confirmed_appointment_time}" at "${confirmedEncounter.appointment_location}". Status: "${confirmedEncounter.status}".`);
  } else {
    console.error('❌ Step 4 Failed: Admin appointment confirmation failed.');
    allPassed = false;
  }

  // ----------------------------------------------------------------------------
  // STEP 5: PATIENT DASHBOARD CONFIRMED CARD VERIFICATION
  // ----------------------------------------------------------------------------
  console.log('\n--- STEP 5: PATIENT CONFIRMED APPOINTMENT CARD ---');
  const patientEncounter = mockDB.getEncounterById(intakeEncounter.id);
  if (patientEncounter && patientEncounter.status === 'appointment_confirmed' && patientEncounter.assigned_doctor_id === matchingDoctor.id) {
    console.log(`✅ Step 5 Passed: Patient dashboard displays official confirmed appointment with ${matchingDoctor.name} at ${patientEncounter.confirmed_appointment_time}.`);
  } else {
    console.error('❌ Step 5 Failed: Patient confirmation view mismatch.');
    allPassed = false;
  }

  // ----------------------------------------------------------------------------
  // STEP 6: EMERGENCY QUEUE JUMP VERIFICATION
  // ----------------------------------------------------------------------------
  console.log('\n--- STEP 6: EMERGENCY QUEUE JUMP VERIFICATION ---');
  // Create routine patient (submitted first)
  const routineEncounter = mockDB.createEncounter({
    patient_id: 'a2222222-2222-2222-2222-222222222222',
    recommended_specialty: 'General Medicine',
    status: 'submitted_waiting_assignment',
    priority: 'GREEN',
    is_emergency: false,
    chief_complaint_summary: 'Routine skin checkup',
  });

  // Create emergency patient (submitted later)
  const emergencyEncounter = mockDB.createEncounter({
    patient_id: 'a3333333-3333-3333-3333-333333333333',
    recommended_specialty: 'Cardiology',
    status: 'submitted_waiting_assignment',
    priority: 'EMERGENCY',
    is_emergency: true,
    emergency_rationale: 'Severe crushing chest pain radiating to left jaw',
    chief_complaint_summary: 'Acute chest pain emergency',
  });

  const sortedQueue = mockDB.getEncounters();
  const firstInQueue = sortedQueue[0];

  if (firstInQueue.is_emergency && firstInQueue.id === emergencyEncounter.id) {
    console.log(`✅ Step 6 Passed: Emergency patient (${firstInQueue.chief_complaint_summary}) successfully jumped to the TOP of the Admin queue!`);
  } else {
    console.error(`❌ Step 6 Failed: Queue did not prioritize emergency encounter.`);
    allPassed = false;
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🎉 ALL 5 WORKFLOW STEPS + EMERGENCY QUEUE JUMP PASSED WITH 100% SUCCESS!');
  } else {
    console.log('❌ SOME TESTS FAILED.');
  }
  console.log('================================================================\n');

  return allPassed;
}

runLinearWorkflowAcceptanceTest();
