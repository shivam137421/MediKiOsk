import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import { adaptiveInterviewEngine, sanitizeAIResponse } from '@/lib/ontology/adaptive-interview';

export async function POST(req: NextRequest) {
  try {
    const { history, language } = await req.json();
    const activeProvider = (process.env.AI_PROVIDER || 'groq').toLowerCase();
    const groqKey = (process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || '').trim();
    const geminiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '').trim();

    const lang = (language === 'en' ? 'en' : 'hi') as 'hi' | 'en';
    const isHi = lang === 'hi';

    // Parse the entire patient dialogue into clinical slots with context-aware gap tracking
    let slots = {};
    const patientMessages = (history || []).filter((h: any) => h.role === 'user' || h.role === 'patient');
    for (const msg of patientMessages) {
      const text = msg.content || msg.text || '';
      if (text) {
        const currentTarget = adaptiveInterviewEngine.generateNextQuestion(slots, lang).targetSlot;
        slots = adaptiveInterviewEngine.parsePatientInput(text, slots, currentTarget);
      }
    }

    const defaultSystemPrompt = isHi
      ? `आप 'MediKiosk' अस्पताल के मुख्य एआई डॉक्टर हैं। मरीज के मुख्य लक्षण (जैसे बुखार, सीने में दर्द, घुटने का दर्द, सिरदर्द या पेट दर्द) को समझकर OLDCARTS (शुरुआत, दर्द/लक्षण का प्रकार, तीव्रता 1-10, संबंधित लक्षण, पिछली बीमारी या ली गई दवा) के अनुसार केवल एक (1) प्रासंगिक सवाल पूछें।
नियम:
- यदि मरीज बुखार की बात करे, तो बुखार की अवधि, ठंड/कंपकंपी, थर्मामीटर तापमान, खांसी/गला, और पेरासिटामोल या ली गई दवा से जुड़े सवाल पूछें।
- यदि मरीज पैर/घुटने/कमर के दर्द की बात करे, तो केवल पैर, जोड़ों, सूजन या चलने से संबंधित सवाल पूछें (सीने के दर्द का सवाल कभी न पूछें)।
- यदि मरीज सीने के दर्द की बात करे, तभी दिल/छाती/पसीने से जुड़े सवाल पूछें।
- उत्तर में केवल 1 संक्षिप्त, सीधा और सहानुभूतिपूर्ण प्रश्न पूछें। कोई आंतरिक सोच (thinking) या विश्लेषण न लिखें।
- अति महत्वपूर्ण नियम: यदि आप कोई सवाल पूछ रहे हैं, तो केवल सवाल पूछें — एक ही उत्तर में सवाल और क्लोजिंग/चरण 2 का संदेश कभी न मिलाएं।
- जब मरीज के लक्षण, अवधि, तीव्रता, संबंधित लक्षण और दवाइयां पूर्ण रूप से दर्ज हो जाएं और आगे कोई सवाल न पूछना हो, तभी स्पष्ट क्लोजिंग संदेश दें कि विवरण दर्ज कर लिया गया है और चरण 2 (आयुर्वेद परीक्षा) पर आगे बढ़ रहे हैं।`
      : `You are the 'MediKiosk' AI Clinical Doctor at triage. Based on the patient's primary complaint (such as fever, chest pain, knee pain, headache, or abdominal pain), ask exactly ONE (1) relevant clinical follow-up question following the OLDCARTS framework (onset, character/chills, severity 1-10, associated symptoms, and medication/history).
Rules:
- If patient mentions fever, ask about duration, chills/shivering, temperature/severity, associated cough/sore throat, and whether any Paracetamol/medicine was taken.
- If patient mentions leg/knee/joint pain, ask ONLY about leg/walking/swelling/stiffness (NEVER ask about chest/arm/heart unless patient mentions it).
- If patient mentions chest pain, ask about cardiac symptoms.
- Output ONLY the single clear, empathetic question for the patient. Do NOT output any internal reasoning or thinking blocks.
- CRITICAL RULE: If you are asking a question, ONLY ask the question — NEVER combine a question with a closing/transition statement in the same message.
- Only provide a closing statement on a turn where all essential details are gathered and you are NOT asking anything further.`;

    let reply = '';
    let usedProvider = 'clinical-rules-engine';

    // --------------------------------------------------------------------------
    // 1. GROQ PROVIDER (Primary / Active)
    // --------------------------------------------------------------------------
    if ((activeProvider === 'groq' || (!geminiKey && groqKey)) && groqKey.length > 5) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        // Standard high-speed chat models (avoid reasoning models that emit <think> tags)
        const candidateModels = [
          'llama-3.3-70b-versatile',
          'llama-3.1-8b-instant',
          'gemma2-9b-it',
          'llama3-70b-8192',
          'llama3-8b-8192',
        ];

        const groqMessages = [
          { role: 'system', content: defaultSystemPrompt },
          ...(history || [])
            .filter((h: any) => h.role !== 'system')
            .map((h: any) => ({
              role: h.role === 'assistant' || h.role === 'ai' ? 'assistant' : 'user',
              content: sanitizeAIResponse(h.content || h.text || ''),
            })),
        ];

        for (const model of candidateModels) {
          try {
            const completion = await groq.chat.completions.create({
              messages: groqMessages as any,
              model,
              temperature: 0.2,
              max_completion_tokens: 150,
            });

            let rawText = completion.choices[0]?.message?.content?.trim() || '';
            let cleaned = sanitizeAIResponse(rawText);
            if (cleaned && cleaned.length > 0) {
              reply = cleaned;
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
          parts: [{ text: sanitizeAIResponse(h.content || h.text || '') }],
        }));

        const result = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents,
          config: {
            systemInstruction: defaultSystemPrompt,
            temperature: 0.2,
            maxOutputTokens: 150,
          },
        });

        const rawText = result.text;
        const cleaned = sanitizeAIResponse(rawText || '');
        if (cleaned && cleaned.length > 0) {
          reply = cleaned;
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
      reply = sanitizeAIResponse(dynamicNext.questionText);
      usedProvider = 'clinical-rules-engine';
    }

    // --------------------------------------------------------------------------
    // 4. STRUCTURED COMPLETION SIGNAL EVALUATION
    // --------------------------------------------------------------------------
    const dynamicNext = adaptiveInterviewEngine.generateNextQuestion(slots, lang);
    const isEngineComplete = adaptiveInterviewEngine.isClinicalIntakeComplete(slots, patientMessages.length);
    const replyIsAskingQuestion = reply.includes('?') || reply.includes('？');

    let isComplete = false;
    if (!replyIsAskingQuestion && (isEngineComplete || dynamicNext.isReadyForStep2)) {
      isComplete = true;
    }

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
