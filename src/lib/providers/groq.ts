import Groq from 'groq-sdk';
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
  preferredModel?: string;
}

export class GroqAIProvider {
  public name = 'Groq Cloud AI (Llama-3.3-70B / Compound)';
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
      ? `आप 'MediKiosk' अस्पताल के मुख्य एआई डॉक्टर हैं। मरीज के मुख्य लक्षण को समझकर OLDCARTS (शुरुआत, दर्द का प्रकार, तीव्रता 1-10, फैलाव, संबंधित लक्षण) के अनुसार केवल एक (1) प्रासंगिक सवाल पूछें।
नियम:
- यदि मरीज पैर/घुटने/कमर के दर्द की बात करे, तो केवल पैर, जोड़ों, सूजन या चलने से संबंधित सवाल पूछें (सीने के दर्द का सवाल कभी न पूछें)।
- यदि मरीज सीने के दर्द की बात करे, तभी दिल/छाती/पसीने से जुड़े सवाल पूछें।
- उत्तर में केवल 1 संक्षिप्त प्रश्न पूछें (कोई भूमिका या लम्बी व्याख्या न दें)।`
      : `You are the 'MediKiosk' AI Clinical Doctor at triage. Based on the patient's primary complaint, ask exactly ONE (1) relevant clinical follow-up question following the OLDCARTS framework.
Rules:
- If patient mentions leg/knee/joint pain, ask ONLY about leg/walking/swelling/stiffness (NEVER ask about chest/arm/heart unless patient mentions it).
- If patient mentions chest pain, ask about cardiac symptoms.
- Keep question to 1 focused, empathetic sentence with no extra fluff.`;

    // 2. Try Calling Server API Route
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, language: lang, provider: 'groq' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) return data.reply;
      }
    } catch (fetchErr) {
      console.warn('[Groq Provider] Server API call error, trying direct client...', fetchErr);
    }

    // 3. Try Direct Groq Client if in server/Node environment
    if (this.client) {
      const candidateModels = [
        options.preferredModel || 'llama-3.3-70b-versatile',
        'groq/compound',
        'openai/gpt-oss-120b',
        'qwen/qwen3.6-27b',
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
            content: h.content,
          })),
      ];

      for (const model of candidateModels) {
        try {
          const completion = await this.client.chat.completions.create({
            messages,
            model,
            temperature: options.temperature ?? 0.3,
            max_completion_tokens: options.maxTokens ?? 100,
          });

          let text = completion.choices[0]?.message?.content?.trim() || '';
          // Clean think tags or boilerplate
          text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
          if (text) {
            return text;
          }
        } catch (err: any) {
          console.warn(`[Groq Provider] Model ${model} failed, trying next candidate:`, err?.message || err);
        }
      }
    }

    // 4. Guaranteed Dynamic Question from parsed clinical information gaps
    const dynamicNext = adaptiveInterviewEngine.generateNextQuestion(slots, lang);
    return dynamicNext.questionText;
  }
}

export const groqProvider = new GroqAIProvider();
