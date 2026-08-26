import { adaptiveInterviewEngine } from '../src/lib/ontology/adaptive-interview.ts';

console.log('================================================================');
console.log('TESTING 5-TURN ADAPTIVE PROGRESSION WITH REAL PATIENT INPUTS');
console.log('================================================================\n');

let slots = {};
const patientTurns = [
  'mujhe pairo mein dard ho rha hai',
  'ek baar udti teer mere pairo mein lg gyi thi',
  '20 november se dard 7 out of 10 hai',
  'pindli me aithan aur chalne me dikkat hai',
  'koi purani bimari ya sugar BP nahi hai',
];

const askedQuestions = [];
let allProgressed = true;

for (let i = 0; i < patientTurns.length; i++) {
  const patientInput = patientTurns[i];
  console.log(`\n[Turn ${i + 1}] Patient: "${patientInput}"`);
  
  const currentTargetSlot = adaptiveInterviewEngine.generateNextQuestion(slots, 'hi').targetSlot;
  slots = adaptiveInterviewEngine.parsePatientInput(patientInput, slots, currentTargetSlot);
  const nextQ = adaptiveInterviewEngine.generateNextQuestion(slots, 'hi', i + 1);
  
  console.log(`AI Doctor Question ${i + 1}: "${nextQ.questionText}"`);

  // Verify that this question was NOT asked previously
  if (askedQuestions.includes(nextQ.questionText)) {
    console.error(`❌ FAILURE: AI repeated the exact same question: "${nextQ.questionText}"`);
    allProgressed = false;
  }
  askedQuestions.push(nextQ.questionText);

  // Verify that no chest-pain hallucinations occur
  if (
    nextQ.questionText.includes('बाएँ हाथ') ||
    nextQ.questionText.includes('छाती') ||
    nextQ.questionText.includes('जबड़े')
  ) {
    console.error(`❌ FAILURE: Unrelated cardiac question detected for leg injury: "${nextQ.questionText}"`);
    allProgressed = false;
  }
}

console.log('\n----------------------------------------------------------------');
console.log('Final Parsed Clinical Slots State:', {
  chiefComplaint: slots.chiefComplaint,
  anatomicalLocation: slots.anatomicalLocation,
  durationOnset: slots.durationOnset,
  characterQuality: slots.characterQuality,
  severityNumber: slots.severityNumber,
  associatedSymptoms: slots.associatedSymptoms,
  pastHistory: slots.pastHistory,
  dimensionsCovered: slots.dimensionsCovered,
  recommendedSpecialty: slots.recommendedSpecialty,
});

if (allProgressed && askedQuestions.length === 5) {
  console.log('\n🎉 ALL 5 CONVERSATION TURNS PROGRESSED NATURALLY WITH ZERO REPETITIONS!');
} else {
  console.error('\n❌ CONVERSATION FAILED TO PROGRESS.');
}
console.log('================================================================\n');
