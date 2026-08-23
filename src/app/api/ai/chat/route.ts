import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { history, language } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    const lang = language || 'hi';
    const isHi = lang === 'hi';

    const defaultSystemPrompt = isHi
      ? `आप 'MediKiosk' हॉस्पिटल के अनुभवी एआई क्लीनिकल डॉक्टर हैं। आपका कार्य मरीज से उनकी बीमारी का OLDCARTS (Onset, Location, Duration, Character, Radiation, Severity, Associated symptoms, PMH) के अनुसार विस्तार से इतिहास लेना है।
नियम:
1. मरीज के दिए गए पिछले उत्तर को ध्यान से पढ़ें और समझें।
2. केवल एक (1) संक्षिप्त, स्पष्ट और सहानुभूतिपूर्ण फॉलो-अप प्रश्न पूछें।
3. भाषा: शुद्ध और स्वाभाविक हिंदी।
4. यदि सीने में दर्द, सांस फूलना, ठंडा पसीना या बेहोशी जैसे आपातकालीन लक्षण (Red-flags) दिखें, तो तुरंत उस पर प्रश्न पूछें।`
      : `You are the 'MediKiosk' AI Clinical Doctor Assistant at a hospital triage intake. Your goal is to conduct an adaptive, empathetic clinical intake following the OLDCARTS framework (Onset, Location, Duration, Character, Radiation, Severity 1-10, Associated symptoms, Past medical history).
Rules:
1. Carefully read and understand the patient's previous response in the conversation history.
2. Ask exactly ONE (1) focused, concise, and empathetic clinical follow-up question per turn.
3. Language: Clear, professional English.
4. If emergency symptoms appear (crushing chest pain, dyspnea, cold diaphoresis), prioritize vital red-flag exploration.`;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: defaultSystemPrompt,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 150,
          },
        });

        const contents = (history || []).map((h: any) => ({
          role: h.role === 'assistant' || h.role === 'ai' ? 'model' : 'user',
          parts: [{ text: h.content || h.text || '' }],
        }));

        const result = await model.generateContent({ contents });
        const text = result.response.text();
        if (text) {
          return NextResponse.json({ reply: text.trim(), provider: 'gemini-1.5-flash' });
        }
      } catch (geminiError: any) {
        console.warn('[API Route /api/ai/chat] Gemini API error, returning clinical rule fallback:', geminiError?.message || geminiError);
      }
    }

    // Fallback if API key has issues or network down
    const fallbackReply = isHi
      ? 'क्या यह दर्द बाएँ हाथ, कंधे या जबड़े की तरफ भी फैल रहा है, और क्या आपको पसीना आ रहा है?'
      : 'Does this discomfort radiate to your left arm or jaw, and are you having any cold sweats?';

    return NextResponse.json({ reply: fallbackReply, provider: 'clinical-rules-fallback' });
  } catch (error: any) {
    console.error('[API Route /api/ai/chat] General error:', error);
    return NextResponse.json({ error: 'Failed to process AI chat turn' }, { status: 500 });
  }
}
