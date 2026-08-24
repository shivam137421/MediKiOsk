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
import { generateStructuredClinicalSummary, generateAIClinicalSummary } from '@/lib/providers/summary';
import { adaptiveInterviewEngine, sanitizeAIResponse, ExtractedClinicalSlots, ClinicalConversationTurn } from '@/lib/ontology/adaptive-interview';
import { AYURVEDIC_QUESTIONS, AyurvedicAssessmentAnswers } from '@/lib/ontology/ayurvedic-assessment';
import { generateAndDownloadClinicalPDF } from '@/lib/pdf/pdf-generator';
import { dataService } from '@/lib/supabase/service';
import { mockDB } from '@/lib/supabase/mock-db';
import { useAuth } from '@/lib/auth';
import { groqProvider } from '@/lib/providers/groq';
import { geminiProvider } from '@/lib/providers/gemini';
import { Patient, Encounter, AISummary, Medication, Allergy, Investigation } from '@/types/clinical';

function getFieldKeyForQuestion(id: string): string {
  switch (id) {
    case 'prakriti': return 'prakritiPrimary';
    case 'vikriti': return 'vikritiSymptoms';
    case 'agni': return 'agniType';
    case 'koshtha': return 'koshthaType';
    case 'mutra': return 'mutraPattern';
    case 'jihva': return 'jihvaStatus';
    case 'satva_nidra': return 'sleepMind';
    case 'bala': return 'balaEnergy';
    case 'ahara': return 'aharaHabits';
    case 'vihara': return 'viharaHabits';
    case 'dhatu': return 'dhatuAffected';
    case 'nidana': return 'nidanaTriggers';
    default: return id;
  }
}

function getNoteKeyForQuestion(id: string): string {
  switch (id) {
    case 'prakriti': return 'prakritiNotes';
    case 'vikriti': return 'vikritiNotes';
    case 'agni': return 'agniNotes';
    case 'koshtha': return 'koshthaNotes';
    case 'mutra': return 'mutraNotes';
    case 'jihva': return 'jihvaNotes';
    case 'satva_nidra': return 'sleepNotes';
    case 'bala': return 'balaNotes';
    case 'ahara': return 'aharaNotes';
    case 'vihara': return 'viharaNotes';
    case 'dhatu': return 'dhatuNotes';
    case 'nidana': return 'nidanaNotes';
    default: return `${id}Notes`;
  }
}

