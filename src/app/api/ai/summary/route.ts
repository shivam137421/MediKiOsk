import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import { sanitizeAIResponse } from '@/lib/ontology/adaptive-interview';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const {
      patient,
      encounter,
      chiefComplaint,
      conversationTurns,
      clinicalSlots,
      ayushAnswers,
      uploadedDocs,
      redFlagResult,
      recommendedSpecialty,
    } = payload;

    const groqKey = (process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || '').trim();
    const geminiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '').trim();

    // Format all patient inputs into a structured clinical prompt
    const patientContext = `
PATIENT IDENTIFICATION & DEMOGRAPHICS:
- Full Name: ${patient?.full_name || 'Patient'}
- Age: ${patient?.age_years || 'Unknown'} Years | Gender: ${patient?.gender?.toUpperCase() || 'Unknown'}
- ABHA ID: ${patient?.abha_id || patient?.demo_id || 'N/A'}
- Phone: ${patient?.phone || 'N/A'}
- Primary Language: ${patient?.preferred_language || 'hi'}

STEP 1 — CLINICAL INTERVIEW & CONVERSATION TRANSCRIPT:
- Primary Chief Complaint: ${chiefComplaint || clinicalSlots?.chiefComplaint || 'Unspecified complaint'}
- Pain Severity Score: ${clinicalSlots?.severityNumber ? `${clinicalSlots.severityNumber}/10` : 'Not rated'}
- Onset & Duration: ${clinicalSlots?.durationOnset || 'Not specified'}
- Sensation / Quality: ${clinicalSlots?.characterQuality || 'Not specified'}
- Radiation: ${clinicalSlots?.radiationLocation || 'None reported'}
- Associated Symptoms: ${clinicalSlots?.associatedSymptoms?.join(', ') || 'None reported'}
- Stated Past Medical History: ${clinicalSlots?.pastHistory?.join(', ') || 'None reported'}
- Dialogue Transcript:
${(conversationTurns || [])
  .map((t: any) => `  [${t.role === 'ai' || t.role === 'assistant' ? 'AI Doctor' : 'Patient'}]: "${t.content || t.text}"`)
  .join('\n') || '  (No conversation transcript recorded)'}

STEP 2 — AYURVEDIC & CONSTITUTIONAL ASSESSMENT (TRIVIDHA / ASHTAVIDHA / DASHAVIDHA):
${ayushAnswers && Object.keys(ayushAnswers).length > 0 ? `
- Prakriti (Natural Constitution): ${ayushAnswers.prakritiPrimary || 'Unspecified'} ${ayushAnswers.prakritiNotes ? `("${ayushAnswers.prakritiNotes}")` : ''}
- Vikriti (Current Dosha Imbalance / Symptoms): ${Array.isArray(ayushAnswers.vikritiSymptoms) ? ayushAnswers.vikritiSymptoms.join(', ') : (ayushAnswers.vikritiDosha || 'None reported')} ${ayushAnswers.vikritiNotes ? `("${ayushAnswers.vikritiNotes}")` : ''}
- Agni (Digestive Fire): ${ayushAnswers.agniType || 'Unspecified'} ${ayushAnswers.agniNotes ? `("${ayushAnswers.agniNotes}")` : ''}
- Koshtha (Bowel Habit): ${ayushAnswers.koshthaType || 'Unspecified'} ${ayushAnswers.koshthaNotes ? `("${ayushAnswers.koshthaNotes}")` : ''}
- Mutra (Urinary Symptoms): ${Array.isArray(ayushAnswers.mutraPattern) ? ayushAnswers.mutraPattern.join(', ') : (ayushAnswers.mutraPattern || 'Unspecified')} ${ayushAnswers.mutraNotes ? `("${ayushAnswers.mutraNotes}")` : ''}
- Jihva (Tongue Examination): ${ayushAnswers.jihvaStatus || 'Unspecified'} ${ayushAnswers.jihvaNotes ? `("${ayushAnswers.jihvaNotes}")` : ''}
- Satva & Nidra (Sleep & Mind): ${Array.isArray(ayushAnswers.sleepMind) ? ayushAnswers.sleepMind.join(', ') : (ayushAnswers.sleepMind || 'Unspecified')} ${ayushAnswers.sleepNotes ? `("${ayushAnswers.sleepNotes}")` : ''}
- Bala (Physical Stamina): ${ayushAnswers.balaEnergy || 'Unspecified'} ${ayushAnswers.balaNotes ? `("${ayushAnswers.balaNotes}")` : ''}
- Ahara (Dietary Habits): ${Array.isArray(ayushAnswers.aharaHabits) ? ayushAnswers.aharaHabits.join(', ') : (ayushAnswers.aharaHabits || 'Unspecified')} ${ayushAnswers.aharaNotes ? `("${ayushAnswers.aharaNotes}")` : ''}
- Vihara (Lifestyle & Routine): ${Array.isArray(ayushAnswers.viharaHabits) ? ayushAnswers.viharaHabits.join(', ') : (ayushAnswers.viharaHabits || 'Unspecified')} ${ayushAnswers.viharaNotes ? `("${ayushAnswers.viharaNotes}")` : ''}
- Dhatu Affected: ${Array.isArray(ayushAnswers.dhatuAffected) ? ayushAnswers.dhatuAffected.join(', ') : (ayushAnswers.dhatuAffected || 'Unspecified')} ${ayushAnswers.dhatuNotes ? `("${ayushAnswers.dhatuNotes}")` : ''}
- Nidana (Triggers & Aggravating Factors): ${Array.isArray(ayushAnswers.nidanaTriggers) ? ayushAnswers.nidanaTriggers.join(', ') : (ayushAnswers.nidanaTriggers || 'Unspecified')} ${ayushAnswers.nidanaNotes ? `("${ayushAnswers.nidanaNotes}")` : ''}
` : '- Ayurvedic Assessment: Unselected / Not completed for this encounter.'}

STEP 3 — UPLOADED MEDICAL DOCUMENTS & EXTRACTED OCR:
${uploadedDocs && uploadedDocs.length > 0 ? (uploadedDocs as any[]).map((d: any, idx: number) => `
[Document ${idx + 1}] File: ${d.fileName || d.file_name} (${d.documentType || d.document_category || 'Medical Report'})
- OCR Confidence: ${Math.round((d.confidenceScore || d.ocr_confidence || 0.9) * 100)}%
- Extracted Entities: ${JSON.stringify(d.extractedEntities || d.extracted_entities || {})}
- Raw OCR Text:
"""
${(d.rawText || d.extracted_text || '').slice(0, 1000)}
"""
`).join('\n') : '- No prior medical documents uploaded.'}

STEP 4 — CLINICAL TRIAGE FLAGS & SPECIALTY DIRECTIVE:
- Emergency Priority: ${redFlagResult?.hasRedFlag || encounter?.is_emergency ? 'CRITICAL EMERGENCY' : 'STANDARD / ROUTINE'}
- Sentinel Red Flag Alert: ${redFlagResult?.rationale || encounter?.emergency_rationale || 'None triggered'}
- Target OPD Specialty: ${recommendedSpecialty || encounter?.recommended_specialty || 'General Medicine'}
`;

    const systemPrompt = `You are the Lead Clinical Synthesizer & Medical Documentation AI at MediKiosk.
Your responsibility is to synthesize a structured, professional, HIPAA/NDHM-compliant Clinical SOAP & Ayush Intake Summary from the gathered encounter data.

CRITICAL CLINICAL INTEGRITY RULES:
1. STRICT TRUTHFULNESS & GROUNDING: Include ONLY the patient's actual reported symptoms, uploaded OCR documents, and Ayush questionnaire responses. NEVER invent or hallucinate cardiac medications (like Atorvastatin/Telmisartan) or cardiac complaints for an orthopedic/knee or gastric patient.
2. CONCISE & STRUCTURED FORMAT: Generate clean, formatted Markdown using standard clinical headings:
   - ## CLINICAL TRIAGE & PATIENT IDENTIFICATION
   - ## CHIEF COMPLAINT (CC) & HISTORY OF PRESENT ILLNESS (HPI)
   - ## REVIEW OF SYSTEMS & ASSOCIATED FINDINGS
   - ## AYUSH & CONSTITUTIONAL EVALUATION (Prakriti, Vikriti, Agni, Dhatu)
   - ## PAST MEDICAL HISTORY & CURRENT MEDICATIONS (Attributed to Patient Stated vs Document OCR)
   - ## DIAGNOSTIC OCR & LABORATORY FINDINGS
   - ## CLINICAL IMPRESSION & DIFFERENTIAL CONSIDERATIONS
   - ## RECOMMENDED TRIAGE DISPOSITION & ACTION PLAN
3. TONE: Objective, clinical, and precise.`;

    let generatedMarkdown = '';
    let usedModel = 'deterministic-fallback';

    // 1. Try Groq (Primary & Fast Fallback chain)
    if (groqKey && groqKey.length > 5) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        const candidateModels = [
          'openai/gpt-oss-120b',
          'openai/gpt-oss-20b',
          'qwen/qwen3.6-27b',
        ];

        for (const model of candidateModels) {
          try {
            const completion = await groq.chat.completions.create({
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Synthesize the complete, grounded clinical summary for this patient:\n\n${patientContext}` },
              ],
              model,
              temperature: 0.2,
              max_completion_tokens: 2500,
            });

            let rawText = completion.choices[0]?.message?.content?.trim() || '';
            let cleaned = sanitizeAIResponse(rawText);
            if (cleaned && cleaned.length > 50) {
              generatedMarkdown = cleaned;
              usedModel = `groq (${model})`;
              break;
            }
          } catch (modelErr: any) {
            console.warn(`[API Route /api/ai/summary] Groq model ${model} error:`, modelErr?.message || modelErr);
          }
        }
      } catch (err: any) {
        console.warn('[API Route /api/ai/summary] Groq client error:', err?.message || err);
      }
    }

    // 2. Try Gemini
    if (!generatedMarkdown && geminiKey && geminiKey.length > 10) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const result = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nPatient Data:\n${patientContext}` }] }
          ],
          config: {
            temperature: 0.2,
            maxOutputTokens: 1200,
          }
        });
        const rawText = result.text?.trim() || '';
        const cleaned = sanitizeAIResponse(rawText);
        if (cleaned && cleaned.length > 50) {
          generatedMarkdown = cleaned;
          usedModel = 'gemini-1.5-flash';
        }
      } catch (geminiErr: any) {
        console.warn('[API Route /api/ai/summary] Gemini generation error:', geminiErr?.message || geminiErr);
      }
    }

    if (!generatedMarkdown) {
      console.warn('[API Route /api/ai/summary] ⚠️ FALLBACK WARNING: All AI summary providers failed or unavailable. Falling back to local deterministic summary generator.');
    }

    return NextResponse.json({
      summaryMarkdown: generatedMarkdown,
      usedModel,
      success: Boolean(generatedMarkdown),
    });
  } catch (error: any) {
    console.error('[API Route /api/ai/summary] Fatal error:', error);
    return NextResponse.json({ error: 'Failed to synthesize AI clinical summary' }, { status: 500 });
  }
}
