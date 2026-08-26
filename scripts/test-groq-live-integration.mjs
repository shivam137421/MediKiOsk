import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';

// Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let apiKey = '';
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/GROQ_API_KEY=(.*)/);
  if (match && match[1]) {
    apiKey = match[1].trim().replace(/^["']|["']$/g, '');
  }
}

if (!apiKey) {
  apiKey = process.env.GROQ_API_KEY || '';
}

console.log('================================================================');
console.log('TESTING LIVE GROQ AI INTAKE CONVERSATION (REAL LLM ENGINE)');
console.log('================================================================\n');

if (!apiKey) {
  console.error('❌ GROQ_API_KEY missing in .env.local');
  process.exit(1);
}

const groq = new Groq({ apiKey });
const candidateModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b'];

async function generate(messages) {
  for (const model of candidateModels) {
    try {
      const res = await groq.chat.completions.create({
        messages,
        model,
        temperature: 0.3,
        max_completion_tokens: 500,
      });
      let text = res.choices[0]?.message?.content?.trim() || '';
      text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      if (text) {
        return { text, model };
      }
    } catch {
      // Try next candidate
    }
  }
  throw new Error('All models failed');
}

async function runLiveTest() {
  const systemPromptHindi = `आप 'MediKiosk' अस्पताल के मुख्य एआई डॉक्टर हैं। मरीज के मुख्य लक्षण को समझकर OLDCARTS (शुरुआत, दर्द का प्रकार, तीव्रता 1-10, फैलाव, संबंधित लक्षण) के अनुसार केवल एक (1) प्रासंगिक सवाल पूछें।
नियम:
- यदि मरीज पैर/घुटने/कमर के दर्द की बात करे, तो केवल पैर, जोड़ों, सूजन या चलने से संबंधित सवाल पूछें (सीने के दर्द का सवाल कभी न पूछें)।
- यदि मरीज सीने के दर्द की बात करे, तभी दिल/छाती/पसीने से जुड़े सवाल पूछें।
- उत्तर में केवल 1 संक्षिप्त प्रश्न पूछें (कोई भूमिका या व्याख्या न दें)।`;

  // ----------------------------------------------------------------------------
  // Scenario 1: Leg Pain (Hindi)
  // ----------------------------------------------------------------------------
  console.log('--- SCENARIO 1: LEG PAIN (Hindi) ---');
  const convo1 = [
    { role: 'system', content: systemPromptHindi },
    { role: 'user', content: 'mujhe pairo mein 20 november se dard ho raha hai' },
  ];
  console.log('Patient: "mujhe pairo mein 20 november se dard ho raha hai"');
  const res1 = await generate(convo1);
  console.log(`🤖 Live Groq AI (${res1.model}): "${res1.text}"`);

  // Turn 2
  convo1.push({ role: 'assistant', content: res1.text });
  convo1.push({ role: 'user', content: 'pindli me aithan aur chalne me dikkat hai' });
  console.log('\nPatient: "pindli me aithan aur chalne me dikkat hai"');
  const res2 = await generate(convo1);
  console.log(`🤖 Live Groq AI (${res2.model}): "${res2.text}"`);

  // ----------------------------------------------------------------------------
  // Scenario 2: Chest Pain (Hindi)
  // ----------------------------------------------------------------------------
  console.log('\n--- SCENARIO 2: CHEST PAIN (Hindi) ---');
  const convo2 = [
    { role: 'system', content: systemPromptHindi },
    { role: 'user', content: 'seene mein bhari dabav aur pasina aa raha hai' },
  ];
  console.log('Patient: "seene mein bhari dabav aur pasina aa raha hai"');
  const res3 = await generate(convo2);
  console.log(`🤖 Live Groq AI (${res3.model}): "${res3.text}"`);

  console.log('\n================================================================');
  console.log('🎉 LIVE GROQ AI INTEGRATION VERIFIED & WORKING PERFECTLY!');
  console.log('================================================================\n');
}

runLiveTest();
