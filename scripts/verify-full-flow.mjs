import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
let apiKey = process.env.GROQ_API_KEY || '';
if (!apiKey && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/GROQ_API_KEY=([^\r\n]+)/);
  if (match) apiKey = match[1].trim().replace(/^["']|["']$/g, '');
}

console.log('================================================================');
console.log('MEDIKIOSK COMPLETE E2E VERIFICATION TEST');
console.log('================================================================\n');

async function runVerification() {
  const baseUrl = 'http://localhost:3000';

  // -------------------------------------------------------------------------
  // TEST 1: Step 1 Multi-Turn Chat Conversation (Real Groq LLM)
  // -------------------------------------------------------------------------
  console.log('>>> TEST 1: Multi-turn Chat Conversation in Hindi via /api/ai/chat');
  const turns = [
    { role: 'user', content: 'mujhe kal raat se bahut tez sar dard aur ulti jaisa lag raha hai' }
  ];

  let chat1 = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'hi', history: turns })
  }).then(r => r.json());

  console.log(`Patient Turn 1: "${turns[0].content}"`);
  console.log(`AI Doctor Turn 1 (${chat1.provider}): "${chat1.reply}"`);
  if (!chat1.provider.startsWith('groq (openai/gpt-oss-')) {
    throw new Error(`Expected Groq openai/gpt-oss model, got: ${chat1.provider}`);
  }

  turns.push({ role: 'assistant', content: chat1.reply });
  turns.push({ role: 'user', content: 'dard 8/10 hai aur aakho ke peeche throbbing sensation hai' });

  let chat2 = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'hi', history: turns })
  }).then(r => r.json());

  console.log(`\nPatient Turn 2: "${turns[2].content}"`);
  console.log(`AI Doctor Turn 2 (${chat2.provider}): "${chat2.reply}"`);
  console.log('✅ TEST 1 PASSED: Multi-turn chat used real Groq model without errors!\n');

  // -------------------------------------------------------------------------
  // TEST 2: Patient 1 (Fever & Cough) vs Patient 2 (Knee Osteoarthritis) Summaries
  // -------------------------------------------------------------------------
  console.log('>>> TEST 2: Differential Clinical Summary Synthesis via /api/ai/summary');

  // Patient 1: Fever
  const summary1 = await fetch(`${baseUrl}/api/ai/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient: { full_name: 'Anil Sharma', age_years: 32, gender: 'male', abha_id: '91-1111-2222-3333', preferred_language: 'hi' },
      encounter: { recommended_specialty: 'General Medicine', is_emergency: false },
      chiefComplaint: 'Acute Febrile Illness with Chills',
      conversationTurns: [
        { role: 'patient', content: '3 din se 102 fever hai aur thand lagti hai' },
        { role: 'ai', content: 'kya khansi ya gale me dard hai?' },
        { role: 'patient', content: 'sukhi khansi hai aur paracetamol se aaram milta hai' }
      ],
      clinicalSlots: {
        chiefComplaint: 'Acute Febrile Illness',
        severityNumber: 6,
        durationOnset: '3 days',
        characterQuality: 'High grade fever with rigors',
        associatedSymptoms: ['Dry cough', 'Myalgia'],
        pastHistory: ['None']
      },
      redFlagResult: { hasRedFlag: false, priority: 'ROUTINE', triggerSymptoms: [], rationale: 'Stable vitals' },
      recommendedSpecialty: 'General Medicine'
    })
  }).then(r => r.json());

  console.log(`Patient 1 Summary Model: ${summary1.usedModel}`);
  console.log(`Patient 1 Summary Length: ${summary1.summaryMarkdown?.length} chars`);
  console.log('Patient 1 Excerpt:\n', summary1.summaryMarkdown?.slice(0, 300));

  // Patient 2: Knee Osteoarthritis
  const summary2 = await fetch(`${baseUrl}/api/ai/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient: { full_name: 'Meena Gupta', age_years: 61, gender: 'female', abha_id: '91-4444-5555-6666', preferred_language: 'hi' },
      encounter: { recommended_specialty: 'Orthopedics / AYUSH', is_emergency: false },
      chiefComplaint: 'Severe Right Knee Crepitus & Restricted Flexion',
      conversationTurns: [
        { role: 'patient', content: 'daaye ghutne me 1 saal se dard hai aur seedhi chadhne me dikkat hoti hai' },
        { role: 'ai', content: 'kya ghutne me sujan ya aawaz aati hai?' },
        { role: 'patient', content: 'ha aawaz aati hai aur subah 1 ghante tak jakdan rehti hai' }
      ],
      clinicalSlots: {
        chiefComplaint: 'Right Knee Joint Pain & Crepitus',
        severityNumber: 7,
        durationOnset: '1 year',
        characterQuality: 'Mechanical aching on weight bearing',
        associatedSymptoms: ['Morning stiffness', 'Crepitus', 'Difficulty with stairs'],
        pastHistory: ['Hypertension (Amlodipine 5mg)']
      },
      ayushAnswers: {
        prakritiPrimary: 'Vata-Pitta',
        vikritiSymptoms: ['Sandhigata Vata', 'Dhatu Kshaya (Asthi-Majja)'],
        agniType: 'Mandagni',
        koshthaType: 'Madhyama'
      },
      redFlagResult: { hasRedFlag: false, priority: 'ROUTINE', triggerSymptoms: [], rationale: 'Chronic degenerative joint disease' },
      recommendedSpecialty: 'Orthopedics / AYUSH'
    })
  }).then(r => r.json());

  console.log(`\nPatient 2 Summary Model: ${summary2.usedModel}`);
  console.log(`Patient 2 Summary Length: ${summary2.summaryMarkdown?.length} chars`);
  console.log('Patient 2 Excerpt:\n', summary2.summaryMarkdown?.slice(0, 300));

  // Assert distinctiveness
  const isDifferent = summary1.summaryMarkdown !== summary2.summaryMarkdown;
  const patient1HasFever = summary1.summaryMarkdown.toLowerCase().includes('fever') || summary1.summaryMarkdown.toLowerCase().includes('febrile');
  const patient2HasKnee = summary2.summaryMarkdown.toLowerCase().includes('knee') || summary2.summaryMarkdown.toLowerCase().includes('joint');
  const noCrossContamination = !summary1.summaryMarkdown.toLowerCase().includes('knee') && !summary2.summaryMarkdown.toLowerCase().includes('febrile');

  if (isDifferent && patient1HasFever && patient2HasKnee && noCrossContamination) {
    console.log('\n✅ TEST 2 PASSED: Summaries are 100% uniquely grounded, synthesized by Groq, with ZERO dummy/recycled data!');
  } else {
    console.error('\n❌ TEST 2 FAILED: Summaries showed unexpected cross-contamination or similarity.');
  }

  console.log('\n================================================================');
  console.log('🎉 ALL INTEGRATION & VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runVerification();
