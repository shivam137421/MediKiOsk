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
console.log('TESTING MEDIKIOSK LIVE API ROUTES WITH REAL GROQ ENGINE');
console.log('================================================================\n');

async function testServer() {
  const baseUrl = 'http://localhost:3000';

  // 1. Test /api/ai/chat
  console.log('--- 1. Testing /api/ai/chat with Leg Pain (Hindi) ---');
  try {
    const chatRes = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'hi',
        history: [
          { role: 'user', content: 'mujhe pairo mein 3 din se bahut dard ho raha hai' }
        ]
      })
    });
    const chatData = await chatRes.json();
    console.log('Chat Status:', chatRes.status);
    console.log('Chat Provider:', chatData.provider);
    console.log('Chat Reply:', chatData.reply);
    console.log('Is Complete:', chatData.isComplete);
    console.log('Slots:', JSON.stringify(chatData.slots));
    if (chatData.provider?.startsWith('groq')) {
      console.log('✅ Chat successfully used real Groq model!');
    } else {
      console.warn('⚠️ Chat used:', chatData.provider);
    }
  } catch (e) {
    console.error('❌ Chat request failed:', e.message);
  }

  // 2. Test /api/ai/summary - Patient A (Chest Pain / Cardiology)
  console.log('\n--- 2. Testing /api/ai/summary for Patient A (Chest Pain) ---');
  try {
    const sumResA = await fetch(`${baseUrl}/api/ai/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient: {
          id: 'pat-001',
          full_name: 'Rajesh Kumar',
          age_years: 58,
          gender: 'male',
          abha_id: '91-1122-3344-5566',
          preferred_language: 'hi'
        },
        encounter: {
          id: 'enc-001',
          recommended_specialty: 'Cardiology',
          is_emergency: true,
          emergency_rationale: 'Suspected Acute Coronary Syndrome'
        },
        chiefComplaint: 'Severe Chest Pressure and Diaphoresis',
        conversationTurns: [
          { role: 'patient', content: 'mujhe seene me tez dabav aur pasina aa raha hai 2 ghante se' },
          { role: 'ai', content: 'kya ye dard baen haath ya jabde ki taraf ja raha hai?' },
          { role: 'patient', content: 'ha baen haath me dard ja raha hai aur saans lene me takleef hai' }
        ],
        clinicalSlots: {
          chiefComplaint: 'Chest Pain / Pressure',
          severityNumber: 9,
          durationOnset: '2 hours ago',
          characterQuality: 'Crushing heavy pressure',
          radiationLocation: 'Left arm and jaw',
          associatedSymptoms: ['Diaphoresis / Sweating', 'Shortness of breath'],
          pastHistory: ['Hypertension', 'Dyslipidemia']
        },
        redFlagResult: {
          hasRedFlag: true,
          priority: 'EMERGENCY',
          triggerSymptoms: ['Crushing chest pressure radiating to left arm', 'Diaphoresis'],
          rationale: 'Acute ischemic cardiac presentation'
        },
        recommendedSpecialty: 'Cardiology'
      })
    });
    const sumDataA = await sumResA.json();
    console.log('Summary A Status:', sumResA.status);
    console.log('Summary A Used Model:', sumDataA.usedModel);
    console.log('Summary A Length:', sumDataA.summaryMarkdown?.length);
    console.log('Summary A Sample:\n', sumDataA.summaryMarkdown?.slice(0, 350));
    if (sumDataA.usedModel?.startsWith('groq')) {
      console.log('✅ Summary A successfully used real Groq model!');
    }
  } catch (e) {
    console.error('❌ Summary A failed:', e.message);
  }

  // 3. Test /api/ai/summary - Patient B (Knee Pain / Ayurveda)
  console.log('\n--- 3. Testing /api/ai/summary for Patient B (Knee Pain & Ayush) ---');
  try {
    const sumResB = await fetch(`${baseUrl}/api/ai/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient: {
          id: 'pat-002',
          full_name: 'Sunita Devi',
          age_years: 46,
          gender: 'female',
          abha_id: '91-9988-7766-5544',
          preferred_language: 'hi'
        },
        encounter: {
          id: 'enc-002',
          recommended_specialty: 'Ayurveda & AYUSH',
          is_emergency: false,
          emergency_rationale: null
        },
        chiefComplaint: 'Bilateral Knee Joint Stiffness & Crepitus (Sandhigata Vata)',
        conversationTurns: [
          { role: 'patient', content: 'mujhe dono ghutno me subah subah bahut jakdan aur dard hota hai' },
          { role: 'ai', content: 'kya chalte samay ghutno se aawaz aati hai ya sujan hai?' },
          { role: 'patient', content: 'ha tik tik aawaz aati hai aur thodi sujan bhi rehti hai 6 mahine se' }
        ],
        clinicalSlots: {
          chiefComplaint: 'Bilateral Knee Pain & Stiffness',
          severityNumber: 6,
          durationOnset: '6 months',
          characterQuality: 'Aching stiffness with crepitus',
          radiationLocation: null,
          associatedSymptoms: ['Morning stiffness', 'Joint crepitus'],
          pastHistory: ['Hypothyroidism']
        },
        ayushAnswers: {
          prakritiPrimary: 'Vata-Kapha',
          vikritiSymptoms: ['Sandhigata Vata (Joint dryness & stiffness)', 'Agni Mandya'],
          agniType: 'Vishamagni (Variable digestion)',
          koshthaType: 'Krura (Constipated habit)',
          balaEnergy: 'Madhyama'
        },
        redFlagResult: {
          hasRedFlag: false,
          priority: 'ROUTINE',
          triggerSymptoms: [],
          rationale: 'Chronic non-emergent musculoskeletal disorder'
        },
        recommendedSpecialty: 'Ayurveda & AYUSH'
      })
    });
    const sumDataB = await sumResB.json();
    console.log('Summary B Status:', sumResB.status);
    console.log('Summary B Used Model:', sumDataB.usedModel);
    console.log('Summary B Length:', sumDataB.summaryMarkdown?.length);
    console.log('Summary B Sample:\n', sumDataB.summaryMarkdown?.slice(0, 350));
    if (sumDataB.usedModel?.startsWith('groq')) {
      console.log('✅ Summary B successfully used real Groq model!');
    }
  } catch (e) {
    console.error('❌ Summary B failed:', e.message);
  }

  console.log('\n================================================================');
  console.log('TEST SUITE COMPLETE');
  console.log('================================================================\n');
}

testServer();
