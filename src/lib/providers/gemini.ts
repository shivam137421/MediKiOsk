import { GoogleGenAI } from '@google/genai';
import { adaptiveInterviewEngine, sanitizeAIResponse, ExtractedClinicalSlots } from '@/lib/ontology/adaptive-interview';

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
    return true;
  }

  public async generateFollowUpQuestion(
    history: AIChatMessage[],
    options: AICompletionOptions = {}
  ): Promise<AICompletionResult> {
    const lang = options.language || 'hi';
    const isHi = lang === 'hi';

    // 1. Parse clinical slots from history with context-aware tracking
    let slots: ExtractedClinicalSlots = {};
    const patientMessages = history.filter(h => h.role === 'user');
    for (const msg of patientMessages) {
      const currentTarget = adaptiveInterviewEngine.generateNextQuestion(slots, lang).targetSlot;
      slots = adaptiveInterviewEngine.parsePatientInput(msg.content, slots, currentTarget);
    }

    const defaultSystemPrompt = isHi
      ? `आप 'MediKiosk' अस्पताल के मुख्य एआई डॉक्टर हैं। मरीज के मुख्य लक्षण को समझकर केवल 1 संक्षिप्त, सीधा और सहानुभूतिपूर्ण प्रश्न पूछें। कोई आंतरिक विचार या विश्लेषण न लिखें। यदि आप कोई प्रश्न पूछ रहे हैं, तो केवल प्रश्न पूछें — प्रश्न और क्लोजिंग संदेश कभी न मिलाएं।`
      : `You are the 'MediKiosk' AI Clinical Doctor at triage. Based on the patient's primary complaint, ask exactly ONE (1) relevant clinical follow-up question. Do NOT output internal reasoning. If asking a question, ONLY ask the question — NEVER combine a question with a closing/transition statement.`;

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
          const cleanReply = sanitizeAIResponse(data.reply);
          const isAsking = cleanReply.includes('?') || cleanReply.includes('？');
          const isComplete = !isAsking && Boolean(
            data.isComplete ||
            adaptiveInterviewEngine.isClinicalIntakeComplete(slots, patientMessages.length) ||
            adaptiveInterviewEngine.isClosingStatement(cleanReply)
          );
          return { reply: cleanReply, isComplete, slots: data.slots || slots };
        }
      }
    } catch (fetchErr) {
      console.warn('[Gemini Provider] Server route call error:', fetchErr);
    }

    // 3. Guaranteed Dynamic Question from parsed clinical information gaps
    const dynamicNext = adaptiveInterviewEngine.generateNextQuestion(slots, lang);
    const cleanDynamicText = sanitizeAIResponse(dynamicNext.questionText);
    const isAsking = cleanDynamicText.includes('?') || cleanDynamicText.includes('？');
    const isComplete = !isAsking && Boolean(
      dynamicNext.isReadyForStep2 ||
      adaptiveInterviewEngine.isClinicalIntakeComplete(slots, patientMessages.length)
    );
    return {
      reply: cleanDynamicText,
      isComplete,
      slots,
    };
  }
}

export const geminiProvider = new GeminiAIProvider();
