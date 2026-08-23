import { adaptiveInterviewEngine } from '../src/lib/ontology/adaptive-interview.ts';

console.log('================================================================');
console.log('STRICT INFORMATION-GAP TEST: NEVER ASK FOR ALREADY KNOWN DATA');
console.log('================================================================\n');

let allPassed = true;

// ------------------------------------------------------------------------------
// TEST 1: VOLUNTARY MULTI-SLOT INPUT UPFRONT
// Patient provides: Chief Complaint + Onset + Severity + PMH in a single statement!
// ------------------------------------------------------------------------------
console.log('--- TEST 1: VOLUNTARY MULTI-SLOT UPFRONT STATEMENT ---');
let upfrontSlots = {};
const upfrontInput = 'mujhe pairo mein 20 november se 8/10 ka tej dard hai aur koi purani bimari nahi hai';
console.log(`Patient Statement: "${upfrontInput}"`);

upfrontSlots = adaptiveInterviewEngine.parsePatientInput(upfrontInput, upfrontSlots);
console.log('\nExtracted Slots:', {
  chiefComplaint: upfrontSlots.chiefComplaint,
  durationOnset: upfrontSlots.durationOnset,
  characterQuality: upfrontSlots.characterQuality,
  severityNumber: upfrontSlots.severityNumber,
  pastHistory: upfrontSlots.pastHistory,
});

const nextQ1 = adaptiveInterviewEngine.generateNextQuestion(upfrontSlots, 'hi');
console.log(`\nAI Question: "${nextQ1.questionText}" (Targeting Gap: ${nextQ1.targetSlot})`);

// ASSERTIONS:
// 1. Must NOT ask about Onset (since "20 november se" is known)
// 2. Must NOT ask about Severity (since "8/10" is known)
// 3. Must NOT ask about PMH (since "koi purani bimari nahi hai" is known)
// 4. MUST target characterQuality (which is the actual missing gap!)
const askedAboutOnset = nextQ1.questionText.includes('कब से') || nextQ1.questionText.includes('शुरू हुआ');
const askedAboutSeverity = nextQ1.questionText.includes('1 से 10') || nextQ1.questionText.includes('तीव्रता');
const askedAboutPMH = nextQ1.questionText.includes('डायबिटीज') || nextQ1.questionText.includes('बीपी') || nextQ1.questionText.includes('पुरानी');
const isTargetingMissingGap = nextQ1.targetSlot === 'characterQuality';

if (!askedAboutOnset && !askedAboutSeverity && !askedAboutPMH && isTargetingMissingGap) {
  console.log('✅ TEST 1 PASSED: AI intelligently skipped all known slots (Onset, Severity, PMH) and targeted the exact missing information gap (characterQuality)!');
} else {
  console.error('❌ TEST 1 FAILED: AI asked for redundant information already provided upfront.', {
    askedAboutOnset,
    askedAboutSeverity,
    askedAboutPMH,
    isTargetingMissingGap,
  });
  allPassed = false;
}

// ------------------------------------------------------------------------------
// TEST 2: STEP-BY-STEP MULTI-TURN CONVERSATION WITH SMART GAP ADVANCEMENT
// ------------------------------------------------------------------------------
console.log('\n--- TEST 2: STEP-BY-STEP MULTI-TURN DIALOGUE ---');
let stepSlots = {};

// Turn 1: Patient only mentions leg pain
console.log('\n[Turn 1] Patient: "mujhe pairo mein dard ho rha hai"');
stepSlots = adaptiveInterviewEngine.parsePatientInput('mujhe pairo mein dard ho rha hai', stepSlots);
const qTurn1 = adaptiveInterviewEngine.generateNextQuestion(stepSlots, 'hi');
console.log(`AI Q1 (Target: ${qTurn1.targetSlot}): "${qTurn1.questionText}"`);
if (qTurn1.targetSlot !== 'durationOnset') {
  console.error('❌ Turn 1 Expected to target durationOnset, got:', qTurn1.targetSlot);
  allPassed = false;
}

