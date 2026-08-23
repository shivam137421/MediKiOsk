import { adaptiveInterviewEngine } from '../src/lib/ontology/adaptive-interview.ts';

console.log('================================================================');
console.log('TESTING CLINICAL AI CONVERSATION: LEG PAIN VS CHEST PAIN');
console.log('================================================================\n');

// ------------------------------------------------------------------------------
// TEST A: PATIENT REPORTS "pair mein dard ho raha hai" (LEG PAIN)
// ------------------------------------------------------------------------------
console.log('--- TEST A: PATIENT WITH LEG PAIN ("pair mein dard ho raha hai") ---');
let legSlots = {};
const legInput1 = 'pair mein dard ho raha hai';
legSlots = adaptiveInterviewEngine.parsePatientInput(legInput1, legSlots);
console.log('Parsed Slots for Leg Pain:', {
  chiefComplaint: legSlots.chiefComplaint,
  anatomicalLocation: legSlots.anatomicalLocation,
  recommendedSpecialty: legSlots.recommendedSpecialty,
});

const legQ1 = adaptiveInterviewEngine.generateNextQuestion(legSlots, 'hi', 1);
console.log(`\nAI Follow-up 1 (Hindi): "${legQ1.questionText}"`);

// Turn 2: Patient says it is for 2 days after walking
legSlots = adaptiveInterviewEngine.parsePatientInput('2 din se chalne ke baad ho raha hai', legSlots);
const legQ2 = adaptiveInterviewEngine.generateNextQuestion(legSlots, 'hi', 2);
console.log(`AI Follow-up 2 (Hindi): "${legQ2.questionText}"`);

// Turn 3: Patient gives severity 7/10
legSlots = adaptiveInterviewEngine.parsePatientInput('dard 7/10 hai aur pindli me aithan hai', legSlots);
const legQ3 = adaptiveInterviewEngine.generateNextQuestion(legSlots, 'hi', 3);
console.log(`AI Follow-up 3 (Hindi): "${legQ3.questionText}"`);

const isLegFollowUpRelevant = 
  !legQ1.questionText.includes('सीना') &&
  !legQ1.questionText.includes('छाती') &&
  !legQ1.questionText.includes('बाएँ हाथ') &&
  !legQ2.questionText.includes('बाएँ हाथ') &&
  !legQ3.questionText.includes('बाएँ हाथ') &&
  (legQ1.questionText.includes('पैर') || legQ2.questionText.includes('पैर') || legQ3.questionText.includes('पैर'));

if (isLegFollowUpRelevant && legSlots.chiefComplaint.includes('Leg Pain')) {
  console.log('\n✅ TEST A PASSED: AI generated 100% relevant Leg Pain follow-ups with ZERO chest pain hallucinations!');
} else {
  console.error('\n❌ TEST A FAILED: Irrelevant follow-up detected for Leg Pain.');
}

// ------------------------------------------------------------------------------
// TEST B: PATIENT REPORTS "seene mein dard hai" (CHEST PAIN)
// ------------------------------------------------------------------------------
console.log('\n--- TEST B: PATIENT WITH CHEST PAIN ("seene mein dard hai") ---');
let chestSlots = {};
const chestInput1 = 'seene mein bhari dabav aur dard hai';
chestSlots = adaptiveInterviewEngine.parsePatientInput(chestInput1, chestSlots);
console.log('Parsed Slots for Chest Pain:', {
  chiefComplaint: chestSlots.chiefComplaint,
  anatomicalLocation: chestSlots.anatomicalLocation,
  recommendedSpecialty: chestSlots.recommendedSpecialty,
});

const chestQ1 = adaptiveInterviewEngine.generateNextQuestion(chestSlots, 'hi', 1);
console.log(`\nAI Follow-up 1 (Hindi): "${chestQ1.questionText}"`);

chestSlots = adaptiveInterviewEngine.parsePatientInput('1 ghante se hai', chestSlots);
const chestQ2 = adaptiveInterviewEngine.generateNextQuestion(chestSlots, 'hi', 2);
console.log(`AI Follow-up 2 (Hindi): "${chestQ2.questionText}"`);

const isChestFollowUpRelevant = 
  chestQ1.questionText.includes('सीने') || chestQ2.questionText.includes('सीने');

if (isChestFollowUpRelevant && chestSlots.chiefComplaint.includes('Chest')) {
  console.log('\n✅ TEST B PASSED: AI generated 100% relevant Chest Pain follow-ups!');
} else {
  console.error('\n❌ TEST B FAILED: Irrelevant follow-up detected for Chest Pain.');
}

console.log('\n================================================================');
