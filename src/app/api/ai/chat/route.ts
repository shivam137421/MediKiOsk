import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adaptiveInterviewEngine } from '@/lib/ontology/adaptive-interview';

export async function POST(req: NextRequest) {
  try {
    const { history, language } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    const lang = (language === 'en' ? 'en' : 'hi') as 'hi' | 'en';
    const isHi = lang === 'hi';

    // Parse the entire patient dialogue into clinical slots
    let slots = {};
    const patientMessages = (history || []).filter((h: any) => h.role === 'user' || h.role === 'patient');
    for (const msg of patientMessages) {
      const text = msg.content || msg.text || '';
      if (text) {
        slots = adaptiveInterviewEngine.parsePatientInput(text, slots);
      }
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

    if (apiKey && apiKey.startsWith('AIzaSy')) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: defaultSystemPrompt,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 120,
          },
        });

        const contents = (history || []).map((h: any) => ({
          role: h.role === 'assistant' || h.role === 'ai' ? 'model' : 'user',
          parts: [{ text: h.content || h.text || '' }],
        }));

        const result = await model.generateContent({ contents });
        const text = result.response.text();
        if (text && text.trim().length > 0) {
          return NextResponse.json({ reply: text.trim(), provider: 'gemini-1.5-flash' });
        }
      } catch (geminiError: any) {
        console.warn('[API Route /api/ai/chat] Gemini API error, using tailored clinical rule engine:', geminiError?.message || geminiError);
      }
    }

    // Contextual, tailored fallback based on the actual parsed clinical slots
    const dynamicNext = adaptiveInterviewEngine.generateNextQuestion(slots, lang);
    return NextResponse.json({ reply: dynamicNext.questionText, provider: 'clinical-rules-engine' });
  } catch (error: any) {
    console.error('[API Route /api/ai/chat] General error:', error);
    return NextResponse.json({ error: 'Failed to process AI chat turn' }, { status: 500 });
  }
}
