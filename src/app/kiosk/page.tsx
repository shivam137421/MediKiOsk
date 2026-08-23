'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Smartphone, 
  Globe, 
  ShieldCheck, 
  Volume2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  UserCheck, 
  Mic, 
  FileText, 
  UploadCloud, 
  Sparkles, 
  Clock, 
  Activity, 
  Stethoscope, 
  HeartPulse, 
  Check, 
  RotateCcw,
  Info
} from 'lucide-react';
import { CHIEF_COMPLAINT_OPTIONS, CLINICAL_ONTOLOGY_QUESTIONS, SYSTEMIC_HISTORY_QUESTIONS } from '@/lib/ontology/clinical-tree';
import { evaluateRedFlags } from '@/lib/rules/red-flags';
import { speechService } from '@/lib/providers/speech';
import { VoiceVisualizer } from '@/components/kiosk/VoiceVisualizer';
import { dataService } from '@/lib/supabase/service';
import { mockDB } from '@/lib/supabase/mock-db';
import { Patient, Encounter, TriageAlert, AISummary } from '@/types/clinical';
import { TriagePriority } from '@/types/database';

export default function PatientKioskPage() {
  // Current Step: 1 = ID, 2 = Language/Consent, 3 = Interview, 4 = Documents, 5 = Review, 6 = Completed Ticket
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [language, setLanguage] = useState<'en' | 'hi'>('hi');
  const [isAyushMode, setIsAyushMode] = useState<boolean>(false);

  // Step 1: Patient Identity State
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat-001');
  const [customPatient, setCustomPatient] = useState({
    fullName: '',
    age: '45',
    gender: 'male' as const,
    phone: '',
    abhaId: '',
  });

  // Step 2: Consent State
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [isSpeakingConsent, setIsSpeakingConsent] = useState<boolean>(false);

  // Step 3: Clinical Interview State
  const [chiefComplaint, setChiefComplaint] = useState<string>('chest_pain');
  const [interviewQuestionIndex, setInterviewQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({
    onset: '<1_hour',
    character: 'crushing_pressure',
    severity: 8,
    radiation: ['left_arm', 'jaw_neck'],
    associated_symptoms: ['sweating', 'dyspnea'],
    past_medical_history: ['hypertension'],
    allergies: 'penicillin_allergy',
  });

  // Voice State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');

  // Step 4: Documents State
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ name: string; type: string; status: string; extractedMeds: string[] }>>([
    { name: 'DrSen_Prescription_Cardio.pdf', type: 'Prescription', status: 'Extracted (High Confidence)', extractedMeds: ['Tab Telmisartan 40mg', 'Tab Atorvastatin 20mg'] },
    { name: 'Lipid_Profile_Report_2025.jpg', type: 'Lab Report', status: 'Extracted (Abnormal Flagged)', extractedMeds: ['Cholesterol: 242 mg/dL (High)', 'LDL: 168 mg/dL (High)'] },
  ]);

  // Step 5 & 6: Triage & Confirmation State
  const [redFlagResult, setRedFlagResult] = useState(evaluateRedFlags('chest_pain', {
    character: 'crushing_pressure',
    severity: 8,
    radiation: ['left_arm', 'jaw_neck'],
    associated_symptoms: ['sweating', 'dyspnea'],
  }));
  const [generatedTicketNumber, setGeneratedTicketNumber] = useState<string>('OPD-CARDIO-108');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Recalculate Red Flags dynamically when answers change
  useEffect(() => {
    const res = evaluateRedFlags(chiefComplaint, answers);
    setRedFlagResult(res);
  }, [chiefComplaint, answers]);

  // Handle Voice Toggle
  const handleToggleVoice = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      setVoiceTranscript('');
      const started = speechService.startListening(
        language,
        (text, isFinal) => {
          setVoiceTranscript(text);
          if (isFinal) {
            // Auto-parse spoken keywords
            setIsListening(false);
          }
        },
        (err) => {
          console.warn('Voice error:', err);
          setIsListening(false);
        }
      );
      if (started) setIsListening(true);
    }
  };

  // Play Audio Prompt for Current Question
  const handleSpeakCurrentQuestion = () => {
    const currentQ = getActiveQuestions()[interviewQuestionIndex];
    if (!currentQ) return;
    const textToSpeak = language === 'hi' 
      ? (currentQ.audioPromptHi || currentQ.textHi) 
      : (currentQ.audioPromptEn || currentQ.textEn);
    
    setIsSpeaking(true);
    speechService.speak(textToSpeak, language, () => {
      setIsSpeaking(false);
    });
  };

  // Play Audio Explanation for Consent
  const handleSpeakConsent = () => {
    const consentText = language === 'hi'
      ? 'मेडीकियोस्क में आपका स्वागत है। आपकी स्वास्थ्य जानकारी केवल डॉक्टर के परामर्श और सुरक्षित नैदानिक सहायता के लिए एकत्र की जा रही है। एआई ड्राफ्ट तैयार करता है, लेकिन अंतिम निर्णय हमेशा डॉक्टर का होता है। क्या आप सहमत हैं?'
      : 'Welcome to MediKiosk. Your health information is collected solely for clinical intake and physician decision support. The AI assists in structuring your record, but all final clinical decisions are made by your attending doctor. Do you consent to proceed?';
    
    setIsSpeakingConsent(true);
    speechService.speak(consentText, language, () => {
      setIsSpeakingConsent(false);
    });
  };

  const getActiveQuestions = () => {
    const complaintQuestions = CLINICAL_ONTOLOGY_QUESTIONS[chiefComplaint] || CLINICAL_ONTOLOGY_QUESTIONS['chest_pain'];
    return [...complaintQuestions, ...SYSTEMIC_HISTORY_QUESTIONS];
  };

  // Submit Intake & Generate OPD Token
  const handleFinalizeIntake = async () => {
    setIsSaving(true);
    try {
      const activePatient = mockDB.getPatientById(selectedPatientId) || mockDB.getPatients()[0];
      const priority: TriagePriority = redFlagResult.hasRedFlag ? redFlagResult.priority : 'GREEN';

      // Create new encounter
      const encounter = await dataService.createEncounter({
        patient_id: activePatient.id,
        kiosk_id: '11111111-1111-1111-1111-111111111111',
        department_id: isAyushMode ? 'd3333333-3333-3333-3333-333333333333' : 'd1111111-1111-1111-1111-111111111111',
        attending_doctor_id: 'usr-doc-01',
        triage_nurse_id: 'usr-tri-01',
        status: priority === 'RED' ? 'triage_required' : 'ready_for_doctor',
        priority,
        is_ayush_encounter: isAyushMode,
        chief_complaint_summary: `${chiefComplaint.replace('_', ' ').toUpperCase()}: Severity ${answers.severity || 8}/10, Onset ${answers.onset || 'Recent'}. Red Flag: ${redFlagResult.triggerSymptoms.join(', ')}`,
        intake_started_at: new Date().toISOString(),
        intake_completed_at: new Date().toISOString(),
        consultation_completed_at: null,
      });

      // If red flag triggered, register triage alert
      if (redFlagResult.hasRedFlag) {
        await dataService.createTriageAlert({
          encounter_id: encounter.id,
          patient_id: activePatient.id,
          severity: priority,
          trigger_symptom: redFlagResult.triggerSymptoms.join(' + '),
          clinical_rationale: redFlagResult.rationale,
          is_acknowledged: false,
          acknowledged_by: null,
          acknowledged_at: null,
          action_taken: 'Patient intake completed at Kiosk. Live alert dispatched to Triage station.',
        });
      }

      // Generate AI Summary Draft
      await dataService.saveAISummary({
        encounter_id: encounter.id,
        patient_id: activePatient.id,
        chief_complaint: `${chiefComplaint.replace('_', ' ')} with severity ${answers.severity || 8}/10`,
        hpi: `Patient presents with acute ${chiefComplaint.replace('_', ' ')} for ${answers.onset || 'recent onset'}. Character: ${answers.character || 'pressure'}. Radiation: ${Array.isArray(answers.radiation) ? answers.radiation.join(', ') : 'none'}. Associated symptoms: ${Array.isArray(answers.associated_symptoms) ? answers.associated_symptoms.join(', ') : 'none'}.`,
        pmh_psh: `Known chronic history: ${Array.isArray(answers.past_medical_history) ? answers.past_medical_history.join(', ') : 'None reported'}.`,
        medications_summary: 'Tab Telmisartan 40mg OD, Tab Atorvastatin 20mg OD.',
        allergies_summary: answers.allergies === 'penicillin_allergy' ? 'CRITICAL: Severe Penicillin Allergy' : 'No known drug allergies',
        investigations_summary: 'Uploaded prior Lipid Profile: Total Cholesterol 242 mg/dL, LDL 168 mg/dL.',
        ayush_summary: isAyushMode ? 'Prakriti: Vata-Kapha, Agni: Manda, Vata Vriddhi in Asthi-Sandhi.' : null,
        red_flags_highlighted: redFlagResult.triggerSymptoms,
        summary_markdown: `### **AI-generated draft — physician verification required.**\n\n**Patient:** ${activePatient.full_name} | ${activePatient.age_years}Y / ${activePatient.gender}\n**Triage Priority:** **${priority}**\n\n#### 1. Chief Complaint & HPI\n- **Complaint:** ${chiefComplaint.replace('_', ' ')}\n- **Severity:** ${answers.severity || 8}/10 | **Onset:** ${answers.onset || 'Recent'}\n- **Red Flag Symptoms:** ${redFlagResult.triggerSymptoms.join(', ') || 'None'}\n\n#### 2. History & Medications\n- **PMH:** ${Array.isArray(answers.past_medical_history) ? answers.past_medical_history.join(', ') : 'None'}\n- **Allergies:** ${answers.allergies || 'None'}\n\n#### 3. AI Safety Notice\n${redFlagResult.rationale}`,
        is_verified: false,
        verified_by: null,
        verified_at: null,
        doctor_edited_summary: null,
      });

      const tokenNum = `OPD-${isAyushMode ? 'AYU' : 'CARDIO'}-${Math.floor(100 + Math.random() * 900)}`;
      setGeneratedTicketNumber(tokenNum);
      setCurrentStep(6);
    } catch (e) {
      console.error('Error finalizing intake:', e);
      setCurrentStep(6);
    } finally {
      setIsSaving(false);
    }
  };

  const activeQuestions = getActiveQuestions();
  const currentQ = activeQuestions[interviewQuestionIndex];

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8">
      
      {/* Top Kiosk Header Strip */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {language === 'hi' ? 'रोगी डिजिटल केस-टेकिंग कियोस्क' : 'Patient Digital Intake Kiosk'}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Ministry of Ayush · Touch & Voice Case-Taking
            </p>
          </div>
        </div>

        {/* Language Toggle & AYUSH Mode Toggle */}
        <div className="flex items-center gap-2">
          
          <button
            onClick={() => setIsAyushMode(!isAyushMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isAyushMode 
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AYUSH {isAyushMode ? 'ON' : 'Mode'}</span>
          </button>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'hi'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'en'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              English
            </button>
          </div>

        </div>
      </div>

      {/* Progress Step Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
          <span>{language === 'hi' ? `चरण ${currentStep} / 6` : `Step ${currentStep} of 6`}</span>
          <span>
            {currentStep === 1 && (language === 'hi' ? 'पहचान एवं पंजीकरण' : 'Identity & Patient ID')}
            {currentStep === 2 && (language === 'hi' ? 'सहमति एवं उद्देश्य' : 'Informed Consent')}
            {currentStep === 3 && (language === 'hi' ? 'लक्षण एवं स्वास्थ्य साक्षात्कार' : 'Clinical Interview')}
            {currentStep === 4 && (language === 'hi' ? 'दस्तावेज़ एवं पर्ची अपलोड' : 'Document OCR')}
            {currentStep === 5 && (language === 'hi' ? 'समीक्षा एवं पुष्टि' : 'Review & Confirm')}
            {currentStep === 6 && (language === 'hi' ? 'टोकन जारी' : 'OPD Token Ready')}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: PATIENT IDENTIFICATION & DEMO SELECTOR */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {language === 'hi' ? 'रोगी पहचान दर्ज करें' : 'Patient Identification'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'hi' ? 'कृपया अपनी आभा आईडी (ABHA ID) दर्ज करें या त्वरित परीक्षण हेतु डेमो रोगी चुनें।' : 'Enter your ABHA ID or select a demo clinical profile for immediate intake.'}
            </p>
          </div>

          {/* Quick Demo Patients Cards */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              {language === 'hi' ? 'त्वरित डेमो रोगी चुनें (1-क्लिक)' : 'Select Synthetic Demo Patient (1-Click)'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {mockDB.getPatients().map((p) => {
                const isSelected = selectedPatientId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute top-3 right-3" />
                    )}
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{p.full_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.age_years}Y · {p.gender.toUpperCase()}</p>
                    <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                      ABHA: {p.abha_id}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ABHA ID Input Option */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {language === 'hi' ? 'या 14-अंकों की आभा आईडी दर्ज करें' : 'Or Enter 14-Digit ABHA ID'}
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="91-XXXX-XXXX-XXXX"
                defaultValue="91-4829-1029-4821"
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                {language === 'hi' ? 'सत्यापित करें' : 'Verify ABHA'}
              </button>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 flex items-center gap-2"
            >
              <span>{language === 'hi' ? 'अगला: सहमति (Consent)' : 'Next: Informed Consent'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: INFORMED CONSENT & AUDIO GUIDANCE */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {language === 'hi' ? 'सूचित सहमति एवं डेटा गोपनीयता' : 'Informed Clinical Consent'}
                </h2>
                <p className="text-xs text-slate-500">
                  Version 2.0 · ABDM & Digital Personal Data Protection Act compliant
                </p>
              </div>
            </div>

            {/* Listen to Consent Audio */}
            <button
              onClick={handleSpeakConsent}
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                isSpeakingConsent 
                  ? 'bg-sky-500 text-white border-sky-600 animate-pulse shadow-md' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isSpeakingConsent ? (language === 'hi' ? 'सहमति सुनाई जा रही है...' : 'Playing explanation...') : (language === 'hi' ? 'सहमति ऑडियो सुनें' : 'Listen Audio Consent')}</span>
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
            <p>
              <strong>1. {language === 'hi' ? 'उद्देश्य:' : 'Purpose:'}</strong> {language === 'hi' 
                ? 'यह कियोस्क आपके लक्षणों और स्वास्थ्य इतिहास को संरचित करने में डॉक्टर की सहायता करता है ताकि ओपीडी परामर्श समय की बचत हो सके।'
                : 'This platform collects your symptoms and medical records to assist the attending doctor in preparing your clinical case summary.'}
            </p>
            <p>
              <strong>2. {language === 'hi' ? 'एआई की भूमिका:' : 'Role of AI:'}</strong> {language === 'hi'
                ? 'एआई केवल एक प्रारंभिक ड्राफ्ट तैयार करता है। कोई भी दवा या अंतिम निदान केवल आपके उपस्थित चिकित्सक (Doctor) द्वारा ही निर्धारित किया जाएगा।'
                : 'AI generates a preliminary clinical draft. All diagnoses, prescriptions, and medical decisions are made solely by your licensed physician.'}
            </p>
            <p>
              <strong>3. {language === 'hi' ? 'गोपनीयता:' : 'Data Privacy:'}</strong> {language === 'hi'
                ? 'आपकी जानकारी सुरक्षित रूप से एन्क्रिप्टेड है और केवल अधिकृत अस्पताल कर्मचारियों (डॉक्टर, नर्स, ट्राइएज) को दिखाई देती है।'
                : 'Your medical data is encrypted and strictly accessible only to authorized hospital medical staff.'}
            </p>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 cursor-pointer">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {language === 'hi'
                ? 'मैंने सहमति की शर्तों को पढ़/सुन लिया है और मैं डिजिटल साक्षात्कार व दस्तावेज़ प्रसंस्करण हेतु सहमति देता/देती हूँ।'
                : 'I have read/listened to the consent terms and voluntarily consent to AI-assisted clinical intake and document extraction.'}
            </span>
          </label>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'hi' ? 'वापस' : 'Back'}</span>
            </button>

            <button
              disabled={!consentGiven}
              onClick={() => {
                speechService.stopSpeaking();
                setCurrentStep(3);
              }}
              className={`px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 ${
                consentGiven
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20 hover:scale-105'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>{language === 'hi' ? 'साक्षात्कार प्रारंभ करें' : 'Start Clinical Interview'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: AI CLINICAL INTERVIEW (VOICE + TOUCH) */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="flex flex-col gap-6">
          
          {/* Real-time Red-Flag Alert Banner if triggered */}
          {redFlagResult.hasRedFlag && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-600 dark:text-rose-400 flex items-start gap-3 shadow-lg shadow-rose-500/10 alert-glow">
              <AlertTriangle className="w-6 h-6 shrink-0 text-rose-500 animate-bounce" />
              <div className="text-xs">
                <p className="font-bold text-sm text-rose-600 dark:text-rose-300">
                  {language === 'hi' ? 'महत्वपूर्ण नैदानिक चेतावनी (Red-Flag Alert)' : 'High Priority Clinical Alert Detected'}
                </p>
                <p className="mt-0.5">
                  {redFlagResult.rationale}
                </p>
                <p className="mt-1 font-semibold text-rose-500">
                  {language === 'hi' ? 'अनुशंसित विभाग: ' : 'Recommended Station: '} {redFlagResult.recommendedDepartment}
                </p>
              </div>
            </div>
          )}

          {/* Voice Input Waveform Component */}
          <VoiceVisualizer
            isListening={isListening}
            isSpeaking={isSpeaking}
            transcript={voiceTranscript}
            onToggleMic={handleToggleVoice}
            onReplayAudioPrompt={handleSpeakCurrentQuestion}
            language={language}
          />

          {/* Interview Question Card */}
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
            
            {/* Question Header & Audio Prompt */}
            <div className="flex items-start justify-between gap-4 border-b pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Question {interviewQuestionIndex + 1} of {activeQuestions.length} · {currentQ?.category.replace('_', ' ').toUpperCase()}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {language === 'hi' ? currentQ?.textHi : currentQ?.textEn}
                </h3>
              </div>

              <button
                onClick={handleSpeakCurrentQuestion}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors shrink-0"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Input Controls based on inputType */}
            <div className="py-2">
              
              {/* Single / Multi Choice Options */}
              {currentQ?.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQ.options.map((opt) => {
                    const isMulti = currentQ.inputType === 'multi_choice';
                    const currentValue = answers[currentQ.key];
                    const isSelected = isMulti
                      ? Array.isArray(currentValue) && currentValue.includes(opt.value)
                      : currentValue === opt.value;

                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          if (isMulti) {
                            const arr = Array.isArray(currentValue) ? [...currentValue] : [];
                            if (arr.includes(opt.value)) {
                              setAnswers({ ...answers, [currentQ.key]: arr.filter(v => v !== opt.value) });
                            } else {
                              setAnswers({ ...answers, [currentQ.key]: [...arr, opt.value] });
                            }
                          } else {
                            setAnswers({ ...answers, [currentQ.key]: opt.value });
                          }
                        }}
                        className={`p-4 rounded-2xl border text-left font-semibold text-xs flex items-center justify-between transition-all kiosk-touch-target ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-600 shadow-md shadow-emerald-500/20 scale-[1.02]'
                            : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <span>{language === 'hi' ? opt.labelHi : opt.labelEn}</span>
                        {isSelected && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Severity Slider (1 - 10) */}
              {currentQ?.inputType === 'severity_slider' && (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span>1 (Mild / हल्का)</span>
                    <span className="text-xl font-extrabold text-rose-500">{answers['severity'] || 8} / 10</span>
                    <span>10 (Severe / असहनीय)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={answers['severity'] || 8}
                    onChange={(e) => setAnswers({ ...answers, severity: Number(e.target.value) })}
                    className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Bearable</span>
                    <span>Moderate</span>
                    <span className="text-rose-500 font-semibold">Critical Pain</span>
                  </div>
                </div>
              )}

            </div>

            {/* Navigation Buttons for Question Tree */}
            <div className="flex items-center justify-between pt-4 border-t">
              <button
                disabled={interviewQuestionIndex === 0}
                onClick={() => setInterviewQuestionIndex(prev => Math.max(0, prev - 1))}
                className={`px-5 py-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  interviewQuestionIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'hi' ? 'पिछला प्रश्न' : 'Previous'}</span>
              </button>

              {interviewQuestionIndex < activeQuestions.length - 1 ? (
                <button
                  onClick={() => setInterviewQuestionIndex(prev => prev + 1)}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  <span>{language === 'hi' ? 'अगला प्रश्न' : 'Next Question'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  <span>{language === 'hi' ? 'दस्तावेज़ अपलोड पर जाएं' : 'Proceed to Documents'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: DOCUMENT UPLOAD & OCR EXTRACTION */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {language === 'hi' ? 'दस्तावेज़ एवं पर्ची अपलोड' : 'Document Upload & Medical OCR'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'hi' ? 'पूर्व पर्चियां, लैब रिपोर्ट या डिस्चार्ज समरी जोड़ें। एआई स्वचालित रूप से दवाओं और रिपोर्टों को निकालता है।' : 'Upload past prescriptions, lab investigations, or discharge cards. AI structures medications and abnormal values.'}
            </p>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 text-center hover:border-emerald-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
            <UploadCloud className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {language === 'hi' ? 'कैमरे से फोटो लें या फ़ाइल चुनें (PDF/JPG)' : 'Capture with Kiosk Camera or Browse Files (PDF/JPG)'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Multi-page prescriptions & lab panels supported</p>
            <button
              onClick={() => {
                setUploadedDocs([
                  ...uploadedDocs,
                  { name: `Prescription_Report_${Date.now().toString().slice(-4)}.pdf`, type: 'Prescription', status: 'Extracted (High Confidence)', extractedMeds: ['Tab Telmisartan 40mg OD', 'Tab Aspirin 75mg'] }
                ]);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              + {language === 'hi' ? 'सैंपल रिपोर्ट जोड़ें' : 'Simulate Adding Document'}
            </button>
          </div>

          {/* Extracted Document Cards */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {language === 'hi' ? 'प्रसंस्कृत दस्तावेज़ एवं निकाली गई जानकारी' : 'Processed Documents & Extracted Clinical Entities'}
            </p>

            {uploadedDocs.map((doc, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{doc.name}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{doc.status}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {doc.extractedMeds.map((m, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border text-[10px] font-medium text-slate-700 dark:text-slate-300">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0 self-start sm:self-center">
                  OCR Verified
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-5 py-3 rounded-xl border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'hi' ? 'वापस' : 'Back'}</span>
            </button>

            <button
              onClick={() => setCurrentStep(5)}
              className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 flex items-center gap-2"
            >
              <span>{language === 'hi' ? 'समीक्षा एवं पुष्टि' : 'Review & Confirm Summary'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: REVIEW & FINAL CONFIRMATION */}
      {/* ========================================================================= */}
      {currentStep === 5 && (
        <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'साक्षात्कार सारांश समीक्षा' : 'Review Plain-Language Intake'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'hi' ? 'पुष्टि करें कि आपके द्वारा दी गई जानकारी सही है।' : 'Please verify your answers before submission to the attending physician.'}
              </p>
            </div>

            <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              redFlagResult.hasRedFlag ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
            }`}>
              {redFlagResult.hasRedFlag ? 'Priority: RED (Urgent)' : 'Priority: Routine'}
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border">
              <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">Chief Symptom</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {chiefComplaint.replace('_', ' ').toUpperCase()} (Severity: {answers.severity || 8}/10)
              </p>
              <p className="text-slate-500 mt-1">Onset: {answers.onset || 'Recent'} · Radiation: {Array.isArray(answers.radiation) ? answers.radiation.join(', ') : 'None'}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border">
              <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">Allergies</p>
              <p className="text-sm font-bold text-rose-500">
                {answers.allergies === 'penicillin_allergy' ? 'PENICILLIN ALLERGY (Severe)' : 'No known drug allergies'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border">
              <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">Extracted Medications & Labs</p>
              <p className="text-slate-700 dark:text-slate-300">Tab Telmisartan 40mg, Tab Atorvastatin 20mg (Lipid Profile: Elevated Cholesterol 242 mg/dL)</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setCurrentStep(4)}
              className="px-5 py-3 rounded-xl border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'hi' ? 'वापस' : 'Back'}</span>
            </button>

            <button
              disabled={isSaving}
              onClick={handleFinalizeIntake}
              className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 flex items-center gap-2"
            >
              {isSaving ? (
                <span>{language === 'hi' ? 'प्रसंस्करण हो रहा है...' : 'Submitting to Queue...'}</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{language === 'hi' ? 'पुष्टि करें और टोकन प्राप्त करें' : 'Confirm & Generate OPD Token'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: OPD TOKEN & REALTIME DISPATCH CONFIRMATION */}
      {/* ========================================================================= */}
      {currentStep === 6 && (
        <div className="bg-white dark:bg-slate-900 border rounded-3xl p-8 shadow-2xl text-center max-w-xl mx-auto w-full flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {language === 'hi' ? 'केस-टेकिंग सफल' : 'Intake Successfully Registered'}
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3 font-mono">
              {generatedTicketNumber}
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              {language === 'hi' 
                ? 'आपका क्लिनिकल सारांश और ट्राइएज अलर्ट उपस्थित डॉक्टर के डैशबोर्ड पर भेज दिया गया है।'
                : 'Your structured clinical draft and triage alert have been dispatched to the attending physician.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border w-full text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <span className="font-bold text-slate-900 dark:text-white">Aarav Sharma (48Y / M)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Cardiology OPD / Emergency Bay 2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Triage Priority:</span>
              <span className="font-bold text-rose-500">RED (Immediate Evaluation)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link
              href="/doctor"
              className="flex-1 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Stethoscope className="w-4 h-4" />
              <span>View in Doctor Dashboard</span>
            </Link>

            <Link
              href="/triage"
              className="flex-1 py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>View in Triage Feed</span>
            </Link>
          </div>

          <button
            onClick={() => {
              setCurrentStep(1);
              setInterviewQuestionIndex(0);
            }}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mt-2"
          >
            ← {language === 'hi' ? 'नया रोगी कियोस्क शुरू करें' : 'Start New Patient Intake'}
          </button>
        </div>
      )}

    </div>
  );
}
