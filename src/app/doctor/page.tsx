'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Stethoscope, 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Save, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  UserCheck, 
  Check, 
  X, 
  ChevronRight, 
  Flame, 
  Pill, 
  Calendar, 
  FileSearch,
  Eye,
  Send,
  Leaf
} from 'lucide-react';
import { RoleGuard } from '@/components/common/RoleGuard';
import { mockDB } from '@/lib/supabase/mock-db';
import { dataService } from '@/lib/supabase/service';
import { useAuth } from '@/lib/auth';
import { Patient, Encounter, AISummary, AISuggestion, Medication, Allergy, TimelineEvent, Document } from '@/types/clinical';

export default function DoctorDashboardPage() {
  const { currentUser } = useAuth();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string>('enc-001');
  const [activeTab, setActiveTab] = useState<'summary' | 'meds' | 'documents' | 'timeline' | 'ayush' | 'suggestions'>('summary');
  
  // Clinical Summary State
  const [aiSummary, setAISummary] = useState<AISummary | null>(null);
  const [isEditingSummary, setIsEditingSummary] = useState<boolean>(false);
  const [editedSummaryText, setEditedSummaryText] = useState<string>('');
  
  // AI Suggestions State
  const [enableSuggestions, setEnableSuggestions] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  
  // Doctor Notes
  const [doctorNotes, setDoctorNotes] = useState<string>('Patient assessed in ER Bay 2. 12-lead ECG shows sinus rhythm, no acute ST elevations. Started on sublingual nitrates and antiplatelets.');
  const [isSignoffComplete, setIsSignoffComplete] = useState<boolean>(false);

  const loadData = async () => {
    const encList = await dataService.getEncounters();
    const patList = await dataService.getPatients();
    setEncounters(encList);
    setPatients(patList);

    if (selectedEncounterId) {
      const sum = await dataService.getAISummaryByEncounter(selectedEncounterId);
      const sugList = await dataService.getSuggestionsByEncounter(selectedEncounterId);
      setAISummary(sum || null);
      setEditedSummaryText(sum?.doctor_edited_summary || sum?.summary_markdown || '');
      setSuggestions(sugList);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = mockDB.subscribe(loadData);
    return () => unsubscribe();
  }, [selectedEncounterId]);

  const selectedEncounter = encounters.find((e) => e.id === selectedEncounterId) || encounters[0];
  const selectedPatient = patients.find((p) => p.id === selectedEncounter?.patient_id) || patients[0];

  // Medications and Allergies for active encounter
  const medications = mockDB.getState().medications.filter((m) => m.patient_id === selectedPatient?.id);
  const allergies = mockDB.getState().allergies.filter((a) => a.patient_id === selectedPatient?.id);
  const timelineEvents = mockDB.getState().timelineEvents.filter((t) => t.patient_id === selectedPatient?.id);
  const ayushAssessment = mockDB.getState().ayushAssessments.find((y) => y.patient_id === selectedPatient?.id);

  // Save Doctor Edit & Sign-off
  const handleSaveSummaryEdit = async () => {
    if (!aiSummary) return;
    await dataService.updateDoctorSummary(aiSummary.id, currentUser.id, editedSummaryText, false);
    setIsEditingSummary(false);
    loadData();
  };

  const handleFinalSignoff = async () => {
    if (!aiSummary || !selectedEncounter) return;
    await dataService.updateDoctorSummary(aiSummary.id, currentUser.id, editedSummaryText, true);
    await dataService.updateEncounter(selectedEncounter.id, {
      status: 'completed',
      consultation_completed_at: new Date().toISOString(),
      attending_doctor_id: currentUser.id,
    });
    setIsSignoffComplete(true);
    loadData();
  };

  const handleSuggestionAction = async (sugId: string, status: 'accepted' | 'rejected') => {
    await dataService.updateSuggestionStatus(sugId, status, currentUser.id);
    loadData();
  };

  return (
    <RoleGuard allowedRoles={['doctor', 'admin']} stationName="Physician Consultation Hub">
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 gap-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Doctor Consultation Hub</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300">
                  Physician Supervision Mode
                </span>
              </div>
              <p className="text-xs text-slate-500">
                AI-Assisted Intake Review · Source-Linked Timeline · Verification & Sign-Off
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs">
              <span className="text-slate-400">Attending: </span>
              <strong className="text-slate-800 dark:text-slate-200">{currentUser.name}</strong>
            </div>

            <button
              onClick={handleFinalSignoff}
              disabled={selectedEncounter?.status === 'completed'}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 ${
                selectedEncounter?.status === 'completed'
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20 hover:scale-105'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{selectedEncounter?.status === 'completed' ? 'Consultation Verified & Signed' : 'Sign-Off & Complete Consultation'}</span>
            </button>
          </div>
        </div>

        {/* Patient Selection Queue Strip */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {encounters.map((enc) => {
            const pat = patients.find((p) => p.id === enc.patient_id);
            const isSelected = selectedEncounterId === enc.id;
            return (
              <button
                key={enc.id}
                onClick={() => setSelectedEncounterId(enc.id)}
                className={`p-3.5 rounded-2xl border text-left min-w-[240px] shrink-0 transition-all ${
                  isSelected
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 shadow-md ring-2 ring-sky-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold ${
                    enc.priority === 'RED' ? 'bg-rose-500 text-white' :
                    enc.priority === 'AMBER' ? 'bg-amber-500 text-slate-950' :
                    'bg-emerald-500 text-slate-950'
                  }`}>
                    {enc.priority}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {enc.is_ayush_encounter ? 'AYUSH' : 'OPD'}
                  </span>
                </div>
                <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {pat?.full_name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {enc.chief_complaint_summary || 'Intake completed.'}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Patient Overview Bar */}
        {selectedPatient && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-base text-slate-700 dark:text-slate-300">
                {selectedPatient.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{selectedPatient.full_name}</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({selectedPatient.age_years}Y · {selectedPatient.gender?.toUpperCase()})
                  </span>
                  {selectedEncounter?.priority === 'RED' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                      CRITICAL RED FLAG
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ABHA ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{selectedPatient.abha_id || selectedPatient.demo_id}</strong> · Phone: {selectedPatient.phone} · Language: {selectedPatient.preferred_language?.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Allergies Highlight Banner */}
            {allergies.length > 0 && (
              <div className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  Allergy Alert: {allergies.map(a => a.allergen).join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b pb-2 overflow-x-auto">
          {[
            { id: 'summary', label: 'AI Clinical Summary (Draft)', icon: FileText },
            { id: 'meds', label: `Medications & Allergies (${medications.length})`, icon: Pill },
            { id: 'documents', label: 'Uploaded Documents & OCR', icon: FileSearch },
            { id: 'timeline', label: 'Medical Timeline', icon: Calendar },
            ...(selectedEncounter?.is_ayush_encounter ? [{ id: 'ayush', label: 'AYUSH / Ayurveda Assessment', icon: Leaf }] : []),
            { id: 'suggestions', label: 'Doctor AI Suggestions (Opt-In)', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: AI CLINICAL SUMMARY & DOCTOR EDIT */}
        {/* ========================================================================= */}
        {activeTab === 'summary' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
            
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300">
                  AI-generated draft — physician verification required
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                  Structured Clinical Intake Record
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {isEditingSummary ? (
                  <button
                    onClick={handleSaveSummaryEdit}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Edits</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingSummary(true)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Draft</span>
                  </button>
                )}
              </div>
            </div>

            {/* Editable or Formatted Markdown Output */}
            {isEditingSummary ? (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500">
                  Physician Markdown Editor (Modifications will be logged in audit trail):
                </label>
                <textarea
                  rows={14}
                  value={editedSummaryText}
                  onChange={(e) => setEditedSummaryText(e.target.value)}
                  className="w-full p-4 font-mono text-xs bg-slate-50 dark:bg-slate-800 border rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-2xl border">
                <div className="whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200 space-y-2">
                  {editedSummaryText || aiSummary?.summary_markdown || 'No clinical summary draft available.'}
                </div>
              </div>
            )}

            {/* Doctor Free-Text Clinical Impression / Prescription Notes */}
            <div className="pt-4 border-t">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Attending Physician Assessment & Action Plan
              </label>
              <textarea
                rows={3}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Enter final clinical impressions, verified prescriptions, or follow-up instructions..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MEDICATIONS & ALLERGIES */}
        {/* ========================================================================= */}
        {activeTab === 'meds' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Current Medications & Extracted Prescriptions
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3 rounded-l-xl">Drug Name</th>
                    <th className="p-3">Dosage & Frequency</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Source Attribution</th>
                    <th className="p-3">Verification State</th>
                    <th className="p-3 rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {medications.map((med) => (
                    <tr key={med.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{med.name}</td>
                      <td className="p-3">{med.dosage || '40 mg'} · {med.frequency || 'OD'}</td>
                      <td className="p-3">{med.duration || 'Ongoing'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {med.source === 'document_ocr' ? 'Document OCR' : 'Patient Stated'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700">
                          Needs Review
                        </span>
                      </td>
                      <td className="p-3">
                        <button className="text-sky-500 font-semibold hover:underline">
                          Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: UPLOADED DOCUMENTS & OCR */}
        {/* ========================================================================= */}
        {activeTab === 'documents' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Uploaded Original Documents & Extracted OCR Entities
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">DrSen_Prescription_Cardio.pdf</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    Confidence: 94%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  MAX SUPER SPECIALITY HOSPITAL{"\n"}
                  Rx: Tab Telmisartan 40mg OD Morning{"\n"}
                  Tab Atorvastatin 20mg HS Night{"\n"}
                  Date: 15-Jun-2025
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-rose-500" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Lipid_Profile_Report_2025.jpg</span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded">
                    Abnormal Values
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  Total Cholesterol: 242 mg/dL (HIGH, Ref: &lt;200){"\n"}
                  LDL: 168 mg/dL (HIGH, Ref: &lt;100){"\n"}
                  HDL: 38 mg/dL (LOW, Ref: &gt;40){"\n"}
                  Triglycerides: 184 mg/dL (HIGH)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: MEDICAL TIMELINE */}
        {/* ========================================================================= */}
        {activeTab === 'timeline' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Chronological Patient Health Timeline
            </h3>

            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-6 pl-6">
              {timelineEvents.map((evt) => (
                <div key={evt.id} className="relative">
                  <div className={`w-3.5 h-3.5 rounded-full absolute -left-[31px] top-1.5 border-2 border-white dark:border-slate-900 ${
                    evt.event_type === 'intake_visit' ? 'bg-rose-500 animate-ping' :
                    evt.event_type === 'diagnosis' ? 'bg-sky-500' : 'bg-emerald-500'
                  }`} />
                  
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{evt.title}</span>
                      <span className="font-mono text-[11px] text-slate-400">{evt.event_date}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{evt.description}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-slate-900 border text-slate-500">
                      Source: {evt.source}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: AYUSH ASSESSMENT */}
        {/* ========================================================================= */}
        {activeTab === 'ayush' && ayushAssessment && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AYUSH / Ayurvedic Rogi & Roga Pariksha Assessment
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                <span className="font-bold text-amber-700 dark:text-amber-400">Prakriti (Constitutional Type)</span>
                <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1">{ayushAssessment.prakriti_primary} (Anubandha: {ayushAssessment.prakriti_secondary || 'Pitta'})</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                <span className="font-bold text-amber-700 dark:text-amber-400">Vikriti & Agni</span>
                <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1">{ayushAssessment.vikriti_dosha} · Agni: {ayushAssessment.agni_type}</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                <span className="font-bold text-amber-700 dark:text-amber-400">Dhatu Affected</span>
                <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1">{ayushAssessment.dhatu_affected.join(', ')}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-xs">
              <p className="font-bold text-slate-700 dark:text-slate-300">Ahara & Vihara Notes:</p>
              <p className="text-slate-600 dark:text-slate-400 mt-1">{ayushAssessment.ahara_vihara_notes}</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: DOCTOR-CONTROLLED AI SUGGESTIONS (OPT-IN) */}
        {/* ========================================================================= */}
        {activeTab === 'suggestions' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
            
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky-500" />
                  <span>Physician Decision-Support Suggestions</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI decision support — not a diagnosis or prescription. Requires explicit doctor verification.
                </p>
              </div>

              {/* Master Toggle (Off by default) */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {enableSuggestions ? 'AI Suggestions ENABLED' : 'AI Suggestions OFF'}
                </span>
                <input
                  type="checkbox"
                  checked={enableSuggestions}
                  onChange={(e) => setEnableSuggestions(e.target.checked)}
                  className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500"
                />
              </label>
            </div>

            {enableSuggestions ? (
              <div className="space-y-4">
                {suggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-600">
                          {sug.suggestion_type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{sug.title}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{sug.details}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {sug.status === 'accepted' ? (
                        <span className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold text-xs flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Accepted
                        </span>
                      ) : sug.status === 'rejected' ? (
                        <span className="px-3 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 font-bold text-xs flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Rejected
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSuggestionAction(sug.id, 'accepted')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => handleSuggestionAction(sug.id, 'rejected')}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-all"
                          >
                            <X className="w-3.5 h-3.5" /> Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-dashed text-center text-slate-400 text-xs">
                AI decision-support suggestions are currently OFF. Toggle the switch above to display differential considerations and suggested confirmatory investigations.
              </div>
            )}

          </div>
        )}

      </div>
    </RoleGuard>
  );
}
