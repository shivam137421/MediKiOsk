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
  const [activeTab, setActiveTab] = useState<'summary' | 'appointment' | 'meds' | 'documents' | 'timeline' | 'suggestions'>('summary');
  
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

  const loadData = async () => {
    const encList = await dataService.getEncounters();
    const patList = await dataService.getPatients();
    setEncounters(encList);
    setPatients(patList);

    const activeId = selectedEncounterId || encList[0]?.id;
    if (activeId) {
      const sum = await dataService.getAISummaryByEncounter(activeId);
      const sugList = await dataService.getSuggestionsByEncounter(activeId);
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

  const selectedEncounter = encounters.find(e => e.id === selectedEncounterId) || encounters[0];
  const selectedPatient = patients.find(p => p.id === selectedEncounter?.patient_id) || patients[0];

  const medications = mockDB.getState().medications.filter(m => m.patient_id === selectedPatient?.id);
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
                Assigned Patient Intake Review · Propose Appointment Slots · Pre-Visit History
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs">
              <span className="text-slate-400">Doctor: </span>
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
              <span>{selectedEncounter?.status === 'completed' ? 'Consultation Signed Off' : 'Complete In-Person Consultation'}</span>
            </button>
          </div>
        </div>

        {/* Assigned Patients Queue Strip */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {encounters.map((enc) => {
            const pat = patients.find(p => p.id === enc.patient_id);
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
                    enc.is_emergency ? 'bg-rose-500 text-white animate-pulse' : 'bg-sky-500 text-white'
                  }`}>
                    {enc.is_emergency ? 'EMERGENCY' : enc.priority}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {enc.recommended_specialty || 'General'}
                  </span>
                </div>
                <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {pat?.full_name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {enc.chief_complaint_summary || 'Intake submitted.'}
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
                  {selectedEncounter?.is_emergency && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                      EMERGENCY FLAGGED
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ABHA ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{selectedPatient.abha_id || selectedPatient.demo_id}</strong> · Phone: {selectedPatient.phone} · Recommended Specialty: <strong className="text-sky-600">{selectedEncounter?.recommended_specialty}</strong>
                </p>
              </div>
            </div>

            {/* Allergies Highlight */}
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
            { id: 'appointment', label: 'Propose Appointment Slot (Step 3)', icon: Calendar },
            { id: 'meds', label: `Medications & Allergies (${medications.length})`, icon: Pill },
            { id: 'documents', label: 'Uploaded Documents & OCR', icon: FileSearch },
            { id: 'timeline', label: 'Medical Timeline', icon: Clock },
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
        {/* TAB 1: AI CLINICAL SUMMARY DRAFT */}
        {/* ========================================================================= */}
        {activeTab === 'summary' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300">
                  AI-generated draft — physician verification required
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                  Pre-Visit Clinical Intake Package
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {isEditingSummary ? (
                  <button
                    onClick={handleSaveSummaryEdit}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 text-xs shadow-md flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Edits</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingSummary(true)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Summary Draft</span>
                  </button>
                )}
              </div>
            </div>

            {isEditingSummary ? (
              <textarea
                rows={12}
                value={editedSummaryText}
                onChange={(e) => setEditedSummaryText(e.target.value)}
                className="w-full p-4 font-mono text-xs bg-slate-50 dark:bg-slate-800 border rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
              />
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border text-xs whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
                {editedSummaryText || aiSummary?.summary_markdown || 'No clinical summary draft available.'}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PROPOSE APPOINTMENT SLOT (STEP 3) */}
        {/* ========================================================================= */}
        {activeTab === 'appointment' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sky-500" />
                  <span>Step 3: Review & Propose Appointment Slot</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm an appointment date/time for this patient. Admin will confirm and notify the patient.
                </p>
              </div>

              {proposedSuccessNotice && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Slot Proposed & Sent to Admin!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* Proposed Time Slot Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Consultation Time Slot
                </label>
                <div className="space-y-2">
                  {[
                    'Today, 03:30 PM (STAT / Fast-Track)',
                    'Today, 05:00 PM',
                    'Tomorrow, 10:30 AM',
                    'Tomorrow, 02:00 PM',
                  ].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setProposedDate(slot)}
                      className={`w-full p-3 rounded-xl border text-left font-semibold transition-all ${
                        proposedDate === slot
                          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-600 dark:text-sky-300 ring-1 ring-sky-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode & Physician Preparation Notes */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Consultation Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAppointmentMode('in_person')}
                      className={`p-3 rounded-xl border text-center font-bold ${
                        appointmentMode === 'in_person'
                          ? 'bg-sky-500 text-white border-sky-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-600'
                      }`}
                    >
                      In-Person (Cardiology Suite)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppointmentMode('video_consult')}
                      className={`p-3 rounded-xl border text-center font-bold ${
                        appointmentMode === 'video_consult'
                          ? 'bg-sky-500 text-white border-sky-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-600'
                      }`}
                    >
                      Video Consultation
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Physician Clinical Note / Preparation Directive
                  </label>
                  <textarea
                    rows={3}
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="e.g. 12-lead ECG underway, physical examination ready in Bay 2..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={handleProposeAppointment}
                className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 hover:scale-105"
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                          Needs Review
                        </span>
                      </td>
                    </tr>
                  ))}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">MaxHospital_Cardio_Rx.pdf</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-600 font-bold text-[10px]">94% Confidence</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  Rx: Tab Telmisartan 40mg OD Morning{"\n"}
                  Tab Atorvastatin 20mg HS Night{"\n"}
                  Date: 15-Jun-2025
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Lipid_Panel_Report.jpg</span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-600 font-bold text-[10px]">Abnormal</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  Total Cholesterol: 242 mg/dL (HIGH){"\n"}
                  LDL: 168 mg/dL (HIGH){"\n"}
                  HDL: 38 mg/dL (LOW)
                </div>
              </div>
            </div>
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
