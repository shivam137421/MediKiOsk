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
  Calendar, 
  Pill, 
  Flame, 
  Check, 
  X, 
  FileSearch,
  UserCheck,
  Send,
  Building2,
  ChevronRight
} from 'lucide-react';
import { RoleGuard } from '@/components/common/RoleGuard';
import { mockDB, AVAILABLE_DOCTORS } from '@/lib/supabase/mock-db';
import { dataService } from '@/lib/supabase/service';
import { useAuth } from '@/lib/auth';
import { Patient, Encounter, AISummary, AISuggestion, Medication, Allergy, TimelineEvent } from '@/types/clinical';

export default function DoctorDashboardPage() {
  const { currentUser } = useAuth();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string>('e1111111-1111-1111-1111-111111111111');
  const [activeTab, setActiveTab] = useState<'summary' | 'schedule' | 'meds' | 'documents' | 'timeline' | 'suggestions'>('summary');
  
  // AI Clinical Summary State
  const [aiSummary, setAISummary] = useState<AISummary | null>(null);
  const [isEditingSummary, setIsEditingSummary] = useState<boolean>(false);
  const [editedSummaryText, setEditedSummaryText] = useState<string>('');
  
  // Propose Appointment State (Step 3)
  const [proposedDate, setProposedDate] = useState<string>('Today, 03:30 PM');
  const [appointmentMode, setAppointmentMode] = useState<'in_person' | 'video_consult'>('in_person');
  const [doctorNotes, setDoctorNotes] = useState<string>('Patient assessed for acute chest pressure. 12-lead ECG and physical examination ready in Bay 2.');
  const [proposedSuccessNotice, setProposedSuccessNotice] = useState<boolean>(false);

  // Opt-In AI Suggestions
  const [enableSuggestions, setEnableSuggestions] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [encounterDocs, setEncounterDocs] = useState<any[]>([]);

  const loadData = async () => {
    const encList = await dataService.getEncounters();
    const patList = await dataService.getPatients();
    setEncounters(encList);
    setPatients(patList);

    const activeId = selectedEncounterId || encList[0]?.id;
    if (activeId) {
      const sum = await dataService.getAISummaryByEncounter(activeId);
      const sugList = await dataService.getSuggestionsByEncounter(activeId);
      const docs = await dataService.getDocumentsByEncounter(activeId);
      setAISummary(sum || null);
      setEditedSummaryText(sum?.doctor_edited_summary || sum?.summary_markdown || '');
      setSuggestions(sugList);
      setEncounterDocs(docs);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = mockDB.subscribe(loadData);
    return () => unsubscribe();
  }, [selectedEncounterId]);

  const selectedEncounter = encounters.find(e => e.id === selectedEncounterId) || encounters[0];
  const selectedPatient = patients.find(p => p.id === selectedEncounter?.patient_id) || patients[0];

  const medications = mockDB.getState().medications.filter(m => m.encounter_id === selectedEncounter?.id || m.patient_id === selectedPatient?.id);
  const allergies = mockDB.getState().allergies.filter(a => a.patient_id === selectedPatient?.id);
  const timelineEvents = mockDB.getState().timelineEvents.filter(t => t.patient_id === selectedPatient?.id);

  // Step 3 Action: Doctor Proposes Appointment Time & Sends to Admin
  const handleProposeAppointment = async () => {
    if (!selectedEncounter) return;
    await dataService.proposeAppointment(
      selectedEncounter.id,
      proposedDate,
      appointmentMode,
      doctorNotes,
      currentUser.id
    );
    setProposedSuccessNotice(true);
    setTimeout(() => setProposedSuccessNotice(false), 4000);
    loadData();
  };

  // Save Doctor Edit & Sign-off Consultation
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
      assigned_doctor_id: currentUser.id,
    });
    loadData();
  };

  return (
    <RoleGuard allowedRoles={['doctor', 'admin']} stationName="Physician Consultation Hub">
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 gap-6">
        
        {/* Top Doctor Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Physician Consultation Hub</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                  {currentUser.specialty || 'Specialist'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Verified Clinical Intake Review · AI Suggestions · Appointment Proposals · Sign-off
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs">
              <span className="text-slate-400">Doctor: </span>
              <strong className="text-slate-800 dark:text-slate-200">{currentUser.name}</strong>
            </div>
          </div>
        </div>

        {/* Doctor Encounter Selector Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {encounters.map((enc) => {
            const pat = patients.find(p => p.id === enc.patient_id);
            const isSelected = (selectedEncounterId === enc.id) || (!selectedEncounterId && enc.id === encounters[0]?.id);
            return (
              <button
                key={enc.id}
                onClick={() => setSelectedEncounterId(enc.id)}
                className={`p-3 rounded-2xl border text-left transition-all shrink-0 min-w-[200px] ${
                  isSelected
                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 ring-2 ring-sky-500/20 shadow-sm'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {pat?.full_name}
                  </span>
                  {enc.is_emergency && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {enc.chief_complaint_summary}
                </p>
              </button>
            );
          })}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b pb-2 overflow-x-auto">
          {[
            { id: 'summary', label: 'AI Clinical Summary & Sign-off' },
            { id: 'schedule', label: 'Propose Appointment Slot (Step 3)' },
            { id: 'meds', label: `Medications & History (${medications.length})` },
            { id: 'documents', label: `Uploaded Documents (${encounterDocs.length || mockDB.getDocumentsByPatient(selectedPatient?.id).length})` },
            { id: 'timeline', label: 'Health Timeline' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: AI SUMMARY & DOCTOR SIGN-OFF */}
        {/* ========================================================================= */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: AI Summary Card & Edit Mode */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300">
                        {aiSummary?.is_verified ? 'Verified & Signed-Off' : 'Draft — Physician Verification Required'}
                      </span>
                      {selectedEncounter?.is_emergency && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                          Emergency Triage
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                      {selectedPatient?.full_name} ({selectedPatient?.age_years}Y, {selectedPatient?.gender.toUpperCase()})
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditingSummary ? (
                      <button
                        onClick={() => setIsEditingSummary(true)}
                        className="px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Summary</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveSummaryEdit}
                          className="px-3 py-1.5 rounded-xl bg-sky-500 text-white font-bold text-xs shadow-sm hover:bg-sky-600 flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Edits</span>
                        </button>
                        <button
                          onClick={() => setIsEditingSummary(false)}
                          className="px-2.5 py-1.5 rounded-xl border text-xs text-slate-500 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Body / Editor */}
                {isEditingSummary ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">Doctor Summary Editor:</label>
                    <textarea
                      value={editedSummaryText}
                      onChange={(e) => setEditedSummaryText(e.target.value)}
                      rows={14}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-mono leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="space-y-4 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border">
                      <strong className="text-slate-400 uppercase text-[10px]">Chief Complaint & HPI:</strong>
                      <p className="mt-1 font-semibold text-sm text-slate-900 dark:text-white">
                        {aiSummary?.chief_complaint || selectedEncounter?.chief_complaint_summary}
                      </p>
                      <p className="mt-1 text-slate-600 dark:text-slate-300">
                        {aiSummary?.hpi || 'Clinical intake recorded.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border">
                        <strong className="text-slate-400 uppercase text-[10px]">Medications & Allergies:</strong>
                        <p className="mt-1 font-semibold">
                          {aiSummary?.medications_summary || 'No active medications reported.'}
                        </p>
                        <p className="text-rose-600 dark:text-rose-400 font-bold mt-1">
                          Allergies: {aiSummary?.allergies_summary || 'No known allergies'}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border">
                        <strong className="text-slate-400 uppercase text-[10px]">Ayurvedic Assessment:</strong>
                        <p className="mt-1 text-slate-700 dark:text-slate-300">
                          {aiSummary?.ayush_summary || 'No Ayurvedic assessment recorded.'}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border">
                      <strong className="text-slate-400 uppercase text-[10px]">Investigations & Diagnostic Findings:</strong>
                      <p className="mt-1 text-slate-700 dark:text-slate-300">
                        {aiSummary?.investigations_summary || 'No prior investigations uploaded for this encounter.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Final Sign-off Button */}
                <div className="pt-4 border-t flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Signing off verifies this clinical draft and archives it into patient EHR.
                  </span>
                  <button
                    onClick={handleFinalSignoff}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Clinical Sign-off & Complete Intake</span>
                  </button>
                </div>

              </div>

            </div>

            {/* Right 1 Col: AI Suggestions Sidebar (Opt-In) */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">AI Diagnostic Assistant</h3>
                  </div>
                  <button
                    onClick={() => setEnableSuggestions(!enableSuggestions)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all ${
                      enableSuggestions ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {enableSuggestions ? 'Opted In' : 'Enable'}
                  </button>
                </div>

                {enableSuggestions ? (
                  <div className="space-y-3 text-xs">
                    {suggestions.map((sug) => (
                      <div key={sug.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{sug.title}</span>
                          <span className="text-[10px] font-bold text-sky-600">
                            {Math.round((sug.confidence_score || 0.85) * 100)}%
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px]">{sug.details || sug.suggestion_text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    AI diagnostic and differential suggestions are non-coercive and off by default. Click Enable to view.
                  </p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PROPOSE APPOINTMENT TIME (STEP 3) */}
        {/* ========================================================================= */}
        {activeTab === 'schedule' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 max-w-2xl">
            <div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-600">
                Step 3 · Doctor Appointment Scheduling
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                Propose Appointment Slot for {selectedPatient?.full_name}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                The proposed slot is routed directly to the Hospital Admin queue for final confirmation.
              </p>
            </div>

            {proposedSuccessNotice && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Appointment slot proposed successfully and routed to Admin Queue!</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Proposed Date & Time:</label>
                <input
                  type="datetime-local"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-2xl outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Consultation Mode:</label>
                <select
                  value={appointmentMode}
                  onChange={(e) => setAppointmentMode(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-2xl outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="in_person">In-Person Consultation (Hospital Clinic)</option>
                  <option value="video_consult">Secure Telehealth Video Consult</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Doctor Directive & Instructions for Admin/Patient:</label>
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-2xl outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                onClick={handleProposeAppointment}
                className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Send Proposed Slot to Admin for Confirmation</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MEDICATIONS & ALLERGIES */}
        {/* ========================================================================= */}
        {activeTab === 'meds' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
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
                    <th className="p-3 rounded-r-xl">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {medications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                        No active medications reported or extracted for this patient.
                      </td>
                    </tr>
                  ) : (
                    medications.map((med) => (
                      <tr key={med.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{med.name}</td>
                        <td className="p-3">{med.dosage || ''} {med.frequency ? `· ${med.frequency}` : ''}</td>
                        <td className="p-3">{med.duration || 'Ongoing'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {med.source === 'document_ocr' ? 'Document OCR' : 'Patient Stated'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                            Needs Review
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: UPLOADED DOCUMENTS & OCR */}
        {/* ========================================================================= */}
        {activeTab === 'documents' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Patient Uploaded Documents & Extracted OCR Entities
            </h3>

            {(() => {
              const allDocs = encounterDocs.length > 0 ? encounterDocs : mockDB.getDocumentsByPatient(selectedPatient?.id);
              if (allDocs.length === 0) {
                return (
                  <p className="text-xs text-slate-400 italic">
                    No medical documents were uploaded for this encounter.
                  </p>
                );
              }
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {allDocs.map((docItem: any, idx: number) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{docItem.file_name || docItem.fileName || 'Uploaded Document'}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-600 font-bold text-[10px]">
                          {Math.round((docItem.ocr_confidence || docItem.confidenceScore || 0.9) * 100)}% Confidence
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-line">
                        {docItem.extracted_text || docItem.rawText || 'OCR Content processed.'}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: TIMELINE */}
        {/* ========================================================================= */}
        {activeTab === 'timeline' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Chronological Patient Health Timeline
            </h3>

            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-6 pl-6">
              {timelineEvents.map((evt) => (
                <div key={evt.id} className="relative text-xs">
                  <div className="w-3.5 h-3.5 rounded-full absolute -left-[31px] top-1.5 border-2 border-white dark:border-slate-900 bg-sky-500" />
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
                    <div className="flex items-center justify-between mb-1">
                      <strong className="font-bold text-slate-900 dark:text-white text-sm">{evt.title}</strong>
                      <span className="font-mono text-[11px] text-slate-400">{evt.event_date}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{evt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: AI DECISION SUPPORT (OPT-IN) */}
        {/* ========================================================================= */}
        {activeTab === 'suggestions' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
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

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                <span>{enableSuggestions ? 'Suggestions ENABLED' : 'Suggestions OFF'}</span>
                <input
                  type="checkbox"
                  checked={enableSuggestions}
                  onChange={(e) => setEnableSuggestions(e.target.checked)}
                  className="w-5 h-5 rounded text-sky-600"
                />
              </label>
            </div>

            {enableSuggestions ? (
              <div className="space-y-3">
                {suggestions.map((sug) => (
                  <div key={sug.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border text-xs">
                    <strong className="font-bold text-slate-900 dark:text-white text-sm">{sug.title}</strong>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{sug.details}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-dashed text-center text-slate-400 text-xs">
                AI decision-support suggestions are currently OFF. Toggle the switch above to display differential considerations.
              </div>
            )}
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
