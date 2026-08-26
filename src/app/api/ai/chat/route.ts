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
      ? `आप 'MediKiosk' अस्पताल के मुख्य एआई ट्रायज डॉक्टर हैं।
मरीज के साथ बहुत ही विनम्र, सहानुभूतिपूर्ण और स्वाभाविक बातचीत करें।
मरीज द्वारा बताई गई बात के आधार पर केवल एक (1) प्रासंगिक, संक्षिप्त और स्पष्ट चिकित्सकीय प्रश्न पूछें (OLDCARTS: लक्षण की शुरुआत/अवधि, लक्षण का स्वरूप, दर्द/तीव्रता 1-10, संबंधित अन्य लक्षण, ली गई दवाइयां या पुरानी बीमारी)।

महत्वपूर्ण नियम:
1. जो जानकारी मरीज पहले ही बता चुका है, उसे दोबारा कभी न पूछें।
2. यदि मरीज ने हिंग्लिश (रोमन लिपि) या हिंदी में बात की है, तो सरल व समझने योग्य हिंदी में जवाब दें।
3. केवल एक (1) सीधा प्रश्न पूछें। कोई भूमिका, आंतरिक विश्लेषण (thinking) या अनावश्यक भाषण न लिखें।
4. अति महत्वपूर्ण: यदि सवाल पूछ रहे हैं, तो केवल सवाल पूछें — एक ही संदेश में सवाल और चरण 2/क्लोजिंग संदेश कभी न मिलाएं।
5. जब मरीज के मुख्य लक्षण, अवधि, तीव्रता, संबंधित लक्षण और दवाइयों की जानकारी पूरी हो जाए और कोई सवाल न पूछना हो, तभी केवल स्पष्ट क्लोजिंग संदेश दें कि विवरण दर्ज हो गया है और अब अगले चरण पर बढ़ रहे हैं।`
      : `You are the 'MediKiosk' Lead AI Triage Doctor.
Engage with the patient in a warm, professional, empathetic, and highly conversational manner.
Based on the patient's complaint, ask exactly ONE (1) relevant, concise clinical follow-up question following the OLDCARTS framework (onset/duration, quality/sensation, severity 1-10, associated symptoms, prior meds/history).

CRITICAL RULES:
1. NEVER repeat questions for information the patient already provided.
2. Ask exactly ONE single clear question at a time.
3. Do NOT output any preamble, meta-analysis, thinking tags, or internal monologue.
4. If asking a question, ONLY ask the question — NEVER combine a question with a closing/transition statement in the same message.
5. Only output a closing statement on a turn where all essential details are gathered and you are NOT asking anything further.`;

    let reply = '';
    let usedProvider = 'clinical-rules-engine';

    // --------------------------------------------------------------------------
    // 1. GROQ PROVIDER (Primary / Active)
    // --------------------------------------------------------------------------
    if ((activeProvider === 'groq' || (!geminiKey && groqKey)) && groqKey.length > 5) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        // Current verified active Groq models (Primary: openai/gpt-oss-120b, Fallback: openai/gpt-oss-20b, qwen/qwen3.6-27b)
        const candidateModels = [
          'openai/gpt-oss-120b',
          'openai/gpt-oss-20b',
          'qwen/qwen3.6-27b',
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
              max_completion_tokens: 500,
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
      console.warn('[API Route /api/ai/chat] ⚠️ FALLBACK WARNING: All AI model providers (Groq/Gemini) failed or unavailable. Falling back to local clinical rules engine.');
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
