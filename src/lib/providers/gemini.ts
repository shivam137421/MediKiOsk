import { GoogleGenAI } from '@google/genai';
import { adaptiveInterviewEngine, ExtractedClinicalSlots } from '@/lib/ontology/adaptive-interview';

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

export interface AICompletionResult {
  reply: string;
  isComplete: boolean;
  slots?: ExtractedClinicalSlots;
}

export class GeminiAIProvider {
  public name = 'Google Gemini (Gemini 1.5 Flash)';
  private ai: GoogleGenAI | null = null;
  private apiKey: string = '';

  constructor() {
    this.apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      '';

    if (this.apiKey && this.apiKey.trim().length > 10) {
      try {
        this.ai = new GoogleGenAI({ apiKey: this.apiKey.trim() });
      } catch (e) {
        console.warn('[Gemini Provider] Initialization error:', e);
      }
    }
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  public async generateFollowUpQuestion(
    history: AIChatMessage[],
    options: AICompletionOptions = {}
  ): Promise<AICompletionResult> {
    const lang = options.language || 'hi';
    const isHi = lang === 'hi';

    // 1. Parse clinical slots from history
    let slots: ExtractedClinicalSlots = {};
    const patientMessages = history.filter(h => h.role === 'user');
    for (const msg of patientMessages) {
      slots = adaptiveInterviewEngine.parsePatientInput(msg.content, slots);
    }

    const defaultSystemPrompt = isHi
      ? `आप 'MediKiosk' अस्पताल के मुख्य एआई डॉक्टर हैं। मरीज के मुख्य लक्षण को समझकर OLDCARTS (शुरुआत, दर्द का प्रकार, तीव्रता 1-10, फैलाव, संबंधित लक्षण) के अनुसार केवल एक (1) प्रासंगिक सवाल पूछें।
नियम:
- यदि मरीज पैर/घुटने/कमर के दर्द की बात करे, तो केवल पैर, जोड़ों, सूजन या चलने से संबंधित सवाल पूछें (सीने के दर्द का सवाल कभी न पूछें)।
- यदि मरीज सीने के दर्द की बात करे, तभी दिल/छाती/पसीने से जुड़े सवाल पूछें।
- उत्तर में केवल 1 संक्षिप्त प्रश्न पूछें।`
      : `You are the 'MediKiosk' AI Clinical Doctor at triage. Based on the patient's primary complaint, ask exactly ONE (1) relevant clinical follow-up question.
Rules:
- If patient mentions leg/knee/joint pain, ask ONLY about leg/walking/swelling/stiffness (NEVER ask about chest/arm/heart unless patient mentions it).
- If patient mentions chest pain, ask about cardiac symptoms.
- Keep question to 1 focused sentence.`;

    // 2. Try Calling Server API Route
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, language: lang, provider: 'gemini' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          const isComplete = Boolean(
            data.isComplete ||
            adaptiveInterviewEngine.isClinicalIntakeComplete(slots, patientMessages.length) ||
            adaptiveInterviewEngine.isClosingStatement(data.reply)
          );
          return { reply: data.reply, isComplete, slots: data.slots || slots };
        }
      }
    } catch (fetchErr) {
      console.warn('[Gemini Provider] Server route call error:', fetchErr);
    }

    // 3. Guaranteed Dynamic Question from parsed clinical information gaps
    const dynamicNext = adaptiveInterviewEngine.generateNextQuestion(slots, lang);
    const isComplete = Boolean(
      dynamicNext.isReadyForStep2 ||
      adaptiveInterviewEngine.isClinicalIntakeComplete(slots, patientMessages.length)
    );
    return {
      reply: dynamicNext.questionText,
      isComplete,
      slots,
    };
  }
}

export const geminiProvider = new GeminiAIProvider();
