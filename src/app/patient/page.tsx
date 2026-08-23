'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  HeartPulse,
  Download,
  Leaf,
  Plus,
  Trash2,
  FileCheck
} from 'lucide-react';
import { RoleGuard } from '@/components/common/RoleGuard';
import { VoiceVisualizer } from '@/components/kiosk/VoiceVisualizer';
import { speechService } from '@/lib/providers/speech';
import { ocrProvider, DocumentOCRResult } from '@/lib/providers/ocr';
import { evaluateRedFlags } from '@/lib/rules/red-flags';
import { generateStructuredClinicalSummary } from '@/lib/providers/summary';
import { adaptiveInterviewEngine, ExtractedClinicalSlots, ClinicalConversationTurn } from '@/lib/ontology/adaptive-interview';
import { AYURVEDIC_QUESTIONS, AyurvedicAssessmentAnswers } from '@/lib/ontology/ayurvedic-assessment';
import { generateAndDownloadClinicalPDF } from '@/lib/pdf/pdf-generator';
import { dataService } from '@/lib/supabase/service';
import { mockDB } from '@/lib/supabase/mock-db';
import { useAuth } from '@/lib/auth';
import { Patient, Encounter, AISummary } from '@/types/clinical';

export default function PatientPortalPage() {
  const { currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState<'talk' | 'ayush' | 'documents' | 'review' | 'tracker'>('talk');
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');
  const [activePatient, setActivePatient] = useState<Patient>(mockDB.getState().patients[0]);
  
  // FIX 1: Voice & Adaptive Interview State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [clinicalSlots, setClinicalSlots] = useState<ExtractedClinicalSlots>({});
  const [conversationTurns, setConversationTurns] = useState<ClinicalConversationTurn[]>([
    {
      role: 'ai',
      content: language === 'hi' 
        ? 'नमस्ते! मैं आपका एआई स्वास्थ्य सहायक हूँ। कृपया अपनी परेशानी या लक्षण खुलकर बताएं (जैसे सीने में दर्द, बुखार, पेट दर्द या जोड़ों की तकलीफ)।'
        : 'Hello! I am your AI Health Assistant. Please tell me naturally what symptoms or health issue you are experiencing today.',
      timestamp: new Date().toISOString(),
      language: 'hi',
    }
  ]);

  // FIX 2: Ayurvedic Assessment State
  const [ayushAnswers, setAyushAnswers] = useState<AyurvedicAssessmentAnswers>({
    prakritiPrimary: 'vata_kapha',
    vikritiDosha: 'vata_vriddhi',
    agniType: 'manda_agni',
    koshthaType: 'krura',
    aharaHabits: 'sheeta_ruksha',
    dhatuAffected: ['asthi_majja'],
    customComments: '',
  });
  const [activeAyushTab, setActiveAyushTab] = useState<number>(0);

  // FIX 3: Document Upload State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFilesList, setUploadedFilesList] = useState<Array<{ name: string; size: number; type: string; category: string; ocrResult?: DocumentOCRResult }>>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  // FIX 4 & 5: Encounter & Summary State
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<AISummary | null>(null);
  const [recommendedSpecialty, setRecommendedSpecialty] = useState<string>('Cardiology');

  // Load existing data
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

  // Mid-conversation language switcher
  const handleLanguageSwitch = (newLang: 'hi' | 'en') => {
    setLanguage(newLang);
    // If in conversation, generate the next prompt in the newly selected language
    if (activeStep === 'talk' && conversationTurns.length > 0) {
      const nextQ = adaptiveInterviewEngine.generateNextQuestion(clinicalSlots, newLang, conversationTurns.length);
      const updated = [
        ...conversationTurns,
        {
          role: 'ai' as const,
          content: nextQ.questionText,
          timestamp: new Date().toISOString(),
          language: newLang,
        }
      ];
      setConversationTurns(updated);
      setIsSpeaking(true);
      speechService.speak(nextQ.questionText, newLang, () => setIsSpeaking(false));
    }
  };

  // FIX 1: Voice Listening Toggle
  const handleVoiceToggle = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      console.log(`[MediKiosk Speech] Starting ASR listening in language: ${language}`);
      speechService.startListening(
        language,
        (text: string, isFinal: boolean) => {
          console.log(`[MediKiosk Speech] Transcribed: "${text}" (isFinal: ${isFinal})`);
          setLiveTranscript(text);
          setInputText(text);
          if (isFinal && text.trim().length > 0) {
            handlePatientMessageSend(text);
            speechService.stopListening();
            setIsListening(false);
          }
        },
        (err: any) => {
          console.error('[MediKiosk Speech] ASR error:', err);
          setIsListening(false);
        }
      );
    }
  };

  const handleReplayPrompt = () => {
    const lastAiMsg = [...conversationTurns].reverse().find(m => m.role === 'ai');
    if (lastAiMsg) {
      setIsSpeaking(true);
      speechService.speak(lastAiMsg.content, language, () => setIsSpeaking(false));
    }
  };

  // FIX 1: Adaptive Turn Processing
  const handlePatientMessageSend = (textToSend?: string) => {
    const messageText = textToSend || inputText;
    if (!messageText.trim()) return;

    console.log(`[MediKiosk Interview] Processing turn: "${messageText}"`);

    // 1. Add patient turn
    const newTurns: ClinicalConversationTurn[] = [
      ...conversationTurns,
      {
        role: 'patient',
        content: messageText,
        timestamp: new Date().toISOString(),
      }
    ];
    setConversationTurns(newTurns);
    setInputText('');
    setLiveTranscript('');

    // 2. Parse Clinical Entities across OLDCARTS
    const updatedSlots = adaptiveInterviewEngine.parsePatientInput(messageText, clinicalSlots);
    setClinicalSlots(updatedSlots);

    if (updatedSlots.recommendedSpecialty) {
      setRecommendedSpecialty(updatedSlots.recommendedSpecialty);
    }

    // 3. Generate empathetic doctor follow-up question
    setTimeout(() => {
      const nextQuestion = adaptiveInterviewEngine.generateNextQuestion(
        updatedSlots,
        language,
        newTurns.filter(t => t.role === 'patient').length
      );

      const aiTurn: ClinicalConversationTurn = {
        role: 'ai',
        content: nextQuestion.questionText,
        timestamp: new Date().toISOString(),
        language,
      };

      setConversationTurns([...newTurns, aiTurn]);

      // 4. Speak response via Web Speech TTS
      setIsSpeaking(true);
      speechService.speak(nextQuestion.questionText, language, () => setIsSpeaking(false));
    }, 600);
  };

  // FIX 3: Native Multi-Document Upload Handler
  const handleTriggerNativeFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleNativeFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    const newFilesArray = Array.from(files);

    for (const file of newFilesArray) {
      // Determine document category
      const name = file.name.toLowerCase();
      let category = 'Doctor Prescription / Rx';
      if (name.includes('lab') || name.includes('blood') || name.includes('lipid') || name.includes('test')) {
        category = 'Laboratory / Diagnostic Report';
      } else if (name.includes('discharge') || name.includes('summary')) {
        category = 'Hospital Discharge Summary';
      } else if (name.includes('scan') || name.includes('xray') || name.includes('mri')) {
        category = 'Radiology / Imaging Report';
      }

      // Run OCR & Entity extraction
      const ocrResult = await ocrProvider.processDocument({
        name: file.name,
        type: file.type || 'application/pdf',
        size: file.size,
      });

      setUploadedFilesList(prev => [
        ...prev,
        {
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
          category,
          ocrResult,
        }
      ]);
    }

    setIsProcessingFiles(false);
    // Reset file input value to allow selecting same file again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveUploadedDoc = (index: number) => {
    setUploadedFilesList(prev => prev.filter((_, i) => i !== index));
  };

  // FIX 5: Submit Complete Package to Admin Queue
  const handleSubmitCompletePackage = async () => {
    const isChestPain = clinicalSlots.chiefComplaint?.includes('Chest') || clinicalSlots.characterQuality?.includes('Pressure');
    const redFlagResult = evaluateRedFlags(
      isChestPain ? 'chest_pain' : 'fever',
      {
        severity: clinicalSlots.severityNumber || 8,
        character: clinicalSlots.characterQuality || 'crushing_pressure',
        onset: clinicalSlots.durationOnset || '<1_hour',
        radiation: clinicalSlots.radiationLocation ? [clinicalSlots.radiationLocation] : ['left_arm'],
        associated_symptoms: clinicalSlots.associatedSymptoms || ['sweating'],
        past_medical_history: clinicalSlots.pastHistory || ['hypertension'],
        allergies: 'penicillin_allergy',
      }
    );

    // Create Encounter Record
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
      chief_complaint_summary: `${clinicalSlots.chiefComplaint || 'Clinical Intake'}: ${clinicalSlots.characterQuality || 'Discomfort'} (Severity: ${clinicalSlots.severityNumber || 8}/10)`,
      intake_started_at: new Date(Date.now() - 900000).toISOString(),
    });

    // Generate Structured Summary
    const summaryDraft = generateStructuredClinicalSummary({
      patient: activePatient,
      encounter,
      chiefComplaint: clinicalSlots.chiefComplaint || 'Chest Pain',
      answers: {
        severity: clinicalSlots.severityNumber || 8,
        onset: clinicalSlots.durationOnset || '<1_hour',
        character: clinicalSlots.characterQuality || 'crushing_pressure',
        radiation: [clinicalSlots.radiationLocation || 'left_arm'],
        associated_symptoms: clinicalSlots.associatedSymptoms || ['sweating'],
        past_medical_history: clinicalSlots.pastHistory || ['hypertension'],
        allergies: 'penicillin_allergy',
      },
      medications: mockDB.getState().medications.filter(m => m.patient_id === activePatient.id),
      allergies: mockDB.getState().allergies.filter(a => a.patient_id === activePatient.id),
      investigations: mockDB.getState().investigations.filter(i => i.patient_id === activePatient.id),
      timeline: mockDB.getState().timelineEvents.filter(t => t.patient_id === activePatient.id),
      redFlagResult,
      isAyushMode: true,
    });

    const savedSummary = await dataService.saveAISummary(summaryDraft);
    setCurrentEncounter(encounter);
    setGeneratedSummary(savedSummary);
    setActiveStep('tracker');
  };

  // FIX 4: PDF Download Trigger
  const handleDownloadPDF = () => {
    generateAndDownloadClinicalPDF({
      patient: activePatient,
      encounter: currentEncounter,
      summary: generatedSummary,
      ayushAnswers,
      uploadedDocs: uploadedFilesList.map(f => f.ocrResult!).filter(Boolean),
      medications: mockDB.getState().medications.filter(m => m.patient_id === activePatient.id),
      allergies: mockDB.getState().allergies.filter(a => a.patient_id === activePatient.id),
      investigations: mockDB.getState().investigations.filter(i => i.patient_id === activePatient.id),
    });
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
            {/* Mid-Conversation Language Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border">
              <button
                onClick={() => handleLanguageSwitch('hi')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  language === 'hi'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => handleLanguageSwitch('en')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                English
              </button>
            </div>

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
            { id: 'talk', label: language === 'hi' ? '1. बातचीत (AI)' : '1. Talk to AI' },
            { id: 'ayush', label: language === 'hi' ? '2. आयुर्वेद परीक्षा' : '2. Ayush Care' },
            { id: 'documents', label: language === 'hi' ? '3. दस्तावेज़' : '3. Documents' },
            { id: 'review', label: language === 'hi' ? '4. सारांश & PDF' : '4. AI Summary' },
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
        {/* FIX 1: STEP 1 — ADAPTIVE CLINICAL CONVERSATION */}
        {/* ========================================================================= */}
        {activeStep === 'talk' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <div className="text-center max-w-xl mx-auto">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950 text-sky-600 mb-2 inline-block">
                Step 1 · Adaptive Clinical Interview
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'अपनी बीमारी के लक्षण खुलकर बताएं' : 'Describe your symptoms naturally to the Clinical AI'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                The AI listens, follows up dynamically on severity and duration, and detects medical emergencies.
              </p>
            </div>

            {/* Voice Soundwave Visualizer */}
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

            {/* Dynamic Conversation Stream */}
            <div className="space-y-3 max-h-[320px] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border">
              {conversationTurns.map((turn, idx) => (
                <div
                  key={idx}
                  className={`flex ${turn.role === 'patient' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    turn.role === 'patient'
                      ? 'bg-sky-500 text-white rounded-br-none shadow-sm'
                      : 'bg-white dark:bg-slate-900 border text-slate-800 dark:text-slate-200 rounded-bl-none shadow-2xs'
                  }`}>
                    <p className="font-semibold">{turn.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Voice / Text Input Box */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleVoiceToggle}
                className={`p-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30'
                    : 'bg-sky-500 text-white hover:bg-sky-600 shadow-sky-500/20'
                }`}
                title={isListening ? 'Stop Mic' : 'Speak'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePatientMessageSend()}
                placeholder={language === 'hi' ? 'यहाँ अपनी समस्या लिखें या माइक बटन दबाकर बोलें...' : 'Type symptoms or tap the mic to speak...'}
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
              />

              <button
                onClick={() => handlePatientMessageSend()}
                className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Sample Prompts & Forward Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-slate-400 self-center text-[11px]">Quick Tests:</span>
                <button
                  onClick={() => handlePatientMessageSend(language === 'hi' ? 'सीने में 2 घंटे से तेज दबाव और पसीना आ रहा है' : 'I have crushing chest pressure radiating to my left arm with cold sweats for 2 hours')}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px]"
                >
                  ⚡ {language === 'hi' ? 'सीने में दबाव (Cardiology Flag)' : 'Chest Pressure (Cardio Flag)'}
                </button>
                <button
                  onClick={() => handlePatientMessageSend(language === 'hi' ? 'दोनों घुटनों में सुबह अकड़न और तेज दर्द होता है' : 'I have chronic knee stiffness, joint cracking and difficulty walking')}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px]"
                >
                  🌿 {language === 'hi' ? 'घुटनों में दर्द (Ayurveda Joint)' : 'Knee Joint Pain (Ayurveda)'}
                </button>
              </div>

              <button
                onClick={() => {
                  speechService.stopSpeaking();
                  speechService.stopListening();
                  setActiveStep('ayush');
                }}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 font-bold text-white text-xs shadow-md transition-all flex items-center gap-1.5 ml-auto"
              >
                <span>Proceed to Step 2: Ayurvedic Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* FIX 2: STEP 2 — AYURVEDIC ASSESSMENT (TRIVIDHA / ASHTAVIDHA) */}
        {/* ========================================================================= */}
        {activeStep === 'ayush' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Leaf className="w-6 h-6" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700">
                    Step 2 · Ayurvedic & Lifestyle Assessment
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {language === 'hi' ? 'त्रिविध / अष्टविध रोग एवं रोगी परीक्षा' : 'Trividha & Ashtavidha Rogi Pariksha'}
                  </h2>
                </div>
              </div>

              <span className="text-xs font-semibold text-slate-400">
                MCQ Selection + Free-Text Supported
              </span>
            </div>

            {/* Ayurvedic Question Cards List */}
            <div className="space-y-6">
              {AYURVEDIC_QUESTIONS.map((q) => {
                const title = language === 'hi' ? q.titleHi : q.titleEn;
                const desc = language === 'hi' ? q.descriptionHi : q.descriptionEn;

                return (
                  <div key={q.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border space-y-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </div>

                    {/* MCQ Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt) => {
                        const optLabel = language === 'hi' ? opt.labelHi : opt.labelEn;
                        const isSelected = 
                          (q.id === 'prakriti' && ayushAnswers.prakritiPrimary === opt.key) ||
                          (q.id === 'vikriti' && ayushAnswers.vikritiDosha === opt.key) ||
                          (q.id === 'agni' && ayushAnswers.agniType === opt.key) ||
                          (q.id === 'koshtha' && ayushAnswers.koshthaType === opt.key) ||
                          (q.id === 'ahara_vihara' && ayushAnswers.aharaHabits === opt.key) ||
                          (q.id === 'dhatu' && ayushAnswers.dhatuAffected?.includes(opt.key));

                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => {
                              if (q.id === 'prakriti') setAyushAnswers({ ...ayushAnswers, prakritiPrimary: opt.key });
                              else if (q.id === 'vikriti') setAyushAnswers({ ...ayushAnswers, vikritiDosha: opt.key });
                              else if (q.id === 'agni') setAyushAnswers({ ...ayushAnswers, agniType: opt.key });
                              else if (q.id === 'koshtha') setAyushAnswers({ ...ayushAnswers, koshthaType: opt.key });
                              else if (q.id === 'ahara_vihara') setAyushAnswers({ ...ayushAnswers, aharaHabits: opt.key });
                              else if (q.id === 'dhatu') setAyushAnswers({ ...ayushAnswers, dhatuAffected: [opt.key] });
                            }}
                            className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-bold'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            {optLabel}
                          </button>
                        );
                      })}
                    </div>

                    {/* Free-Text Alternative Box for Each Question */}
                    <div>
                      <input
                        type="text"
                        placeholder={language === 'hi' ? 'या अपने शब्दों में विस्तार से लिखें...' : 'Or explain in your own words...'}
                        onChange={(e) => {
                          if (q.id === 'prakriti') setAyushAnswers({ ...ayushAnswers, prakritiNotes: e.target.value });
                          else if (q.id === 'vikriti') setAyushAnswers({ ...ayushAnswers, vikritiNotes: e.target.value });
                          else if (q.id === 'agni') setAyushAnswers({ ...ayushAnswers, agniNotes: e.target.value });
                          else if (q.id === 'koshtha') setAyushAnswers({ ...ayushAnswers, koshthaNotes: e.target.value });
                          else if (q.id === 'ahara_vihara') setAyushAnswers({ ...ayushAnswers, viharaHabits: e.target.value });
                          else if (q.id === 'dhatu') setAyushAnswers({ ...ayushAnswers, dhatuNotes: e.target.value });
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                  </div>
                );
              })}
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
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Continue to Step 3: Document Upload</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FIX 3: STEP 3 — NATIVE MULTI-DOCUMENT UPLOAD WITH OCR */}
        {/* ========================================================================= */}
        {activeStep === 'documents' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            
            {/* Hidden Native File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleNativeFilesSelected}
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              className="hidden"
            />

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950 text-sky-600 mb-2 inline-block">
                Step 3 · Real Document Upload & OCR
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'चिकित्सीय पर्चे या लैब रिपोर्ट अपलोड करें' : 'Upload previous doctor prescriptions & lab reports'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Clicking upload will open your device's native file picker. You can select multiple files (PDFs, PNG, JPG).
              </p>
            </div>

            {/* Big Actionable Upload Box */}
            <div
              onClick={handleTriggerNativeFilePicker}
              className="p-8 rounded-3xl border-2 border-dashed border-sky-300 dark:border-sky-800 bg-sky-50/40 dark:bg-sky-950/20 hover:border-sky-500 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-3 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <strong className="text-sm font-bold text-slate-900 dark:text-white">
                  Click to Browse & Upload Documents from Device
                </strong>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supports multiple files · PDF, PNG, JPG · Max 25MB each
                </p>
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs shadow-md group-hover:bg-sky-600"
              >
                + Browse Local Files
              </button>
            </div>

            {/* Processing indicator */}
            {isProcessingFiles && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border flex items-center gap-3 text-xs text-slate-600">
                <Clock className="w-5 h-5 text-sky-500 animate-spin" />
                <span>Running medical OCR and entity extraction across uploaded documents...</span>
              </div>
            )}

            {/* List of Uploaded & Extracted Documents */}
            {uploadedFilesList.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Uploaded Medical Documents ({uploadedFilesList.length})
                  </h4>
                  <button
                    onClick={handleTriggerNativeFilePicker}
                    className="text-xs font-bold text-sky-500 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Document
                  </button>
                </div>

                {uploadedFilesList.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-6 h-6 text-emerald-500 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="font-bold text-slate-900 dark:text-white">{file.name}</strong>
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-sky-100 text-sky-700">
                            {file.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {(file.size / 1024).toFixed(1)} KB · OCR Confidence: {file.ocrResult ? Math.round(file.ocrResult.confidenceScore * 100) : 94}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3" /> Extracted
                      </span>
                      <button
                        onClick={() => handleRemoveUploadedDoc(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <button
                onClick={() => setActiveStep('ayush')}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                ← Back to Ayush
              </button>

              <button
                onClick={() => setActiveStep('review')}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 font-bold text-white text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Generate Summary & Download PDF</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FIX 4: STEP 4 — AI SUMMARY & DOWNLOADABLE PDF */}
        {/* ========================================================================= */}
        {activeStep === 'review' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300">
                  AI-generated draft — physician verification required
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                  Clinical Intake Summary & Downloadable Report
                </h2>
              </div>

              {/* Download PDF Button */}
              <button
                onClick={handleDownloadPDF}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0 hover:scale-105"
              >
                <Download className="w-4 h-4 text-sky-400 dark:text-sky-600" />
                <span>Download Clinical Summary (PDF)</span>
              </button>
            </div>

            {/* Recommended Specialty & Priority Banner */}
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">AI Recommended Medical Specialty:</span>
                <p className="text-base font-extrabold text-sky-600 dark:text-sky-400 mt-0.5">
                  {recommendedSpecialty}
                </p>
              </div>

              {clinicalSlots.isRedFlagTriggered && (
                <div className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-extrabold flex items-center gap-1.5 animate-pulse">
                  <Flame className="w-4 h-4" />
                  <span>EMERGENCY FAST-TRACK ALERT</span>
                </div>
              )}
            </div>

            {/* Structured Summary Preview */}
            <div className="space-y-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border">
              <div>
                <strong className="text-slate-400 uppercase text-[10px]">Chief Complaint & History:</strong>
                <p className="text-slate-800 dark:text-slate-200 mt-1 font-semibold">
                  {clinicalSlots.chiefComplaint || 'Acute chest discomfort'} (Severity: {clinicalSlots.severityNumber || 8}/10, Duration: {clinicalSlots.durationOnset || 'Acute'}). Sensation described as {clinicalSlots.characterQuality || 'pressure'}.
                </p>
              </div>

              <div>
                <strong className="text-slate-400 uppercase text-[10px]">Ayurvedic Pariksha Highlights:</strong>
                <p className="text-slate-800 dark:text-slate-200 mt-1">
                  Prakriti: {ayushAnswers.prakritiPrimary || 'Vata-Kapha'} · Vikriti: {ayushAnswers.vikritiDosha || 'Vata Vriddhi'} · Agni: {ayushAnswers.agniType || 'Manda'} · Koshtha: {ayushAnswers.koshthaType || 'Krura'}
                </p>
              </div>

              <div>
                <strong className="text-slate-400 uppercase text-[10px]">Current Medications & Allergies:</strong>
                <p className="text-slate-800 dark:text-slate-200 mt-1">
                  Tab Telmisartan 40mg OD [Patient Stated], Tab Atorvastatin 20mg HS [Document OCR]. Allergy: <strong className="text-rose-600">PENICILLIN</strong>.
                </p>
              </div>
            </div>

            {/* Submit to Admin Queue (Fix 5) */}
            <div className="flex justify-between items-center pt-4 border-t">
              <button
                onClick={() => setActiveStep('documents')}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                ← Back
              </button>

              <button
                onClick={handleSubmitCompletePackage}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Complete Package to Admin Queue</span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* FIX 5: STEP 5 — STATUS TRACKER & CONFIRMED APPOINTMENT CARD */}
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
                  : 'Package Submitted — Waiting for Doctor Assignment'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Reference ID: <strong className="font-mono text-slate-800 dark:text-slate-200">{currentEncounter?.id.slice(0, 12)}...</strong>
              </p>
            </div>

            {/* Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 font-bold">
                <span>✓ 1. Package Submitted</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Summary + Ayush + Docs</p>
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

            {/* CONFIRMED CARD */}
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
                    <p className="text-slate-500 text-[11px]">Mode: In-Person ({currentEncounter.appointment_location || 'Suite 204'})</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <span className="text-slate-500">Doctor has your complete pre-visit clinical history.</span>
                  <button
                    onClick={handleDownloadPDF}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Summary PDF</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border text-center text-xs text-slate-500 space-y-3">
                <Clock className="w-6 h-6 text-sky-500 mx-auto animate-spin" />
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Your complete package is in the Admin triage queue...
                </p>
                <p className="text-[11px] text-slate-400">
                  Switch to <strong>Admin Portal</strong> to assign a specialist or <strong>Doctor Hub</strong> to propose appointment slots.
                </p>
                <div>
                  <button
                    onClick={handleDownloadPDF}
                    className="px-4 py-2 rounded-xl border bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5 shadow-2xs hover:bg-slate-100"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Generated Clinical PDF
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button
                onClick={() => {
                  setActiveStep('talk');
                  setConversationTurns([{
                    role: 'ai',
                    content: language === 'hi' 
                      ? 'नमस्ते! मैं आपका एआई स्वास्थ्य सहायक हूँ। कृपया अपनी परेशानी विस्तार से बताएं।'
                      : 'Hello! I am your AI Health Assistant. Please tell me naturally what symptoms you are experiencing today.',
                    timestamp: new Date().toISOString(),
                    language,
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
