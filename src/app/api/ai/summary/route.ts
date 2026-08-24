import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';

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
- Mutra (Urinary Pattern): ${Array.isArray(ayushAnswers.mutraPattern) ? ayushAnswers.mutraPattern.join(', ') : 'Unspecified'}
- Jihva (Tongue & Taste): ${ayushAnswers.jihvaStatus || 'Unspecified'}
- Nidra & Manas (Sleep & Mental State): ${Array.isArray(ayushAnswers.sleepMind) ? ayushAnswers.sleepMind.join(', ') : 'Unspecified'}
- Bala (Physical Stamina & Energy): ${ayushAnswers.balaEnergy || 'Unspecified'}
- Ahara (Dietary Habits): ${Array.isArray(ayushAnswers.aharaHabits) ? ayushAnswers.aharaHabits.join(', ') : 'Unspecified'}
- Vihara (Daily Lifestyle): ${Array.isArray(ayushAnswers.viharaHabits) ? ayushAnswers.viharaHabits.join(', ') : 'Unspecified'}
- Dhatu & Srotas Affected: ${Array.isArray(ayushAnswers.dhatuAffected) ? ayushAnswers.dhatuAffected.join(', ') : 'Unspecified'}
- Nidana & Triggers: ${Array.isArray(ayushAnswers.nidanaTriggers) ? ayushAnswers.nidanaTriggers.join(', ') : 'Unspecified'}
` : '- Step 2 status: Patient did not fill out Ayurvedic questionnaire (Optional).'}

STEP 3 — UPLOADED MEDICAL DOCUMENTS & EXTRACTED OCR ENTITIES:
${uploadedDocs && uploadedDocs.length > 0 ? uploadedDocs.map((doc: any, i: number) => `
[Document ${i + 1}]: ${doc.fileName || doc.name} (${doc.documentType || doc.category})
- OCR Text / Excerpt: ${doc.rawText || 'Text extracted from file'}
- Extracted Diagnoses: ${doc.extractedEntities?.diagnoses?.join(', ') || 'None found'}
- Extracted Medications: ${doc.extractedEntities?.medications?.map((m: any) => `${m.drugName || m.name} ${m.strength || ''} (${m.frequency || ''})`).join('; ') || 'None found'}
- Extracted Lab Results: ${doc.extractedEntities?.labResults?.map((l: any) => `${l.testName}: ${l.resultValue} ${l.unit} ${l.isAbnormal ? '(ABNORMAL)' : '(Normal)'}`).join('; ') || 'None found'}
`).join('\n') : '- No previous medical documents were uploaded by the patient in this session.'}

TRIAGE & SAFETY SENTINEL:
- Triage Priority: ${redFlagResult?.priority || 'ROUTINE'} (${redFlagResult?.hasRedFlag ? 'EMERGENCY FAST-TRACK' : 'STANDARD CARE'})
- Triggered Red Flags: ${redFlagResult?.triggerSymptoms?.join(', ') || 'No emergency red flags triggered'}
- Clinical Rationale: ${redFlagResult?.rationale || 'Stable vital risk profile'}
- Recommended Specialty: ${recommendedSpecialty || 'General Medicine'}
`;

    const systemPrompt = `You are the Lead Clinical AI Scribe and Triage Physician at 'MediKiosk' Hospital.
Your task is to synthesize the patient's complete intake data (Step 1 Interview, Step 2 Ayurvedic Assessment, Step 3 Document Extractions, and Triage Evaluation) into a highly cohesive, advanced clinical summary.

CRITICAL MEDICAL & SAFETY RULES:
1. STRICT GROUNDING: NEVER invent, assume, or fabricate any medical facts, past diagnoses, medications, allergies, or lab results that are NOT explicitly present in the patient's data. If the patient has no medications or no uploaded documents, explicitly state "None reported" or "No prior diagnostic documents uploaded".
2. COHESIVE SYNTHESIS: Connect related findings across the interview, Ayurvedic assessment, and uploaded documents into one integrated clinical narrative rather than disconnected bullet points. For example, if a document mentions a medication and the interview mentions related symptoms, tie them together. If Ayurvedic Prakriti/Vikriti or Agni relates to the primary symptom, highlight the holistic correlation.
3. MANDATORY DISCLAIMER: The output must begin with "### **AI-generated draft — physician verification required.**".
4. STRUCTURE: Provide the summary in clean Markdown with the following clear sections:
   - Header with Patient Demographics, Triage Acuity, and Recommended Specialty
   - 1. Chief Complaint & History of Present Illness (HPI Narrative)
   - 2. Past Medical, Surgical & Chronic Disease History (PMH/PSH)
   - 3. Current Medications & Source Attribution (Patient Stated vs Document OCR)
   - 4. Allergies & Drug Sensitivities
   - 5. Laboratory & Diagnostic Extractions (from Uploaded Documents)
   - 6. Ayurvedic Clinical Assessment (Trividha / Ashtavidha Pariksha & Prakriti-Vikriti Analysis)
   - 7. Specialty Triage & Clinical Safety Sentinel`;

    let generatedMarkdown = '';
    let usedModel = 'deterministic-fallback';

    // 1. Try Groq
    if (groqKey && groqKey.length > 5) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Synthesize the complete, grounded clinical summary for this patient:\n\n${patientContext}` },
          ],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.2,
          max_completion_tokens: 1200,
        });

        let text = completion.choices[0]?.message?.content?.trim() || '';
        text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        if (text && text.length > 50) {
          generatedMarkdown = text;
          usedModel = 'groq (llama-3.3-70b-versatile)';
        }
      } catch (err: any) {
        console.warn('[API Route /api/ai/summary] Groq generation error:', err?.message || err);
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
        const text = result.text?.trim() || '';
        if (text && text.length > 50) {
          generatedMarkdown = text;
          usedModel = 'gemini-1.5-flash';
        }
      } catch (geminiErr: any) {
        console.warn('[API Route /api/ai/summary] Gemini generation error:', geminiErr?.message || geminiErr);
      }
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
