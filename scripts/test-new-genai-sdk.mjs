import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';

async function test() {
  if (!apiKey) {
    console.log('No GEMINI_API_KEY set in env');
    return;
  }
  console.log('Testing @google/genai SDK with Auth key...');
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: 'Respond with test message',
    });
    console.log('Gemini Response:', response.text);
  } catch (err) {
    console.error('Error with @google/genai SDK:', err?.message || err);
  }
}

test();
