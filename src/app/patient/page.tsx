'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  UserCheck, 
  Stethoscope, 
  ShieldCheck, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Languages, 
  RotateCcw,
  Building2,
  Phone,
  Flame,
  Check,
  ChevronRight,
  HeartPulse
} from 'lucide-react';
import { RoleGuard } from '@/components/common/RoleGuard';
import { VoiceVisualizer } from '@/components/kiosk/VoiceVisualizer';
import { speechService } from '@/lib/providers/speech';
import { ocrProvider, DocumentOCRResult } from '@/lib/providers/ocr';
import { evaluateRedFlags } from '@/lib/rules/red-flags';
import { generateStructuredClinicalSummary } from '@/lib/providers/summary';
import { dataService } from '@/lib/supabase/service';
import { mockDB } from '@/lib/supabase/mock-db';
import { useAuth } from '@/lib/auth';
import { Patient, Encounter, AISummary } from '@/types/clinical';

export default function PatientPortalPage() {
  const { currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState<'talk' | 'questions' | 'documents' | 'review' | 'tracker'>('talk');
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');
  const [activePatient, setActivePatient] = useState<Patient>(mockDB.getState().patients[0]);
  
  // Voice & Chat State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'patient'; text: string }>>([
    {
      sender: 'ai',
      text: language === 'hi' 
        ? 'नमस्ते! मैं आपका एआई स्वास्थ्य सहायक हूँ। कृपया अपनी परेशानी या लक्षण विस्तार से बताएं (जैसे सीने में दर्द, बुखार, जोड़ों का दर्द)।'
        : 'Hello! I am your AI Health Assistant. Please tell me naturally what symptoms or health issue you are experiencing today.',
    }
  ]);

  // Clarifying Questions State (Step 2)
  const [answers, setAnswers] = useState<Record<string, any>>({
    severity: 8,
    onset: '<1_hour',
    character: 'crushing_pressure',
    radiation: ['left_arm', 'jaw_neck'],
    associated_symptoms: ['sweating', 'dyspnea'],
    past_medical_history: ['hypertension'],
    allergies: 'penicillin_allergy',
  });

  // Document Upload State (Step 3)
  const [uploadedDocs, setUploadedDocs] = useState<DocumentOCRResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Encounter & Summary State (Step 4 & 5)
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<AISummary | null>(null);
  const [recommendedSpecialty, setRecommendedSpecialty] = useState<string>('Cardiology');

  useEffect(() => {
    const loadPatientData = () => {
      const state = mockDB.getState();
      const patient = state.patients.find(p => p.id === currentUser.id) || state.patients[0];
      setActivePatient(patient);
      
      const encounters = state.encounters.filter(e => e.patient_id === patient.id);
      if (encounters.length > 0) {
        setCurrentEncounter(encounters[0]);
        const summary = state.aiSummaries.find(s => s.encounter_id === encounters[0].id);
        if (summary) setGeneratedSummary(summary);
      }
    };
    loadPatientData();
    const unsubscribe = mockDB.subscribe(loadPatientData);
    return () => unsubscribe();
  }, [currentUser]);

  // Voice Interaction Handlers
  const handleVoiceToggle = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      speechService.startListening(
        language,
        (text: string, isFinal: boolean) => {
          setLiveTranscript(text);
          setInputText(text);
          if (isFinal && text.trim().length > 0) {
            handleSendMessage(text);
            speechService.stopListening();
            setIsListening(false);
          }
        },
        (err: any) => {
          console.error('Speech recognition error:', err);
          setIsListening(false);
        }
      );
    }
  };

  const handleReplayPrompt = () => {
    const lastAiMsg = [...chatMessages].reverse().find(m => m.sender === 'ai');
    if (lastAiMsg) {
      setIsSpeaking(true);
      speechService.speak(lastAiMsg.text, language, () => setIsSpeaking(false));
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const updatedMessages = [...chatMessages, { sender: 'patient' as const, text }];
    setChatMessages(updatedMessages);
    setInputText('');
    setLiveTranscript('');

    setTimeout(() => {
      const lower = text.toLowerCase();
      let aiReply = '';
      let detectedSpecialty = 'General Medicine';

      if (lower.includes('chest') || lower.includes('pain') || lower.includes('सीना') || lower.includes('दर्द') || lower.includes('pressure') || lower.includes('heart')) {
        detectedSpecialty = 'Cardiology';
        aiReply = language === 'hi'
          ? 'मैंने आपके सीने में दर्द और दबाव के बारे में समझ लिया है। यह महत्वपूर्ण लक्षण है। आइए कुछ संक्षिप्त फॉलो-अप प्रश्नों के उत्तर दें ताकि हम सटीक कार्डियोलॉजिस्ट असाइन कर सकें।'
          : 'I have noted your chest discomfort. This is an important symptom. Let us proceed to a few quick clarifying questions so our clinical team can assign a specialist.';
      } else if (lower.includes('joint') || lower.includes('knee') || lower.includes('घुटने') || lower.includes('जोड़ों')) {
        detectedSpecialty = 'Ayurveda & AYUSH';
        aiReply = language === 'hi'
          ? 'जोड़ों के दर्द और अकड़न के लक्षणों को दर्ज कर लिया गया है। आइए कुछ फॉलो-अप सवालों के साथ आगे बढ़ते हैं।'
          : 'I have noted your joint stiffness and knee discomfort. Let us proceed to structured follow-up questions.';
      } else {
        detectedSpecialty = 'General Medicine';
        aiReply = language === 'hi'
          ? 'आपके लक्षणों को दर्ज कर लिया गया है। कृपया आगे के प्रश्नों के उत्तर दें।'
          : 'Your symptoms have been recorded. Let us answer a few quick clarifying questions.';
      }

      setRecommendedSpecialty(detectedSpecialty);
      setChatMessages([...updatedMessages, { sender: 'ai', text: aiReply }]);

      setIsSpeaking(true);
      speechService.speak(aiReply, language, () => setIsSpeaking(false));
    }, 600);
  };

  const handleMoveToQuestions = () => {
    speechService.stopSpeaking();
    speechService.stopListening();
    setIsListening(false);
    setIsSpeaking(false);
    setActiveStep('questions');
  };

  const handleSimulatedDocUpload = async (docType: 'prescription' | 'lab') => {
    setIsUploading(true);
    const mockFile = {
      name: docType === 'prescription' ? 'MaxHospital_Cardio_Prescription.pdf' : 'DrLalPathLabs_Lipid_Panel.jpg',
      type: docType === 'prescription' ? 'application/pdf' : 'image/jpeg',
      size: 1024 * 350,
    };
    const result = await ocrProvider.processDocument(mockFile);
    setUploadedDocs(prev => [...prev, result]);
    setIsUploading(false);
  };

  const handleSubmitIntake = async () => {
    const redFlagResult = evaluateRedFlags('chest_pain', answers);

    const encounter = await dataService.createEncounter({
      patient_id: activePatient.id,
      kiosk_id: '11111111-1111-1111-1111-111111111111',
      department_id: recommendedSpecialty === 'Cardiology' ? 'd1111111-1111-1111-1111-111111111111' : 'd2222222-2222-2222-2222-222222222222',
      recommended_specialty: recommendedSpecialty,
      status: 'submitted_waiting_assignment',
      priority: redFlagResult.hasRedFlag ? 'EMERGENCY' : 'GREEN',
      is_emergency: redFlagResult.hasRedFlag,
      emergency_rationale: redFlagResult.rationale,
      is_ayush_encounter: recommendedSpecialty.includes('Ayush'),
      chief_complaint_summary: `Acute ${recommendedSpecialty} intake: ${answers.character || 'discomfort'} (Severity: ${answers.severity || 8}/10)`,
      intake_started_at: new Date(Date.now() - 600000).toISOString(),
    });

    const summaryDraft = generateStructuredClinicalSummary({
      patient: activePatient,
      encounter,
      chiefComplaint: 'chest_pain',
      answers,
      medications: mockDB.getState().medications.filter(m => m.patient_id === activePatient.id),
      allergies: mockDB.getState().allergies.filter(a => a.patient_id === activePatient.id),
      investigations: mockDB.getState().investigations.filter(i => i.patient_id === activePatient.id),
      timeline: mockDB.getState().timelineEvents.filter(t => t.patient_id === activePatient.id),
      redFlagResult,
      isAyushMode: false,
    });

    const savedSummary = await dataService.saveAISummary(summaryDraft);
    setCurrentEncounter(encounter);
    setGeneratedSummary(savedSummary);
    setActiveStep('tracker');
  };

  return (
    <RoleGuard allowedRoles={['patient', 'doctor', 'admin']} stationName="Patient Care Portal">
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 gap-6">
        
        {/* Top Patient Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">{activePatient.full_name}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  ABHA: {activePatient.abha_id || activePatient.demo_id}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {activePatient.age_years}Y · {activePatient.gender.toUpperCase()} · Phone: {activePatient.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              className="px-3.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs hover:bg-slate-100"
            >
              <Languages className="w-4 h-4 text-sky-500" />
              <span>{language === 'hi' ? 'हिन्दी (Hindi)' : 'English'}</span>
            </button>

            {currentEncounter && (
              <button
                onClick={() => setActiveStep('tracker')}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 font-bold text-white text-xs shadow-md transition-all flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>My Appointment</span>
              </button>
            )}
          </div>
        </div>

        {/* Guided Step Progress Bar */}
        <div className="grid grid-cols-5 gap-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border text-center text-xs font-bold">
          {[
            { id: 'talk', label: language === 'hi' ? '1. बातचीत' : '1. Talk to AI' },
            { id: 'questions', label: language === 'hi' ? '2. प्रश्न' : '2. Questions' },
            { id: 'documents', label: language === 'hi' ? '3. दस्तावेज़' : '3. Documents' },
            { id: 'review', label: language === 'hi' ? '4. सारांश' : '4. AI Summary' },
            { id: 'tracker', label: language === 'hi' ? '5. अपॉइंटमेंट' : '5. Appointment' },
          ].map((s) => {
            const isActive = activeStep === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.id as any)}
                className={`py-2 px-1 rounded-xl transition-all ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: VOICE-FIRST OPEN AI CONVERSATION */}
        {/* ========================================================================= */}
        {activeStep === 'talk' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <div className="text-center max-w-xl mx-auto">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950 text-sky-600 mb-2 inline-block">
                Voice & Text Intake
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'कृपया अपनी परेशानी खुलकर बताएं' : 'Tell the AI doctor about your health concern'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'hi' ? 'माइक बटन दबाकर बोलें या नीचे टेक्स्ट बॉक्स में लिखें।' : 'Tap the microphone to speak naturally or type in the box below.'}
              </p>
            </div>

            {/* Voice Wave Visualizer */}
            <div className="flex justify-center my-2">
              <VoiceVisualizer
                isListening={isListening}
                isSpeaking={isSpeaking}
                transcript={liveTranscript}
                onToggleMic={handleVoiceToggle}
                onReplayAudioPrompt={handleReplayPrompt}
                language={language}
              />
            </div>

            {/* Conversation Messages Feed */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'patient'
                      ? 'bg-sky-500 text-white rounded-br-none shadow-sm'
                      : 'bg-white dark:bg-slate-900 border text-slate-800 dark:text-slate-200 rounded-bl-none shadow-2xs'
                  }`}>
                    <p className="font-semibold">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Voice & Text Input Bar */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleVoiceToggle}
                className={`p-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30'
                    : 'bg-sky-500 text-white hover:bg-sky-600 shadow-sky-500/20'
                }`}
                title={isListening ? 'Stop Listening' : 'Speak via Microphone'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={language === 'hi' ? 'यहाँ अपनी समस्या टाइप करें या बोलें...' : 'Type your symptoms or click the mic to speak...'}
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
              />

              <button
                onClick={() => handleSendMessage()}
                className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Sample Prompts & Next Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-slate-400 self-center text-[11px]">Examples:</span>
                <button
                  onClick={() => handleSendMessage(language === 'hi' ? 'सीने में 2 घंटे से भारी दबाव और पसीना आ रहा है' : 'I have crushing chest pressure radiating to my left arm with cold sweats for 2 hours')}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px]"
                >
                  ⚡ {language === 'hi' ? 'सीने में भारी दबाव (Chest Pain)' : 'Chest Pressure & Sweats'}
                </button>
                <button
                  onClick={() => handleSendMessage(language === 'hi' ? 'दोनों घुटनों में दर्द और चलने में अकड़न है' : 'I have severe knee joint stiffness and difficulty walking in morning')}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px]"
                >
                  🌿 {language === 'hi' ? 'घुटनों में दर्द (Joint Pain / AYUSH)' : 'Knee Joint Pain (AYUSH)'}
                </button>
              </div>

              <button
                onClick={handleMoveToQuestions}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 font-bold text-white text-xs shadow-md transition-all flex items-center gap-1.5 ml-auto"
              >
                <span>Continue to Follow-Up Questions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: STRUCTURED CLARIFYING QUESTIONS */}
        {/* ========================================================================= */}
        {activeStep === 'questions' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950 text-purple-600 mb-2 inline-block">
                Step 2 · Clarifying Details
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'कुछ संक्षिप्त चिकित्सीय प्रश्न' : 'A few clarifying questions'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                You can answer by tapping the cards below or speaking your answer.
              </p>
            </div>

            <div className="space-y-6">
              {/* Question 1: Severity */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
                  1. Pain & Discomfort Intensity: <strong className="text-rose-500 font-extrabold text-sm">{answers.severity || 8} / 10</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={answers.severity || 8}
                  onChange={(e) => setAnswers({ ...answers, severity: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-2">
                  <span>1 (Mild Discomfort)</span>
                  <span>5 (Moderate Pain)</span>
                  <span>10 (Severe / Unbearable)</span>
                </div>
              </div>

              {/* Question 2: Onset Options */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
                  2. Symptom Duration & Onset
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: '<1_hour', label: 'Less than 1 hour ago (Acute / Sudden)' },
                    { key: '2_to_6_hours', label: '2 to 6 hours ago' },
                    { key: '1_to_3_days', label: '1 to 3 days ago' },
                    { key: 'weeks', label: 'Chronic (Several weeks / months)' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setAnswers({ ...answers, onset: opt.key })}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                        answers.onset === opt.key
                          ? 'bg-sky-500 text-white border-sky-500 shadow-md'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3: Character */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
                  3. Sensation Character
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'crushing_pressure', label: 'Crushing heavy pressure / squeezing' },
                    { key: 'sharp_stabbing', label: 'Sharp stabbing on breathing' },
                    { key: 'burning', label: 'Burning sensation' },
                    { key: 'joint_stiffness', label: 'Joint stiffness & morning ache' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setAnswers({ ...answers, character: opt.key })}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                        answers.character === opt.key
                          ? 'bg-sky-500 text-white border-sky-500 shadow-md'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <button
                onClick={() => setActiveStep('talk')}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                ← Back to Conversation
              </button>

              <button
                onClick={() => setActiveStep('documents')}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 font-bold text-white text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Continue to Document Upload</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: DOCUMENT UPLOAD */}
        {/* ========================================================================= */}
        {activeStep === 'documents' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-600 mb-2 inline-block">
                Step 3 · Document Upload
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'पिछले पर्चे या लैब रिपोर्ट अपलोड करें' : 'Upload recent prescriptions or laboratory reports'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                The AI automatically extracts medications, past diagnoses, and abnormal lab ranges with source attribution.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleSimulatedDocUpload('prescription')}
                disabled={isUploading}
                className="p-6 rounded-2xl border-2 border-dashed border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20 hover:border-sky-500 transition-all flex flex-col items-center justify-center text-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <strong className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  + Upload Previous Doctor Prescription
                </strong>
                <span className="text-[11px] text-slate-400">PDF, JPG, PNG (Simulate Max Hospital Cardio Rx)</span>
              </button>

              <button
                onClick={() => handleSimulatedDocUpload('lab')}
                disabled={isUploading}
                className="p-6 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500 transition-all flex flex-col items-center justify-center text-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <strong className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  + Upload Recent Lab Report (Lipid / Blood)
                </strong>
                <span className="text-[11px] text-slate-400">PDF, JPG (Simulate Lal PathLabs Panel)</span>
              </button>
            </div>

            {uploadedDocs.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Successfully Analyzed Documents ({uploadedDocs.length})
                </h4>
                {uploadedDocs.map((doc, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{doc.fileName}</p>
                        <p className="text-[11px] text-slate-400">Extracted {doc.documentType} · Confidence: {Math.round(doc.confidenceScore * 100)}%</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Extracted
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <button
                onClick={() => setActiveStep('questions')}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                ← Back
              </button>

              <button
                onClick={() => setActiveStep('review')}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 font-bold text-white text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Generate Clinical Summary & Specialty</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: AI SUMMARY & RECOMMENDED SPECIALTY REVIEW */}
        {/* ========================================================================= */}
        {activeStep === 'review' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300">
                  AI-generated draft — physician verification required
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                  Clinical Intake Summary & Recommended Specialty
                </h2>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Recommended Specialty:</span>
                <div className="px-3 py-1 rounded-xl bg-sky-500 text-white font-extrabold text-xs shadow-sm mt-0.5">
                  {recommendedSpecialty}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3 text-xs">
              <Flame className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <p className="font-bold text-rose-600 dark:text-rose-400">
                  Emergency Triage Priority Triggered (Acuity: RED)
                </p>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                  Suspected Acute Coronary Syndrome (ACS). This intake will jump directly to the top of the Admin & Doctor queue.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border">
              <div>
                <strong className="text-slate-400 uppercase text-[10px]">Chief Complaint & History:</strong>
                <p className="text-slate-800 dark:text-slate-200 mt-1 font-semibold">
                  Acute substernal crushing chest pressure radiating to left arm (Severity: {answers.severity || 8}/10, Onset: {answers.onset || '<1_hour'}).
                </p>
              </div>

              <div>
                <strong className="text-slate-400 uppercase text-[10px]">Current Medications (Source Attributed):</strong>
                <p className="text-slate-800 dark:text-slate-200 mt-1">
                  Tab Telmisartan 40mg OD [Patient Stated], Tab Atorvastatin 20mg HS [Document OCR].
                </p>
              </div>

              <div>
                <strong className="text-slate-400 uppercase text-[10px]">Allergies:</strong>
                <p className="text-rose-600 dark:text-rose-400 font-bold mt-1">
                  Severe Penicillin Allergy (Urticaria & Facial Angioedema).
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <button
                onClick={() => setActiveStep('documents')}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                ← Back
              </button>

              <button
                onClick={handleSubmitIntake}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Intake & Request Doctor Assignment</span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: STATUS TRACKER & CONFIRMED APPOINTMENT CARD */}
        {/* ========================================================================= */}
        {activeStep === 'tracker' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            
            <div className="text-center max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {currentEncounter?.status === 'appointment_confirmed'
                  ? 'Your Appointment is Confirmed!'
                  : currentEncounter?.status === 'appointment_proposed'
                  ? 'Doctor Assigned — Appointment Time Proposed'
                  : currentEncounter?.status === 'doctor_assigned'
                  ? 'Doctor Assigned — Preparing Slot'
                  : 'Intake Submitted — Waiting for Doctor Assignment'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Reference ID: <strong className="font-mono text-slate-800 dark:text-slate-200">{currentEncounter?.id.slice(0, 12)}...</strong>
              </p>
            </div>

            {/* Lifecycle Status Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300">
                <span className="font-bold">✓ 1. Intake Submitted</span>
                <p className="text-[11px] text-slate-500 mt-0.5">AI summary & specialty ready</p>
              </div>

              <div className={`p-3 rounded-xl border ${
                currentEncounter?.assigned_doctor_id 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-400'
              }`}>
                <span>{currentEncounter?.assigned_doctor_id ? '✓ 2. Doctor Assigned' : '2. Doctor Assignment'}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">By Hospital Admin</p>
              </div>

              <div className={`p-3 rounded-xl border ${
                currentEncounter?.proposed_appointment_time 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-400'
              }`}>
                <span>{currentEncounter?.proposed_appointment_time ? '✓ 3. Slot Proposed' : '3. Doctor Review'}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">By Attending Physician</p>
              </div>

              <div className={`p-3 rounded-xl border ${
                currentEncounter?.status === 'appointment_confirmed'
                  ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-400'
              }`}>
                <span>{currentEncounter?.status === 'appointment_confirmed' ? '✓ 4. Confirmed' : '4. Admin Confirm'}</span>
                <p className="text-[11px] text-slate-800 dark:text-slate-200 mt-0.5">Ready for consult</p>
              </div>
            </div>

            {/* CONFIRMED APPOINTMENT CARD */}
            {currentEncounter?.status === 'appointment_confirmed' ? (
              <div className="p-6 rounded-3xl bg-gradient-to-tr from-sky-50 to-emerald-50 dark:from-sky-950/40 dark:to-emerald-950/40 border-2 border-emerald-500 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-sm uppercase">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Official Confirmed Appointment</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950">
                    CONFIRMED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Assigned Physician:</span>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                      Dr. Arvind Sen, MD DM
                    </p>
                    <p className="text-slate-500 text-[11px]">Specialty: Cardiology & Internal Medicine</p>
                  </div>

                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Appointment Date & Time:</span>
                    <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {currentEncounter.confirmed_appointment_time || 'Today, 03:30 PM'}
                    </p>
                    <p className="text-slate-500 text-[11px]">Mode: In-Person (Cardiology Suite 204)</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border text-xs text-slate-700 dark:text-slate-300">
                  <strong>Consultation Note:</strong> {currentEncounter.doctor_proposed_notes || 'Patient assessed for acute chest pressure. 12-lead ECG and physical examination ready.'}
                </div>

                <p className="text-[11px] text-slate-500 text-center">
                  Please arrive 10 minutes prior with your original ID. Your doctor already has your complete pre-visit clinical history.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border text-center text-xs text-slate-500 space-y-2">
                <Clock className="w-6 h-6 text-sky-500 mx-auto animate-spin" />
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Admin is assigning the matching {recommendedSpecialty} physician...
                </p>
                <p className="text-[11px] text-slate-400">
                  Switch to the <strong>Admin Portal</strong> to assign a doctor or to the <strong>Doctor Hub</strong> to propose appointment slots.
                </p>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button
                onClick={() => {
                  setActiveStep('talk');
                  setChatMessages([{
                    sender: 'ai',
                    text: language === 'hi' 
                      ? 'नमस्ते! मैं आपका एआई स्वास्थ्य सहायक हूँ। कृपया अपनी परेशानी विस्तार से बताएं।'
                      : 'Hello! I am your AI Health Assistant. Please tell me naturally what symptoms you are experiencing today.'
                  }]);
                }}
                className="px-4 py-2 rounded-xl border text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Start New Intake Conversation</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </RoleGuard>
  );
}
