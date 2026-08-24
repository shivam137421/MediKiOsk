import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import { adaptiveInterviewEngine } from '@/lib/ontology/adaptive-interview';

export async function POST(req: NextRequest) {
  try {
    const { history, language } = await req.json();
    const activeProvider = (process.env.AI_PROVIDER || 'groq').toLowerCase();
    const groqKey = (process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || '').trim();
    const geminiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '').trim();

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
      ? `आप 'MediKiosk' अस्पताल के मुख्य एआई डॉक्टर हैं। मरीज के मुख्य लक्षण को समझकर OLDCARTS (शुरुआत, दर्द का प्रकार, तीव्रता 1-10, फैलाव, संबंधित लक्षण) के अनुसार केवल एक (1) प्रासंगिक सवाल पूछें।
नियम:
- यदि मरीज पैर/घुटने/कमर के दर्द की बात करे, तो केवल पैर, जोड़ों, सूजन या चलने से संबंधित सवाल पूछें (सीने के दर्द का सवाल कभी न पूछें)।
- यदि मरीज सीने के दर्द की बात करे, तभी दिल/छाती/पसीने से जुड़े सवाल पूछें।
- उत्तर में केवल 1 संक्षिप्त, स्पष्ट प्रश्न पूछें।
- जब मरीज के मुख्य लक्षण, शुरुआत, तीव्रता और इतिहास पर्याप्त रूप से समझ आ चुके हों, तो स्पष्ट क्लोजिंग संदेश दें कि विवरण दर्ज कर लिया गया है और चरण 2 (आयुर्वेद परीक्षा) पर आगे बढ़ रहे हैं।`
      : `You are the 'MediKiosk' AI Clinical Doctor at triage. Based on the patient's primary complaint, ask exactly ONE (1) relevant clinical follow-up question following the OLDCARTS framework.
Rules:
- If patient mentions leg/knee/joint pain, ask ONLY about leg/walking/swelling/stiffness (NEVER ask about chest/arm/heart unless patient mentions it).
- If patient mentions chest pain, ask about cardiac symptoms.
- Keep question to 1 focused, empathetic sentence.
- When sufficient clinical details (complaint, onset, severity, history) are gathered, provide a clear closing statement that the intake is recorded and proceeding to Step 2 for Ayurvedic assessment.`;

    let reply = '';
    let usedProvider = 'clinical-rules-engine';

    // --------------------------------------------------------------------------
    // 1. GROQ PROVIDER (Primary / Active)
    // --------------------------------------------------------------------------
    if ((activeProvider === 'groq' || (!geminiKey && groqKey)) && groqKey.length > 5) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        const candidateModels = [
          'llama-3.3-70b-versatile',
          'groq/compound',
          'openai/gpt-oss-120b',
          'qwen/qwen3.6-27b',
        ];

        const groqMessages = [
          { role: 'system', content: defaultSystemPrompt },
          ...(history || [])
            .filter((h: any) => h.role !== 'system')
            .map((h: any) => ({
              role: h.role === 'assistant' || h.role === 'ai' ? 'assistant' : 'user',
              content: h.content || h.text || '',
            })),
        ];

        for (const model of candidateModels) {
          try {
            const completion = await groq.chat.completions.create({
              messages: groqMessages as any,
              model,
              temperature: 0.3,
              max_completion_tokens: 120,
            });

            let text = completion.choices[0]?.message?.content?.trim() || '';
            text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            if (text) {
              reply = text;
              usedProvider = `groq (${model})`;
              break;
            }
          } catch (modelErr: any) {
            console.warn(`[Groq Model ${model}]:`, modelErr?.message || modelErr);
          }
        }
      } catch (groqErr: any) {
        console.warn('[API Route /api/ai/chat] Groq error:', groqErr?.message || groqErr);
      }
    }

    // --------------------------------------------------------------------------
    // 2. GEMINI PROVIDER (If active)
    // --------------------------------------------------------------------------
    if (!reply && activeProvider === 'gemini' && geminiKey.length > 10) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const contents = (history || []).map((h: any) => ({
          role: h.role === 'assistant' || h.role === 'ai' ? 'model' : 'user',
          parts: [{ text: h.content || h.text || '' }],
        }));

        const result = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents,
          config: {
            systemInstruction: defaultSystemPrompt,
            temperature: 0.3,
            maxOutputTokens: 120,
          },
        });

        const text = result.text;
        if (text && text.trim().length > 0) {
          reply = text.trim();
          usedProvider = 'gemini-1.5-flash';
        }
      } catch (geminiError: any) {
        console.warn('[API Route /api/ai/chat] Google GenAI response:', geminiError?.message || geminiError);
      }
    }

    // --------------------------------------------------------------------------
    // 3. CLINICAL ONTOLOGY FALLBACK
    // --------------------------------------------------------------------------
    if (!reply) {
      const dynamicNext = adaptiveInterviewEngine.generateNextQuestion(slots, lang);
      reply = dynamicNext.questionText;
      usedProvider = 'clinical-rules-engine';
    }

    // --------------------------------------------------------------------------
    // 4. STRUCTURED COMPLETION SIGNAL EVALUATION
    // --------------------------------------------------------------------------
    const isComplete = Boolean(
      adaptiveInterviewEngine.isClinicalIntakeComplete(slots, patientMessages.length) ||
      adaptiveInterviewEngine.isClosingStatement(reply)
    );

    // If complete and reply lacks explicit closing remark, append clear closing
    if (isComplete && !adaptiveInterviewEngine.isClosingStatement(reply)) {
      reply = `${reply} ${adaptiveInterviewEngine.getClosingStatement(lang)}`;
    }

    return NextResponse.json({
      reply,
      isComplete,
      provider: usedProvider,
      slots,
    });
  } catch (error: any) {
    console.error('[API Route /api/ai/chat] General error:', error);
    return NextResponse.json({ error: 'Failed to process AI chat turn' }, { status: 500 });
  }
}
