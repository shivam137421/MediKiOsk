import { adaptiveInterviewEngine } from '../src/lib/ontology/adaptive-interview.ts';

console.log('================================================================');
console.log('TESTING COMPLETE AUTO-NAVIGATION TRIGGER & DATA PERSISTENCE');
console.log('================================================================\n');

let allPassed = true;

// ------------------------------------------------------------------------------
// TEST 1: CLOSING STATEMENT DETECTION
// ------------------------------------------------------------------------------
console.log('--- TEST 1: CLOSING STATEMENT RECOGNITION ---');
const sampleClosingResponses = [
  'धन्यवाद, आपके लक्षणों और चिकित्सीय इतिहास का पूर्ण रिकॉर्ड तैयार कर लिया गया है। अब अगले चरण (आयुर्वेद एवं जीवनशैली परीक्षा) पर आगे बढ़ते हैं।',
  'Thank you, your symptoms have been noted. Proceeding to Step 2 for Ayurvedic Assessment.',
  'आपके सभी लक्षण दर्ज कर लिए गए हैं। अब चरण 2 परीक्षा देखते हैं।',
];

const nonClosingResponses = [
  'पैरों में यह दर्द कब से हो रहा है?',
  'What type of pain is it in your chest?',
  '1 से 10 के पैमाने पर दर्द कितना है?',
];

for (const text of sampleClosingResponses) {
  const isClosing = adaptiveInterviewEngine.isClosingStatement(text);
  console.log(`Checking: "${text.slice(0, 50)}..." -> isClosing: ${isClosing}`);
  if (!isClosing) {
    console.error('❌ Failed to detect closing phrase:', text);
    allPassed = false;
  }
}

for (const text of nonClosingResponses) {
  const isClosing = adaptiveInterviewEngine.isClosingStatement(text);
  if (isClosing) {
    console.error('❌ False positive closing phrase detected for open question:', text);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('✅ TEST 1 PASSED: Closing statements reliably recognized without false positives!');
}

// ------------------------------------------------------------------------------
// TEST 2: MULTI-TURN NAVIGATION SIMULATION & STATE CARRIED TO STEP 2
// ------------------------------------------------------------------------------
console.log('\n--- TEST 2: NAVIGATION TRIGGER & DATA RETENTION ---');
let slots = {};
let activeStep = 'talk';

function simulatePatientTurn(patientInput) {
  slots = adaptiveInterviewEngine.parsePatientInput(patientInput, slots);
  const nextQ = adaptiveInterviewEngine.generateNextQuestion(slots, 'hi');
  const isComplete = adaptiveInterviewEngine.isClinicalIntakeComplete(slots) || adaptiveInterviewEngine.isClosingStatement(nextQ.questionText);
  
  if (isComplete) {
    activeStep = 'ayush'; // Auto-navigate to Step 2
  }
  return { nextQ, isComplete };
}

// Turn 1
simulatePatientTurn('mujhe pairo mein 20 november se dard ho raha hai');
console.log('Turn 1 Active Step:', activeStep); // Expected: talk

// Turn 2
simulatePatientTurn('pindli me aithan aur dard 8/10 hai, chalne me dikkat hai');
console.log('Turn 2 Active Step:', activeStep); // Expected: talk

// Turn 3
simulatePatientTurn('koi purani bimari nahi hai');
console.log('Turn 3 Active Step:', activeStep); // Expected: ayush (Navigated!)

if (activeStep === 'ayush' && slots.chiefComplaint && slots.durationOnset && slots.severityNumber === 8) {
  console.log('✅ TEST 2 PASSED: Auto-navigated to Step 2 ("ayush") and retained all clinical slots:', {
    chiefComplaint: slots.chiefComplaint,
    durationOnset: slots.durationOnset,
    severityNumber: slots.severityNumber,
    pastHistory: slots.pastHistory,
  });
} else {
  console.error('❌ TEST 2 FAILED: Navigation did not trigger or slots were lost.', { activeStep, slots });
  allPassed = false;
}

console.log('\n================================================================');
if (allPassed) {
  console.log('🎉 ALL AUTO-NAVIGATION TESTS PASSED WITH 100% SUCCESS!');
} else {
  console.log('❌ AUTO-NAVIGATION TEST SUITE FAILED.');
}
console.log('================================================================\n');

process.exit(allPassed ? 0 : 1);
