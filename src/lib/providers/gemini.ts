import { GoogleGenerativeAI } from '@google/generative-ai';
import { adaptiveInterviewEngine } from '@/lib/ontology/adaptive-interview';

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AICompletionOptions {
  language?: 'hi' | 'en';
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export class GeminiAIProvider {
  public name = 'Google Gemini (Gemini 1.5 Flash)';
  private client: GoogleGenerativeAI | null = null;
  private apiKey: string = '';

  constructor() {
    this.apiKey = 
      process.env.GEMINI_API_KEY || 
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
      '';
    if (this.apiKey && this.apiKey.startsWith('AIzaSy')) {
      try {
        this.client = new GoogleGenerativeAI(this.apiKey);
      } catch (e) {
        console.warn('[Gemini Provider] Initialization error:', e);
      }
    }
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  public async generateFollowUpQuestion(
    history: AIChatMessage[],
    options: AICompletionOptions = {}
  ): Promise<string> {
    const lang = options.language || 'hi';
    const isHi = lang === 'hi';

    // 1. Parse clinical slots from history
    let slots = {};
    const patientMessages = history.filter(h => h.role === 'user');
    for (const msg of patientMessages) {
      slots = adaptiveInterviewEngine.parsePatientInput(msg.content, slots);
    }

    const defaultSystemPrompt = isHi
      ? `आप 'MediKiosk' अस्पताल के अनुभवी एआई डॉक्टर हैं। मरीज के मुख्य लक्षण को समझकर OLDCARTS (शुरुआत, दर्द का प्रकार, तीव्रता 1-10, फैलाव, संबंधित लक्षण) के अनुसार केवल एक (1) प्रासंगिक सवाल पूछें।
नियम:
- यदि मरीज पैर/घुटने/कमर के दर्द की बात करे, तो केवल पैर, जोड़ों, सूजन या चलने से संबंधित सवाल पूछें (सीने के दर्द का सवाल कभी न पूछें)।
- यदि मरीज सीने के दर्द की बात करे, तभी दिल/छाती/पसीने से जुड़े सवाल पूछें।
- केवल 1 संक्षिप्त प्रश्न पूछें।`
      : `You are the 'MediKiosk' AI Clinical Doctor at triage. Based on the patient's primary complaint, ask exactly ONE (1) relevant clinical follow-up question.
Rules:
- If patient mentions leg/knee/joint pain, ask ONLY about leg/walking/swelling/stiffness (NEVER ask about chest/arm/heart unless patient mentions it).
- If patient mentions chest pain, ask about cardiac symptoms.
- Keep question to 1 focused sentence.`;

    // 2. Try Live Gemini SDK if valid Google AI key is provided
    if (this.client && this.apiKey && this.apiKey.startsWith('AIzaSy')) {
      try {
        const model = this.client.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: options.systemPrompt || defaultSystemPrompt,
          generationConfig: {
            temperature: options.temperature ?? 0.3,
            maxOutputTokens: options.maxTokens ?? 120,
          },
        });

        const contents = history
          .filter(h => h.role !== 'system')
          .map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }],
          }));

        const result = await model.generateContent({ contents });
        const text = result.response.text();
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } catch (err) {
        console.warn('[Gemini Provider] API call error, falling back to dynamic clinical rules:', err);
      }
    }

    // 3. Try Calling Server API Route
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, language: lang }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) return data.reply;
      }
    } catch {
      // Fallback
    }

    // 4. Guaranteed Dynamic Question from parsed clinical slots
    const dynamicNext = adaptiveInterviewEngine.generateNextQuestion(slots, lang);
    return dynamicNext.questionText;
  }
}

export const geminiProvider = new GeminiAIProvider();