// Turn 2: Patient answers onset ("ek baar udti teer mere pairo mein lg gyi thi")
console.log('\n[Turn 2] Patient: "ek baar udti teer mere pairo mein lg gyi thi"');
stepSlots = adaptiveInterviewEngine.parsePatientInput('ek baar udti teer mere pairo mein lg gyi thi', stepSlots);
const qTurn2 = adaptiveInterviewEngine.generateNextQuestion(stepSlots, 'hi');
console.log(`AI Q2 (Target: ${qTurn2.targetSlot}): "${qTurn2.questionText}"`);
if (qTurn2.targetSlot !== 'characterQuality') {
  console.error('❌ Turn 2 Expected to target characterQuality, got:', qTurn2.targetSlot);
  allPassed = false;
}

// Turn 3: Patient answers BOTH character AND severity ("pindli me aithan aur dard 7 out of 10 hai")
console.log('\n[Turn 3] Patient: "pindli me aithan aur dard 7 out of 10 hai"');
stepSlots = adaptiveInterviewEngine.parsePatientInput('pindli me aithan aur dard 7 out of 10 hai', stepSlots);
const qTurn3 = adaptiveInterviewEngine.generateNextQuestion(stepSlots, 'hi');
console.log(`AI Q3 (Target: ${qTurn3.targetSlot}): "${qTurn3.questionText}"`);
// Because Severity (7/10) was provided in this turn along with Character, AI MUST NOT ask for Severity!
// It must jump directly to Radiation / Swelling!
if (qTurn3.targetSlot === 'radiationLocation') {
  console.log('✅ Turn 3 Verified: Because patient voluntarily gave severity (7/10), AI skipped severity question and jumped directly to radiation/swelling!');
} else {
  console.error('❌ Turn 3 FAILED: AI did not skip severity question despite severity being supplied.', qTurn3);
  allPassed = false;
}

// Turn 4: Patient answers radiation & swelling ("kamar se niche pair me failta hai aur sujan hai")
console.log('\n[Turn 4] Patient: "kamar se niche pair me failta hai aur sujan hai"');
stepSlots = adaptiveInterviewEngine.parsePatientInput('kamar se niche pair me failta hai aur sujan hai', stepSlots);
const qTurn4 = adaptiveInterviewEngine.generateNextQuestion(stepSlots, 'hi');
console.log(`AI Q4 (Target: ${qTurn4.targetSlot}): "${qTurn4.questionText}"`);
if (qTurn4.targetSlot !== 'pastHistory') {
  console.error('❌ Turn 4 Expected to target pastHistory, got:', qTurn4.targetSlot);
  allPassed = false;
}

// Turn 5: Patient answers medical history ("koi purani bimari nahi hai")
console.log('\n[Turn 5] Patient: "koi purani bimari ya sugar BP nahi hai"');
stepSlots = adaptiveInterviewEngine.parsePatientInput('koi purani bimari ya sugar BP nahi hai', stepSlots);
const qTurn5 = adaptiveInterviewEngine.generateNextQuestion(stepSlots, 'hi');
console.log(`AI Q5 (Target: ${qTurn5.targetSlot}): "${qTurn5.questionText}"`);
if (qTurn5.targetSlot === 'completed' && qTurn5.isReadyForStep2) {
  console.log('✅ Turn 5 Verified: All clinical information gaps satisfied. AI concluded interview ready for Step 2!');
} else {
  console.error('❌ Turn 5 FAILED: AI did not conclude interview when all slots were filled.', qTurn5);
  allPassed = false;
}

console.log('\n================================================================');
if (allPassed) {
  console.log('🎉 ALL INFORMATION-GAP ADAPTIVE TESTS PASSED WITH 100% SUCCESS!');
} else {
  console.log('❌ INFORMATION GAP TESTS FAILED.');
}
console.log('================================================================\n');

process.exit(allPassed ? 0 : 1);