export default function PatientPortalPage() {
  const { currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState<'talk' | 'ayush' | 'documents' | 'review' | 'tracker'>('talk');
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');
  const [availablePatients, setAvailablePatients] = useState<Patient[]>(mockDB.getState().patients);
  const [activePatient, setActivePatient] = useState<Patient>(mockDB.getState().patients[0]);
  
  // FIX 1 & 2: Voice & Adaptive Interview State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
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

  // FIX 2: Ayurvedic Assessment State — Unselected by default
  const [ayushAnswers, setAyushAnswers] = useState<AyurvedicAssessmentAnswers>({});
  const [activeAyushTab, setActiveAyushTab] = useState<number>(0);

  const handleOptionToggle = (q: (typeof AYURVEDIC_QUESTIONS)[0], optKey: string) => {
    const fieldKey = getFieldKeyForQuestion(q.id);
    setAyushAnswers(prev => {
      const next = { ...prev };
      if (q.isMultiSelect) {
        const currentList: string[] = Array.isArray(next[fieldKey]) ? [...next[fieldKey]] : [];
        if (currentList.includes(optKey)) {
          next[fieldKey] = currentList.filter(k => k !== optKey);
        } else {
          next[fieldKey] = [...currentList, optKey];
        }
      } else {
        if (next[fieldKey] === optKey) {
          delete next[fieldKey];
        } else {
          next[fieldKey] = optKey;
        }
      }
      return next;
    });
  };

  const isOptionSelected = (q: (typeof AYURVEDIC_QUESTIONS)[0], optKey: string) => {
    const fieldKey = getFieldKeyForQuestion(q.id);
    const val = ayushAnswers[fieldKey];
    if (Array.isArray(val)) {
      return val.includes(optKey);
    }
    return val === optKey;
  };

  const answeredAyushCount = AYURVEDIC_QUESTIONS.filter(q => {
    const fieldKey = getFieldKeyForQuestion(q.id);
    const noteKey = getNoteKeyForQuestion(q.id);
    const val = ayushAnswers[fieldKey];
    const note = ayushAnswers[noteKey];
    const hasSelection = Array.isArray(val) ? val.length > 0 : Boolean(val);
    const hasNote = Boolean(note && String(note).trim().length > 0);
    return hasSelection || hasNote;
  }).length;

  // FIX 3: Document Upload State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFilesList, setUploadedFilesList] = useState<Array<{ name: string; size: number; type: string; category: string; ocrResult?: DocumentOCRResult }>>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  // FIX 4 & 5: Encounter & Summary State
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<AISummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [recommendedSpecialty, setRecommendedSpecialty] = useState<string>('General Medicine');

  // Fresh Intake Reset & Patient Switching
  const startFreshIntake = (patient?: Patient) => {
    const targetPatient = patient || activePatient;
    setActivePatient(targetPatient);
    setClinicalSlots({});
    setAyushAnswers({});
    setUploadedFilesList([]);
    setCurrentEncounter(null);
    setGeneratedSummary(null);
    setInputText('');
    setLiveTranscript('');
    setRecommendedSpecialty('General Medicine');
    setConversationTurns([
      {
        role: 'ai',
        content: language === 'hi' 
          ? `नमस्ते ${targetPatient.full_name}! मैं आपका एआई स्वास्थ्य सहायक हूँ। कृपया अपनी परेशानी या लक्षण खुलकर बताएं।`
          : `Hello ${targetPatient.full_name}! I am your AI Health Assistant. Please describe your symptoms or health concern today.`,
        timestamp: new Date().toISOString(),
        language,
      }
    ]);
    setActiveStep('talk');
  };

  const handlePatientSwitch = async (patientId: string) => {
    if (patientId === 'new') {
      const newPat = await dataService.createPatient({
        demo_id: `DEMO-P${Date.now().toString().slice(-4)}`,
        abha_id: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        full_name: 'New Test Patient',
        gender: 'male',
        date_of_birth: '1985-01-01',
        age_years: 40,
        phone: '+91 98000 00000',
        preferred_language: language,
        address: 'New Delhi, India',
        emergency_contact_name: 'Emergency Contact',
        emergency_contact_phone: '+91 98000 00001',
      });
      setAvailablePatients(mockDB.getState().patients);
      startFreshIntake(newPat);
    } else {
      const pat = mockDB.getState().patients.find(p => p.id === patientId) || mockDB.getState().patients[0];
      startFreshIntake(pat);
    }
  };

  // Load existing data on initial mount
  useEffect(() => {
    const loadPatientData = () => {
      const state = mockDB.getState();
      setAvailablePatients(state.patients);
      const patient = state.patients.find(p => p.id === currentUser.id) || state.patients[0];
      setActivePatient(patient);
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
      const nextQ = adaptiveInterviewEngine.generateNextQuestion(clinicalSlots, newLang);
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

  // FIX 1 & 2: Voice Listening Toggle
  const handleVoiceToggle = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      console.log(`[MediKiosk Speech] Starting ASR listening in language: ${language}`);
      const started = speechService.startListening(
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
        },
        (active: boolean) => {
          setIsListening(active);
        }
      );
      if (started) {
        setIsListening(true);
      }
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

    // 3. Generate empathetic doctor follow-up question (Groq / Gemini live LLM + Clinical Ontology Fallback)
    (async () => {
      let nextQuestionText = '';
      let isIntakeComplete = false;
      let mergedSlots = updatedSlots;

      const chatHistory = newTurns.map(t => ({
        role: (t.role === 'patient' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: t.content,
      }));

      try {
        if (groqProvider.isAvailable()) {
          const result = await groqProvider.generateFollowUpQuestion(chatHistory, { language });
          nextQuestionText = result.reply;
          isIntakeComplete = result.isComplete;
          if (result.slots) mergedSlots = { ...updatedSlots, ...result.slots };
        } else if (geminiProvider.isAvailable()) {
          const result = await geminiProvider.generateFollowUpQuestion(chatHistory, { language });
          nextQuestionText = result.reply;
          isIntakeComplete = result.isComplete;
          if (result.slots) mergedSlots = { ...updatedSlots, ...result.slots };
        }
      } catch (e) {
        console.warn('[Patient Portal] AI provider turn error:', e);
      }

      nextQuestionText = sanitizeAIResponse(nextQuestionText);

      if (!nextQuestionText || nextQuestionText.length < 3) {
        const nextQ = adaptiveInterviewEngine.generateNextQuestion(
          mergedSlots,
          language
        );
        nextQuestionText = sanitizeAIResponse(nextQ.questionText);
        if (nextQ.isReadyForStep2) isIntakeComplete = true;
      }

      // Explicit multi-signal completion check
      const patientTurnCount = newTurns.filter(t => t.role === 'patient').length;
      if (
        isIntakeComplete ||
        adaptiveInterviewEngine.isClinicalIntakeComplete(mergedSlots, patientTurnCount) ||
        adaptiveInterviewEngine.isClosingStatement(nextQuestionText)
      ) {
        isIntakeComplete = true;
        setIsAutoAdvancing(true);
        // Ensure closing text is crisp if not already
        if (!adaptiveInterviewEngine.isClosingStatement(nextQuestionText)) {
          nextQuestionText = `${nextQuestionText} ${adaptiveInterviewEngine.getClosingStatement(language)}`;
        }
      }

      const aiTurn: ClinicalConversationTurn = {
        role: 'ai',
        content: nextQuestionText,
        timestamp: new Date().toISOString(),
        language,
      };

      setConversationTurns([...newTurns, aiTurn]);
      setClinicalSlots(mergedSlots);

      // 4. Speak response via Indian Accent TTS & Auto-progress if complete
      setIsSpeaking(true);

      let hasNavigated = false;
      const doStep2Navigation = () => {
        if (hasNavigated) return;
        hasNavigated = true;
        console.log('[Patient Portal] Step 1 Intake complete -> Auto-navigating to Step 2 (Ayurvedic Assessment)...');
        setIsAutoAdvancing(false);
        speechService.stopSpeaking();
        speechService.stopListening();
        setActiveStep('ayush');
      };

      if (isIntakeComplete) {
        setIsAutoAdvancing(true);
        console.log('[Patient Portal] Structured completion active. Scheduling auto-progression to Step 2.');

        // Play speech and navigate upon completion
        speechService.speak(nextQuestionText, language, () => {
          setIsSpeaking(false);
          setTimeout(doStep2Navigation, 400);
        });

        // Guaranteed fallback navigation within 3 seconds so screen ALWAYS transitions
        setTimeout(doStep2Navigation, 3000);
      } else {
        speechService.speak(nextQuestionText, language, () => {
          setIsSpeaking(false);
        });
      }
    })();
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

  // Transition to Step 4 with dynamic AI summary synthesis
  const handleGoToReview = async () => {
    setIsGeneratingSummary(true);
    setActiveStep('review');

    // Extract real medications and investigations from uploaded documents
    const docMedications: Medication[] = [];
    const docInvestigations: Investigation[] = [];

    uploadedFilesList.forEach((file) => {
      if (file.ocrResult?.extractedEntities?.medications) {
        file.ocrResult.extractedEntities.medications.forEach((m: any) => {
          docMedications.push({
            id: `med-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
            patient_id: activePatient.id,
            encounter_id: 'draft',
            name: m.drugName || m.name,
            dosage: m.strength || '',
            frequency: m.frequency || '',
            duration: m.duration || 'Ongoing',
            route: m.route || 'Oral',
            source: 'document_ocr',
            source_document_id: null,
            verification_state: 'needs_review',
            doctor_notes: null,
            created_at: new Date().toISOString(),
          });
        });
      }
      if (file.ocrResult?.extractedEntities?.labResults) {
        file.ocrResult.extractedEntities.labResults.forEach((l: any) => {
          docInvestigations.push({
            id: `inv-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
            patient_id: activePatient.id,
            encounter_id: 'draft',
            test_name: l.testName,
            test_category: 'Diagnostic Lab',
            numeric_result: typeof l.resultValue === 'number' ? l.resultValue : null,
            text_result: typeof l.resultValue === 'string' ? l.resultValue : null,
            unit: l.unit || '',
            reference_range: l.referenceRange || '',
            is_abnormal: l.isAbnormal,
            test_date: new Date().toISOString().split('T')[0],
            source_document_id: null,
            created_at: new Date().toISOString(),
          });
        });
      }
    });

    const cc = (clinicalSlots.chiefComplaint || '').toLowerCase();
    const char = (clinicalSlots.characterQuality || '').toLowerCase();
    const isChestPain = cc.includes('chest') || cc.includes('सीने') || cc.includes('दिल') || char.includes('pressure') || char.includes('दबाव');
    const isKneePain = cc.includes('knee') || cc.includes('घुटने') || cc.includes('joint') || cc.includes('जोड़');
    
    let specialty = 'General Medicine';
    if (isChestPain) specialty = 'Cardiology';
    else if (isKneePain || Object.keys(ayushAnswers).length > 2) specialty = 'Ayurveda & AYUSH';
    setRecommendedSpecialty(specialty);

    const redFlagResult = evaluateRedFlags(
      isChestPain ? 'chest_pain' : 'fever',
      {
        severity: clinicalSlots.severityNumber || 5,
        character: clinicalSlots.characterQuality || 'discomfort',
        onset: clinicalSlots.durationOnset || 'acute',
        radiation: clinicalSlots.radiationLocation ? [clinicalSlots.radiationLocation] : [],
        associated_symptoms: clinicalSlots.associatedSymptoms || [],
        past_medical_history: clinicalSlots.pastHistory || [],
        allergies: 'none',
      }
    );

    const summaryDraft = await generateAIClinicalSummary({
      patient: activePatient,
      encounter: {
        id: `draft-enc-${Date.now()}`,
        patient_id: activePatient.id,
        kiosk_id: '11111111-1111-1111-1111-111111111111',
        department_id: 'd1111111-1111-1111-1111-111111111111',
        recommended_specialty: specialty,
        assigned_doctor_id: null,
        proposed_appointment_time: null,
        confirmed_appointment_time: null,
        appointment_mode: null,
        appointment_location: null,
        doctor_proposed_notes: null,
        admin_confirmation_notes: null,
        status: 'submitted_waiting_assignment',
        priority: redFlagResult.priority,
        is_emergency: redFlagResult.hasRedFlag,
        emergency_rationale: redFlagResult.rationale,
        is_ayush_encounter: specialty.includes('Ayush') || Object.keys(ayushAnswers).length > 0,
        chief_complaint_summary: `${clinicalSlots.chiefComplaint || 'Clinical Intake'}${clinicalSlots.characterQuality ? `: ${clinicalSlots.characterQuality}` : ''}`,
        intake_started_at: new Date().toISOString(),
        intake_completed_at: null,
        consultation_completed_at: null,
        created_at: new Date().toISOString(),
      },
      chiefComplaint: clinicalSlots.chiefComplaint || 'Clinical Intake',
      answers: {
        severity: clinicalSlots.severityNumber,
        onset: clinicalSlots.durationOnset,
        character: clinicalSlots.characterQuality,
        radiation: clinicalSlots.radiationLocation ? [clinicalSlots.radiationLocation] : [],
        associated_symptoms: clinicalSlots.associatedSymptoms || [],
        past_medical_history: clinicalSlots.pastHistory || [],
        allergies: 'none',
      },
      medications: docMedications,
      allergies: [],
      investigations: docInvestigations,
      timeline: [],
      redFlagResult,
      isAyushMode: Object.keys(ayushAnswers).length > 0,
      ayushAnswers,
      uploadedDocs: uploadedFilesList.map(f => f.ocrResult!).filter(Boolean),
      conversationTurns,
    });

    setGeneratedSummary({
      ...summaryDraft,
      id: `sum-draft-${Date.now()}`,
      created_at: new Date().toISOString(),
    });
    setIsGeneratingSummary(false);
  };

  // FIX 5: Submit Complete Package to Admin Queue
  const handleSubmitCompletePackage = async () => {
    const cc = (clinicalSlots.chiefComplaint || '').toLowerCase();
    const char = (clinicalSlots.characterQuality || '').toLowerCase();
    const isChestPain = cc.includes('chest') || cc.includes('सीने') || cc.includes('दिल') || char.includes('pressure') || char.includes('दबाव');
    const isKneePain = cc.includes('knee') || cc.includes('घुटने') || cc.includes('joint') || cc.includes('जोड़');
    
    let specialty = recommendedSpecialty;
    if (isChestPain) specialty = 'Cardiology';
    else if (isKneePain || Object.keys(ayushAnswers).length > 2) specialty = 'Ayurveda & AYUSH';

    const redFlagResult = evaluateRedFlags(
      isChestPain ? 'chest_pain' : 'fever',
      {
        severity: clinicalSlots.severityNumber || 5,
        character: clinicalSlots.characterQuality || 'discomfort',
        onset: clinicalSlots.durationOnset || 'acute',
        radiation: clinicalSlots.radiationLocation ? [clinicalSlots.radiationLocation] : [],
        associated_symptoms: clinicalSlots.associatedSymptoms || [],
        past_medical_history: clinicalSlots.pastHistory || [],
        allergies: 'none',
      }
    );

    // 1. Create Encounter Record
    const encounter = await dataService.createEncounter({
      patient_id: activePatient.id,
      kiosk_id: '11111111-1111-1111-1111-111111111111',
      department_id: specialty === 'Cardiology' ? 'd1111111-1111-1111-1111-111111111111' : 'd2222222-2222-2222-2222-222222222222',
      recommended_specialty: specialty,
      status: 'submitted_waiting_assignment',
      priority: redFlagResult.hasRedFlag ? 'EMERGENCY' : 'GREEN',
      is_emergency: redFlagResult.hasRedFlag,
      emergency_rationale: redFlagResult.rationale,
      is_ayush_encounter: specialty.includes('Ayush') || Object.keys(ayushAnswers).length > 0,
      chief_complaint_summary: `${clinicalSlots.chiefComplaint || 'Clinical Intake'}${clinicalSlots.characterQuality ? `: ${clinicalSlots.characterQuality}` : ''}${clinicalSlots.severityNumber ? ` (Severity: ${clinicalSlots.severityNumber}/10)` : ''}`,
      intake_started_at: new Date(Date.now() - 900000).toISOString(),
    });

    // 2. Persist Uploaded Documents & Entities
    for (const file of uploadedFilesList) {
      await dataService.saveDocument({
        patient_id: activePatient.id,
        encounter_id: encounter.id,
        file_name: file.name,
        file_type: file.type,
        file_size_bytes: file.size,
        storage_path: `documents/${activePatient.id}/${file.name}`,
        document_category: file.category,
        extracted_text: file.ocrResult?.rawText || 'OCR content extracted.',
        ocr_confidence: file.ocrResult?.confidenceScore || 0.9,
        extracted_entities: file.ocrResult?.extractedEntities || {},
      });

      // Save extracted medications
      if (file.ocrResult?.extractedEntities?.medications) {
        for (const m of file.ocrResult.extractedEntities.medications) {
          await dataService.saveMedication({
            encounter_id: encounter.id,
            patient_id: activePatient.id,
            name: m.drugName,
            dosage: m.strength || '',
            frequency: m.frequency || '',
            duration: m.duration || 'Ongoing',
            route: m.route || 'Oral',
            source: 'document_ocr',
            source_document_id: null,
            verification_state: 'needs_review',
            doctor_notes: null,
          });
        }
      }

      // Save extracted investigations
      if (file.ocrResult?.extractedEntities?.labResults) {
        for (const l of file.ocrResult.extractedEntities.labResults) {
          await dataService.saveInvestigation({
            encounter_id: encounter.id,
            patient_id: activePatient.id,
            test_name: l.testName,
            test_category: 'Diagnostic Lab',
            numeric_result: typeof l.resultValue === 'number' ? l.resultValue : null,
            text_result: typeof l.resultValue === 'string' ? l.resultValue : null,
            unit: l.unit || '',
            reference_range: l.referenceRange || '',
            is_abnormal: l.isAbnormal,
            test_date: new Date().toISOString().split('T')[0],
            source_document_id: null,
          });
        }
      }
    }

    // 3. Save Ayush Assessment
    if (Object.keys(ayushAnswers).length > 0) {
      await dataService.saveAyushAssessment({
        encounter_id: encounter.id,
        patient_id: activePatient.id,
        prakriti_primary: ayushAnswers.prakritiPrimary || null,
        prakriti_secondary: null,
        vikriti_dosha: Array.isArray(ayushAnswers.vikritiSymptoms) ? ayushAnswers.vikritiSymptoms.join(', ') : (ayushAnswers.vikritiDosha || null),
        agni_type: ayushAnswers.agniType || null,
        koshtha_type: ayushAnswers.koshthaType || null,
        dhatu_affected: Array.isArray(ayushAnswers.dhatuAffected) ? ayushAnswers.dhatuAffected : [],
        sattva_shakti: null,
        ahara_vihara_notes: ayushAnswers.aharaNotes || ayushAnswers.viharaNotes || null,
      });
    }

    // 4. Save Final AI Summary
    const finalSummary = await dataService.saveAISummary({
      encounter_id: encounter.id,
      patient_id: activePatient.id,
      chief_complaint: generatedSummary?.chief_complaint || encounter.chief_complaint_summary || 'Clinical intake recorded.',
      hpi: generatedSummary?.hpi || `Patient presented with ${clinicalSlots.chiefComplaint || 'symptoms'}.`,
      pmh_psh: generatedSummary?.pmh_psh || 'No chronic conditions reported.',
      medications_summary: generatedSummary?.medications_summary || 'No active medications reported.',
      allergies_summary: generatedSummary?.allergies_summary || 'No known adverse drug reactions reported.',
      investigations_summary: generatedSummary?.investigations_summary || 'No prior investigations uploaded.',
      recommended_specialty: specialty,
      ayush_summary: generatedSummary?.ayush_summary || null,
      red_flags_highlighted: redFlagResult.triggerSymptoms,
      summary_markdown: generatedSummary?.summary_markdown || 'Clinical intake completed.',
      is_verified: false,
      verified_by: null,
      verified_at: null,
      doctor_edited_summary: null,
    });

    setCurrentEncounter(encounter);
    setGeneratedSummary(finalSummary);
    setActiveStep('tracker');
  };

  // FIX 4: PDF Download Trigger
  const handleDownloadPDF = () => {
    // Gather current session medications from uploaded documents
    const docMeds: Medication[] = [];
    uploadedFilesList.forEach(f => {
      if (f.ocrResult?.extractedEntities?.medications) {
        f.ocrResult.extractedEntities.medications.forEach((m: any) => {
          docMeds.push({
            id: `med-${Date.now()}`,
            patient_id: activePatient.id,
            encounter_id: currentEncounter?.id || 'draft',
            name: m.drugName || m.name,
            dosage: m.strength || '',
            frequency: m.frequency || '',
            duration: m.duration || 'Ongoing',
            route: m.route || 'Oral',
            source: 'document_ocr',
            source_document_id: null,
            verification_state: 'needs_review',
            doctor_notes: null,
            created_at: new Date().toISOString(),
          });
        });
      }
    });

    generateAndDownloadClinicalPDF({
      patient: activePatient,
      encounter: currentEncounter,
      summary: generatedSummary,
      ayushAnswers,
      uploadedDocs: uploadedFilesList.map(f => f.ocrResult!).filter(Boolean),
      medications: docMeds,
      allergies: [],
      investigations: [],
    });
  };

  return (
    <RoleGuard allowedRoles={['patient', 'doctor', 'admin']} stationName="Patient Care Portal">
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 gap-6">
        
        {/* Top Patient Header Strip & Patient Profile Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">{activePatient.full_name}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  ABHA: {activePatient.abha_id || activePatient.demo_id}
                </span>
                <span className="text-xs text-slate-400">
                  ({activePatient.age_years}Y · {activePatient.gender.toUpperCase()})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Phone: {activePatient.phone} · Address: {activePatient.address}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Patient Switcher Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-2xl border text-xs">
              <span className="text-[11px] font-bold text-slate-400">Patient:</span>
              <select
                value={activePatient.id}
                onChange={(e) => handlePatientSwitch(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                {availablePatients.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                    {p.full_name} ({p.age_years}Y, {p.gender.toUpperCase()})
                  </option>
                ))}
                <option value="new" className="dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold">
                  + Register New Test Patient
                </option>
              </select>
            </div>

            {/* Start Fresh Intake Button */}
            <button
              onClick={() => startFreshIntake()}
              className="px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1"
              title="Reset conversation and start a clean intake session for this patient"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Fresh Intake</span>
            </button>

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

            {/* Auto-Progression Status Banner */}
            {isAutoAdvancing && (
              <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {language === 'hi' ? 'चिकित्सीय इतिहास पूर्ण दर्ज!' : 'Clinical Intake Complete!'}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {language === 'hi' ? 'चरण 2 (आयुर्वेद एवं जीवनशैली परीक्षा) पर स्वतः आगे बढ़ रहे हैं...' : 'Auto-progressing to Step 2: Ayurvedic Assessment...'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-bounce">
                  <span>Step 2</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            )}

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
        {/* FIX 2: STEP 2 — AYURVEDIC ASSESSMENT (TRIVIDHA / ASHTAVIDHA / DASHAVIDHA) */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* FIX 2: STEP 2 — AYURVEDIC ASSESSMENT (TRIVIDHA / ASHTAVIDHA / DASHAVIDHA) */}
        {/* ========================================================================= */}
        {activeStep === 'ayush' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            
            {/* Header with Step Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shadow-inner">
                  <Leaf className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      Step 2 · Ayurvedic & Lifestyle Assessment
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      ({answeredAyushCount}/{AYURVEDIC_QUESTIONS.length} {language === 'hi' ? 'उत्तर दिए गए' : 'Answered'})
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {language === 'hi' ? 'आयुर्वेदिक एवं जीवनशैली परीक्षा (त्रिविध / अष्टविध / दशविध)' : 'Ayurvedic Clinical Assessment (Trividha & Dashavidha)'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'hi' 
                      ? 'सरल भाषा में आपके शरीर के प्रकार, पाचन, दोष और आदतों का समग्र मूल्यांकन।'
                      : 'Comprehensive holistic assessment covering constitution, metabolism, and lifestyle.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Ayurvedic Question Cards List (12 Questions) */}
            <div className="space-y-6">
              {AYURVEDIC_QUESTIONS.map((q) => {
                const title = language === 'hi' ? q.titleHi : q.titleEn;
                const desc = language === 'hi' ? q.descriptionHi : q.descriptionEn;
                const tag = language === 'hi' ? q.categoryTagHi : q.categoryTagEn;
                const noteKey = getNoteKeyForQuestion(q.id);
                const isMulti = q.isMultiSelect;

                return (
                  <div 
                    key={q.id} 
                    className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm hover:border-amber-400/50 dark:hover:border-amber-600/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100/80 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                          {tag}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {isMulti 
                            ? (language === 'hi' ? 'बहु-विकल्प (एक से अधिक चुनें)' : 'Multiple Choice') 
                            : (language === 'hi' ? 'एकल-विकल्प (एक चुनें)' : 'Single Choice')}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-1">
                        {title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {desc}
                      </p>
                    </div>

                    {/* MCQ Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt) => {
                        const optLabel = language === 'hi' ? opt.labelHi : opt.labelEn;
                        const isSelected = isOptionSelected(q, opt.key);

                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => handleOptionToggle(q, opt.key)}
                            className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-start justify-between gap-2.5 ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-bold ring-2 ring-amber-400/40'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-300 dark:hover:border-amber-700/60 hover:bg-amber-50/20'
                            }`}
                          >
                            <span className="flex-1 leading-relaxed">{optLabel}</span>
                            <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-all ${
                              isMulti ? 'rounded-md' : 'rounded-full'
                            } ${
                              isSelected
                                ? 'bg-slate-950 border-slate-950 text-amber-400'
                                : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Free-Text Alternative Box */}
                    <div className="pt-1">
                      <input
                        type="text"
                        value={ayushAnswers[noteKey] || ''}
                        placeholder={
                          language === 'hi' 
                            ? 'अपने शब्दों में लिखें...' 
                            : 'Write in your own words...'
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setAyushAnswers(prev => ({ ...prev, [noteKey]: val }));
                        }}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                      />
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Bottom Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setActiveStep('talk')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all w-full sm:w-auto"
              >
                {language === 'hi' ? '← बातचीत पर वापस' : '← Back to Conversation'}
              </button>

              <button
                type="button"
                onClick={() => setActiveStep('documents')}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                <span>{language === 'hi' ? 'आगे बढ़ें (चरण 3: दस्तावेज़ अपलोड) →' : 'Continue to Step 3: Document Upload'}</span>
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
                onClick={handleGoToReview}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 font-bold text-white text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Generate Summary & Review</span>
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

              {clinicalSlots.isRedFlagTriggered ? (
                <div className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-extrabold flex items-center gap-1.5 animate-pulse">
                  <Flame className="w-4 h-4" />
                  <span>EMERGENCY FAST-TRACK ALERT</span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ROUTINE OUTPATIENT TRIAGE</span>
                </div>
              )}
            </div>

            {isGeneratingSummary ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border">
                <Sparkles className="w-8 h-8 text-sky-500 animate-spin" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Synthesizing clinical intake with AI...
                </p>
                <p className="text-xs text-slate-500">
                  Correlating conversation, Ayurvedic examination, and OCR extracted documents into a unified physician briefing.
                </p>
              </div>
            ) : (
              /* Structured Summary Preview */
              <div className="space-y-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border">
                <div>
                  <strong className="text-slate-400 uppercase text-[10px]">1. Chief Complaint & History of Present Illness (HPI):</strong>
                  <p className="text-slate-800 dark:text-slate-200 mt-1 font-semibold">
                    {generatedSummary?.chief_complaint || clinicalSlots.chiefComplaint || 'Clinical intake recorded'} {clinicalSlots.characterQuality ? `(${clinicalSlots.characterQuality})` : ''} {clinicalSlots.severityNumber ? `— Severity: ${clinicalSlots.severityNumber}/10` : ''} {clinicalSlots.durationOnset ? `· Onset: ${clinicalSlots.durationOnset}` : ''}
                  </p>
                  {generatedSummary?.hpi && (
                    <p className="text-slate-600 dark:text-slate-300 mt-1">
                      {generatedSummary.hpi}
                    </p>
                  )}
                </div>

                <div>
                  <strong className="text-slate-400 uppercase text-[10px]">2. Ayurvedic Pariksha Highlights:</strong>
                  {answeredAyushCount === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 mt-1 italic">
                      {language === 'hi' ? 'कोई विशेष आयुर्वेदिक लक्षण दर्ज नहीं किए गए (वैकल्पिक)' : 'No specific Ayurvedic symptoms recorded (Optional)'}
                    </p>
                  ) : (
                    <div className="text-slate-800 dark:text-slate-200 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {ayushAnswers.prakritiPrimary && (
                        <span><strong>Prakriti:</strong> {ayushAnswers.prakritiPrimary}</span>
                      )}
                      {(ayushAnswers.vikritiSymptoms?.length || ayushAnswers.vikritiDosha) && (
                        <span><strong>Vikriti:</strong> {ayushAnswers.vikritiSymptoms?.join(', ') || ayushAnswers.vikritiDosha}</span>
                      )}
                      {ayushAnswers.agniType && (
                        <span><strong>Agni:</strong> {ayushAnswers.agniType}</span>
                      )}
                      {ayushAnswers.koshthaType && (
                        <span><strong>Koshtha:</strong> {ayushAnswers.koshthaType}</span>
                      )}
                      {ayushAnswers.mutraPattern?.length && (
                        <span><strong>Mutra:</strong> {ayushAnswers.mutraPattern.join(', ')}</span>
                      )}
                      {ayushAnswers.jihvaStatus && (
                        <span><strong>Jihva:</strong> {ayushAnswers.jihvaStatus}</span>
                      )}
                      {ayushAnswers.sleepMind?.length && (
                        <span><strong>Sleep/Mind:</strong> {ayushAnswers.sleepMind.join(', ')}</span>
                      )}
                      {ayushAnswers.balaEnergy && (
                        <span><strong>Bala:</strong> {ayushAnswers.balaEnergy}</span>
                      )}
                      {ayushAnswers.aharaHabits && (
                        <span><strong>Ahara:</strong> {Array.isArray(ayushAnswers.aharaHabits) ? ayushAnswers.aharaHabits.join(', ') : ayushAnswers.aharaHabits}</span>
                      )}
                      {ayushAnswers.viharaHabits && (
                        <span><strong>Vihara:</strong> {Array.isArray(ayushAnswers.viharaHabits) ? ayushAnswers.viharaHabits.join(', ') : ayushAnswers.viharaHabits}</span>
                      )}
                      {ayushAnswers.dhatuAffected?.length && (
                        <span><strong>Dhatu:</strong> {ayushAnswers.dhatuAffected.join(', ')}</span>
                      )}
                      {ayushAnswers.nidanaTriggers?.length && (
                        <span><strong>Triggers:</strong> {ayushAnswers.nidanaTriggers.join(', ')}</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <strong className="text-slate-400 uppercase text-[10px]">3. Current Medications & Allergies:</strong>
                  <p className="text-slate-800 dark:text-slate-200 mt-1">
                    {generatedSummary?.medications_summary || 'No active medications reported.'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                    <strong>Allergies:</strong> {generatedSummary?.allergies_summary || 'No known adverse drug reactions reported.'}
                  </p>
                </div>

                <div>
                  <strong className="text-slate-400 uppercase text-[10px]">4. Uploaded Documents & Investigations:</strong>
                  {uploadedFilesList.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 mt-1 italic">
                      No prior laboratory or diagnostic documents uploaded for this encounter.
                    </p>
                  ) : (
                    <div className="mt-1 space-y-1.5">
                      {uploadedFilesList.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border text-[11px]">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            📄 {f.name} ({f.category})
                          </span>
                          <span className="text-slate-500">
                            OCR Confidence: {f.ocrResult ? Math.round(f.ocrResult.confidenceScore * 100) : 90}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                disabled={isGeneratingSummary}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-50"
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
