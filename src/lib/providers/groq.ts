import Groq from 'groq-sdk';
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
  preferredModel?: string;
}

export interface AICompletionResult {
  reply: string;
  isComplete: boolean;
  slots?: ExtractedClinicalSlots;
}

export class GroqAIProvider {
  public name = 'Groq Cloud AI (Llama-3.3-70B)';
  private client: Groq | null = null;
  private apiKey: string = '';

  constructor() {
    this.apiKey =
      process.env.GROQ_API_KEY ||
      process.env.NEXT_PUBLIC_GROQ_API_KEY ||
      '';

    if (this.apiKey && this.apiKey.trim().length > 5) {
      try {
        this.client = new Groq({ apiKey: this.apiKey.trim() });
      } catch (e) {
        console.warn('[Groq Provider] Initialization error:', e);
      }
    }
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
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
      ? `आप 'MediKiosk' अस्पताल के मुख्य एआई डॉक्टर हैं। मरीज के मुख्य लक्षण को समझकर केवल 1 संक्षिप्त, सीधा और सहानुभूतिपूर्ण प्रश्न पूछें। कोई आंतरिक विचार या विश्लेषण न लिखें।`
      : `You are the 'MediKiosk' AI Clinical Doctor at triage. Based on the patient's primary complaint, ask exactly ONE (1) relevant clinical follow-up question. Do NOT output internal reasoning.`;

    // 2. Try Calling Server API Route
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, language: lang, provider: 'groq' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          const cleanReply = sanitizeAIResponse(data.reply);
          const isComplete = Boolean(
            data.isComplete ||
            adaptiveInterviewEngine.isClinicalIntakeComplete(slots, patientMessages.length) ||
            adaptiveInterviewEngine.isClosingStatement(cleanReply)
          );
          return {
            reply: cleanReply,
            isComplete,
            slots: data.slots || slots,
          };
        }
      }
    } catch (fetchErr) {
      console.warn('[Groq Provider] Server API call error, trying direct client...', fetchErr);
    }

    // 3. Try Direct Groq Client if in server/Node environment
    if (this.client) {
      const candidateModels = [
        options.preferredModel || 'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'gemma2-9b-it',
        'llama3-70b-8192',
      ];

      const messages: any[] = [
        {
          role: 'system',
          content: options.systemPrompt || defaultSystemPrompt,
        },
        ...history
          .filter(h => h.role !== 'system')
          .map(h => ({
            role: h.role,
            content: sanitizeAIResponse(h.content),
          })),
      ];

      for (const model of candidateModels) {
        try {
          const completion = await this.client.chat.completions.create({
            messages,
            model,
            temperature: 0.2,
            max_completion_tokens: 150,
          });

          let rawText = completion.choices[0]?.message?.content?.trim() || '';
          let text = sanitizeAIResponse(rawText);
          if (text) {
            const isComplete = Boolean(
              adaptiveInterviewEngine.isClinicalIntakeComplete(slots, patientMessages.length) ||
              adaptiveInterviewEngine.isClosingStatement(text)
            );
            return { reply: text, isComplete, slots };
          }
        } catch (err: any) {
          console.warn(`[Groq Provider] Model ${model} failed, trying next candidate:`, err?.message || err);
        }
      }
    }

    // 4. Guaranteed Dynamic Question from parsed clinical information gaps
    const dynamicNext = adaptiveInterviewEngine.generateNextQuestion(slots, lang);
    const cleanDynamicText = sanitizeAIResponse(dynamicNext.questionText);
    const isComplete = Boolean(
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

export const groqProvider = new GroqAIProvider();
