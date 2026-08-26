import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
let apiKey = process.env.GROQ_API_KEY || '';
if (!apiKey && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/GROQ_API_KEY=([^\r\n]+)/);
  if (match) apiKey = match[1].trim().replace(/^["']|["']$/g, '');
}

const systemPrompt = `You are the Lead Clinical Synthesizer & Medical Documentation AI at MediKiosk.
Your responsibility is to synthesize a structured, professional, HIPAA/NDHM-compliant Clinical SOAP & Ayush Intake Summary from the gathered encounter data.

CRITICAL CLINICAL INTEGRITY RULES:
1. STRICT TRUTHFULNESS & GROUNDING: Include ONLY the patient's actual reported symptoms, uploaded OCR documents, and Ayush questionnaire responses. NEVER invent or hallucinate cardiac medications (like Atorvastatin/Telmisartan) or cardiac complaints for an orthopedic/knee or gastric patient.
2. CONCISE & STRUCTURED FORMAT: Generate clean, formatted Markdown using standard clinical headings:
   - ## CLINICAL TRIAGE & PATIENT IDENTIFICATION
   - ## CHIEF COMPLAINT (CC) & HISTORY OF PRESENT ILLNESS (HPI)
   - ## REVIEW OF SYSTEMS & ASSOCIATED FINDINGS
   - ## AYUSH & CONSTITUTIONAL EVALUATION (Prakriti, Vikriti, Agni, Dhatu)
   - ## PAST MEDICAL HISTORY & CURRENT MEDICATIONS (Attributed to Patient Stated vs Document OCR)
   - ## DIAGNOSTIC OCR & LABORATORY FINDINGS
   - ## CLINICAL IMPRESSION & DIFFERENTIAL CONSIDERATIONS
   - ## RECOMMENDED TRIAGE DISPOSITION & ACTION PLAN
3. TONE: Objective, clinical, and precise.`;

const testPrompt = `Synthesize the complete, grounded clinical summary for this patient:

PATIENT IDENTIFICATION & DEMOGRAPHICS:
- Full Name: Ramesh Patel
- Age: 52 Years | Gender: MALE
- ABHA ID: 91-8472-9102-1142
- Phone: +91 98765 43210
- Primary Language: hi

STEP 1 — CLINICAL INTERVIEW & CONVERSATION TRANSCRIPT:
- Primary Chief Complaint: High Fever and Chills for 3 days
- Pain Severity Score: 7/10
- Onset & Duration: 3 days ago, sudden onset
- Sensation / Quality: High grade with shivering
- Radiation: None reported
- Associated Symptoms: Headache, body ache, mild dry cough
- Stated Past Medical History: Type 2 Diabetes (5 years)
- Dialogue Transcript:
  [Patient]: "mujhe 3 din se tez bukhar aur thand lag rahi hai"
  [AI Doctor]: "bukhar ke sath koi khansi ya sar dard hai?"
  [Patient]: "ha sar dard hai aur badan toot raha hai, 102 fever tha subah"
`;

async function test(model) {
  console.log(`\n=== Testing summary synthesis with: ${model} ===`);
  const t0 = Date.now();
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: testPrompt }
      ],
      temperature: 0.2,
      max_completion_tokens: 1200
    })
  });
  const data = await res.json();
  console.log(`Completed in ${Date.now() - t0} ms`);
  if (!res.ok) {
    console.error('Error:', data);
    return;
  }
  const content = data.choices?.[0]?.message?.content || '';
  console.log('Output length:', content.length);
  console.log('Sample content (first 500 chars):\n', content.slice(0, 500));
}

async function run() {
  await test('openai/gpt-oss-120b');
  await test('openai/gpt-oss-20b');
}

run();
