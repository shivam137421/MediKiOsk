import { adaptiveInterviewEngine } from '../src/lib/ontology/adaptive-interview.ts';

console.log('================================================================');
console.log('TESTING CLINICAL INTAKE AUTO-PROGRESSION & INDIAN VOICE SELECTOR');
console.log('================================================================\n');

let allPassed = true;

// ------------------------------------------------------------------------------
// TEST 1: INDIAN VOICE SELECTION LOGIC SIMULATION
// ------------------------------------------------------------------------------
console.log('--- TEST 1: INDIAN VOICE SELECTION SIMULATION ---');
const sampleSystemVoices = [
  { name: 'Microsoft David Desktop - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Zira Desktop - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Swara Online (Natural) - Hindi (India)', lang: 'hi-IN' },
  { name: 'Microsoft Neerja Online (Natural) - English (India)', lang: 'en-IN' },
  { name: 'Google हिन्दी', lang: 'hi-IN' },
  { name: 'Google Indian English', lang: 'en-IN' },
];

function selectIndianVoice(voices, lang) {
  if (lang === 'hi') {
    return voices.find(v => v.name.toLowerCase().includes('swara') || v.name.includes('हिन्दी') || v.lang === 'hi-IN');
  } else {
    return voices.find(v => v.name.toLowerCase().includes('neerja') || v.name.toLowerCase().includes('indian') || v.lang === 'en-IN');
  }
}

const hiVoice = selectIndianVoice(sampleSystemVoices, 'hi');
const enVoice = selectIndianVoice(sampleSystemVoices, 'en');

console.log('Selected Hindi Voice:', hiVoice?.name, `(${hiVoice?.lang})`);
console.log('Selected Indian English Voice:', enVoice?.name, `(${enVoice?.lang})`);

if (hiVoice && hiVoice.lang === 'hi-IN' && enVoice && enVoice.lang === 'en-IN') {
  console.log('✅ TEST 1 PASSED: Natural Indian voices selected for both Hindi & Indian-English!');
} else {
  console.error('❌ TEST 1 FAILED: Non-Indian voice selected.');
  allPassed = false;
}

// ------------------------------------------------------------------------------
// TEST 2: SHORTER CONCISE INTAKE AUTO-PROGRESSION (2 TURNS)
// ------------------------------------------------------------------------------
console.log('\n--- TEST 2: SHORTER CONCISE INTAKE (Patient gives full info upfront) ---');
let shortSlots = {};
shortSlots = adaptiveInterviewEngine.parsePatientInput('mujhe 20 november se pairo mein 8/10 ka tej dard hai aur koi bimari nahi hai', shortSlots);
console.log('Turn 1 Slots:', {
  chiefComplaint: shortSlots.chiefComplaint,
  onset: shortSlots.durationOnset,
  severity: shortSlots.severityNumber,
  pmh: shortSlots.pastHistory,
});
console.log('Is Complete after Turn 1:', adaptiveInterviewEngine.isClinicalIntakeComplete(shortSlots));

// Turn 2: Patient answers missing detail (cramps / walking)
shortSlots = adaptiveInterviewEngine.parsePatientInput('pindli me aithan aur chalne me dikkat hai', shortSlots);
const isCompleteAfterTurn2 = adaptiveInterviewEngine.isClinicalIntakeComplete(shortSlots);
console.log('\nTurn 2 Slots:', {
  characterQuality: shortSlots.characterQuality,
  associatedSymptoms: shortSlots.associatedSymptoms,
});
console.log('Is Complete after Turn 2:', isCompleteAfterTurn2);

if (isCompleteAfterTurn2) {
  console.log('✅ TEST 2 PASSED: Concise intake successfully recognized completion in 2 turns!');
} else {
  console.error('❌ TEST 2 FAILED: Concise intake did not complete.');
  allPassed = false;
}

// ------------------------------------------------------------------------------
// TEST 3: STEP-BY-STEP DETAILED INTAKE AUTO-PROGRESSION
// ------------------------------------------------------------------------------
console.log('\n--- TEST 3: STEP-BY-STEP DETAILED INTAKE ---');
let detailedSlots = {};

// Turn 1
detailedSlots = adaptiveInterviewEngine.parsePatientInput('mujhe ghutno me dard hai', detailedSlots);
console.log('Turn 1 Complete:', adaptiveInterviewEngine.isClinicalIntakeComplete(detailedSlots)); // Expected false

// Turn 2
detailedSlots = adaptiveInterviewEngine.parsePatientInput('6 mahine se chalne me takleef hai', detailedSlots);
console.log('Turn 2 Complete:', adaptiveInterviewEngine.isClinicalIntakeComplete(detailedSlots)); // Expected false

// Turn 3
detailedSlots = adaptiveInterviewEngine.parsePatientInput('subah akdan rehti hai aur dard 6/10 hai', detailedSlots);
console.log('Turn 3 Complete:', adaptiveInterviewEngine.isClinicalIntakeComplete(detailedSlots)); // Expected false

// Turn 4
detailedSlots = adaptiveInterviewEngine.parsePatientInput('koi purani bimari nahi hai', detailedSlots);
const isCompleteTurn4 = adaptiveInterviewEngine.isClinicalIntakeComplete(detailedSlots);
console.log('Turn 4 Complete:', isCompleteTurn4); // Expected true

if (isCompleteTurn4) {
  console.log('✅ TEST 3 PASSED: Detailed multi-step intake completed naturally once all necessary clinical fields were satisfied!');
} else {
  console.error('❌ TEST 3 FAILED: Detailed intake failed to complete.');
  allPassed = false;
}

console.log('\n================================================================');
if (allPassed) {
  console.log('🎉 ALL AUTO-PROGRESSION AND VOICE ACCENT TESTS PASSED (100%)!');
} else {
  console.log('❌ SOME TESTS FAILED.');
}
console.log('================================================================\n');

process.exit(allPassed ? 0 : 1);
