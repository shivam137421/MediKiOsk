'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Activity, 
  Users, 
  Building2, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  Leaf, 
  Sparkles, 
  Flame,
  Stethoscope,
  ArrowRight,
  UserCheck,
  Check,
  Zap,
  Sliders,
  Filter
} from 'lucide-react';
import { RoleGuard } from '@/components/common/RoleGuard';
import { mockDB, AVAILABLE_DOCTORS, DoctorStaff } from '@/lib/supabase/mock-db';
import { dataService } from '@/lib/supabase/service';
import { useAuth } from '@/lib/auth';
import { Encounter, Patient, AuditLog, AISummary } from '@/types/clinical';
import { formatDateTime } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { currentUser } = useAuth();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'confirmations' | 'doctors' | 'analytics' | 'audit'>('queue');
  
  // Assignment Modal / State
  const [selectedEncounterForAssignment, setSelectedEncounterForAssignment] = useState<Encounter | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('usr-doc-01');
  const [assignmentNote, setAssignmentNote] = useState<string>('');
  
  // Appointment Confirmation State
  const [confirmLocation, setConfirmLocation] = useState<string>('Main Consultation Suite Room 204');
  
  // Search & Filter
  const [searchLog, setSearchLog] = useState<string>('');
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'EMERGENCY' | 'WAITING'>('ALL');

  const loadData = async () => {
    const encList = await dataService.getEncounters();
    const patList = await dataService.getPatients();
    const logs = await dataService.getAuditLogs();
    setEncounters(encList);
    setPatients(patList);
    setAuditLogs(logs);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = mockDB.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  const getPatient = (patientId: string) => {
    return patients.find(p => p.id === patientId) || patients[0];
  };

  // Step 2 Action: Admin Assigns Doctor
  const handleAssignDoctor = async () => {
    if (!selectedEncounterForAssignment) return;
    const adminId = currentUser?.id || 'usr-adm-01';
    await dataService.assignDoctor(
      selectedEncounterForAssignment.id,
      selectedDoctorId,
      adminId,
      assignmentNote || 'Assigned matching specialist by Admin.'
    );
    setSelectedEncounterForAssignment(null);
    setAssignmentNote('');
    loadData();
  };

  // Step 4 Action: Admin Confirms Appointment to Patient
  const handleConfirmAppointment = async (encounterId: string, proposedTime: string) => {
    const adminId = currentUser?.id || 'usr-adm-01';
    await dataService.confirmAppointment(
      encounterId,
      proposedTime,
      adminId,
      confirmLocation,
      'Confirmed by Hospital Operations Administrator.'
    );
    loadData();
  };

  // Filter queue
  const incomingQueue = encounters.filter(e => {
    if (queueFilter === 'EMERGENCY') return e.is_emergency;
    if (queueFilter === 'WAITING') return e.status === 'submitted_waiting_assignment';
    return true;
  });

  const pendingConfirmations = encounters.filter(e => e.status === 'appointment_proposed');

  return (
    <RoleGuard allowedRoles={['admin']} stationName="Hospital Operations & Triage Center">
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 gap-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-950 flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Admin Operations & Triage Center</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Hospital Management
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Patient Triage Queue · Specialty Doctor Matching · Appointment Confirmation · Audit Trail
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs">
              <span className="text-slate-400">Admin: </span>
              <strong className="text-slate-800 dark:text-slate-200">{currentUser?.name || 'Vikram Joshi'}</strong>
            </div>
          </div>
        </div>

        {/* Primary Tab Navigation */}
        <div className="flex items-center gap-2 border-b pb-2 overflow-x-auto">
          {[
            { id: 'queue', label: `Incoming Triage Queue (${encounters.length})`, icon: Activity },
            { id: 'confirmations', label: `Pending Confirmations (${pendingConfirmations.length})`, icon: CheckCircle2 },
            { id: 'doctors', label: `Doctor Directory (${AVAILABLE_DOCTORS.length})`, icon: Stethoscope },
            { id: 'analytics', label: 'Hospital Analytics', icon: Building2 },
            { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
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
        {/* TAB 1: PRIMARY INCOMING QUEUE (EMERGENCIES JUMP TO TOP) */}
        {/* ========================================================================= */}
        {activeTab === 'queue' && (
          <div className="flex flex-col gap-4">
            
            {/* Filter Bar */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border text-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 ml-2" />
                <span className="font-bold text-slate-500">Filter Queue:</span>
                {(['ALL', 'EMERGENCY', 'WAITING'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setQueueFilter(f)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      queueFilter === f
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {f === 'ALL' ? 'All Patients' : f === 'EMERGENCY' ? '🚨 Emergencies Only' : 'Waiting Assignment'}
                  </button>
                ))}
              </div>

              <span className="text-slate-400 mr-2 text-[11px]">
                Ordered: Emergency Flags (Top Priority) → First-Come First-Served
              </span>
            </div>

            {/* Queue Cards List */}
            <div className="space-y-4">
              {incomingQueue.map((enc) => {
                const pat = getPatient(enc.patient_id);
                const assignedDoctor = AVAILABLE_DOCTORS.find(d => d.id === enc.assigned_doctor_id);

                return (
                  <div
                    key={enc.id}
                    className={`p-5 sm:p-6 rounded-3xl border transition-all flex flex-col gap-4 ${
                      enc.is_emergency
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-500/60 shadow-lg ring-1 ring-rose-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      {/* Patient & Priority Badges */}
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          enc.is_emergency ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {pat?.full_name?.slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">
                              {pat?.full_name}
                            </h3>
                            {enc.is_emergency && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white flex items-center gap-1 animate-pulse">
                                <Flame className="w-3 h-3" /> EMERGENCY TOP-PRIORITY
                              </span>
                            )}
                            <span className="text-xs font-mono text-slate-400">
                              {pat?.abha_id || pat?.demo_id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {pat?.age_years}Y · {pat?.gender?.toUpperCase()} · Phone: {pat?.phone}
                          </p>
                        </div>
                      </div>

                      {/* AI Recommended Specialty Tag */}
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">AI Recommended Specialty:</span>
                        <div className="inline-block sm:block font-extrabold text-xs text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-3 py-1 rounded-xl border border-sky-200 dark:border-sky-800 mt-0.5">
                          {enc.recommended_specialty || 'General Medicine'}
                        </div>
                      </div>

                    </div>

                    {/* Complaint & Complete Intake Package */}
                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-850/80 border text-xs space-y-2.5">
                      <div>
                        <strong className="text-slate-700 dark:text-slate-300">Chief Complaint & AI Summary:</strong>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                          {enc.chief_complaint_summary}
                        </p>
                        {enc.emergency_rationale && (
                          <p className="text-rose-600 dark:text-rose-400 font-semibold pt-1">
                            🚨 Sentinel Alert: {enc.emergency_rationale}
                          </p>
                        )}
                      </div>

                      {/* Package Details: Uploaded Docs, Ayush Assessment & Meds */}
                      {(() => {
                        const docs = mockDB.getState().documents.filter(d => d.encounter_id === enc.id || d.patient_id === pat?.id);
                        const ayush = mockDB.getState().ayushAssessments.find(a => a.encounter_id === enc.id || a.patient_id === pat?.id);
                        const meds = mockDB.getState().medications.filter(m => m.encounter_id === enc.id || m.patient_id === pat?.id);

                        return (
                          <div className="pt-2 border-t grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border">
                              <strong className="text-slate-800 dark:text-slate-200 block mb-0.5">📄 Uploaded Documents ({docs.length}):</strong>
                              {docs.length === 0 ? (
                                <span className="italic text-slate-400">No documents attached</span>
                              ) : (
                                <ul className="space-y-0.5">
                                  {docs.map((d, i) => (
                                    <li key={i} className="truncate">• {d.file_name}</li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border">
                              <strong className="text-slate-800 dark:text-slate-200 block mb-0.5">🌿 Ayush Assessment:</strong>
                              {ayush ? (
                                <span>Prakriti: {ayush.prakriti_primary || 'N/A'} | Vikriti: {ayush.vikriti_dosha || 'N/A'}</span>
                              ) : (
                                <span className="italic text-slate-400">Optional / unselected</span>
                              )}
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border">
                              <strong className="text-slate-800 dark:text-slate-200 block mb-0.5">💊 Active Meds ({meds.length}):</strong>
                              {meds.length === 0 ? (
                                <span className="italic text-slate-400">None reported</span>
                              ) : (
                                <span className="truncate block">{meds.map(m => m.name).join(', ')}</span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Status & Doctor Assignment Action Strip */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Status:</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          enc.status === 'appointment_confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          enc.status === 'appointment_proposed' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                          enc.status === 'doctor_assigned' ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {enc.status.replace(/_/g, ' ').toUpperCase()}
                        </span>

                        {assignedDoctor && (
                          <span className="text-slate-500 text-[11px]">
                            → Assigned to: <strong>{assignedDoctor.name}</strong> ({assignedDoctor.specialty})
                          </span>
                        )}
                      </div>

                      {/* Step 2 Trigger: Open Assign Doctor Modal */}
                      <div>
                        {enc.status === 'submitted_waiting_assignment' ? (
                          <button
                            onClick={() => setSelectedEncounterForAssignment(enc)}
                            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Assign Doctor ({enc.recommended_specialty})</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedEncounterForAssignment(enc)}
                            className="px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                          >
                            Reassign Doctor
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PENDING APPOINTMENT CONFIRMATIONS (STEP 4) */}
        {/* ========================================================================= */}
        {activeTab === 'confirmations' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Doctor Proposed Appointments (Ready for Admin Confirmation)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review proposed consultation times and push confirmation live to the patient's dashboard.
              </p>
            </div>

            {pendingConfirmations.length > 0 ? (
              <div className="space-y-4">
                {pendingConfirmations.map((enc) => {
                  const pat = getPatient(enc.patient_id);
                  const doctor = AVAILABLE_DOCTORS.find(d => d.id === enc.assigned_doctor_id);

                  return (
                    <div
                      key={enc.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-bold text-slate-900 dark:text-white">{pat?.full_name}</strong>
                          <span className="text-slate-400">({pat?.age_years}Y, {pat?.gender})</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">
                          Assigned Doctor: <strong>{doctor?.name}</strong> ({doctor?.specialty})
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Proposed Slot: {enc.proposed_appointment_time || 'Today, 03:30 PM'} · Mode: {enc.appointment_mode || 'In-Person'}
                        </p>
                        {enc.doctor_proposed_notes && (
                          <p className="text-slate-500 text-[11px]">Note: "{enc.doctor_proposed_notes}"</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleConfirmAppointment(enc.id, enc.proposed_appointment_time || 'Today, 03:30 PM')}
                          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 text-xs shadow-md transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Confirm & Push to Patient</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-dashed text-center text-slate-400 text-xs">
                No doctor appointment proposals currently pending confirmation.
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DOCTOR STAFF DIRECTORY */}
        {/* ========================================================================= */}
        {activeTab === 'doctors' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Hospital Specialist Physicians Directory
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AVAILABLE_DOCTORS.map((doc) => (
                <div
                  key={doc.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex items-start justify-between text-xs"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center font-bold text-sm">
                      {doc.avatarInitials}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{doc.name}</h4>
                      <p className="text-sky-600 dark:text-sky-400 font-semibold">{doc.specialty}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">{doc.department} · {doc.experienceYears} Years Exp</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                    Available
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: HOSPITAL ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm">
              <span className="text-xs text-slate-500 font-semibold">Total Patient Ingestions</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{encounters.length}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm">
              <span className="text-xs text-slate-500 font-semibold">Emergency Priority Intakes</span>
              <p className="text-3xl font-extrabold text-rose-500 mt-1">{encounters.filter(e => e.is_emergency).length}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm">
              <span className="text-xs text-slate-500 font-semibold">Assigned & Scheduled</span>
              <p className="text-3xl font-extrabold text-sky-500 mt-1">{encounters.filter(e => e.assigned_doctor_id).length}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm">
              <span className="text-xs text-slate-500 font-semibold">Avg Triage-to-Doctor Time</span>
              <p className="text-3xl font-extrabold text-emerald-500 mt-1">2m 14s</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: AUDIT TRAIL */}
        {/* ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tamper-Evident System Audit Trail
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Logs every intake submission, doctor assignment, slot proposal, and confirmation.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search audit actions..."
                  value={searchLog}
                  onChange={(e) => setSearchLog(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3 rounded-l-xl">Timestamp</th>
                    <th className="p-3">Actor Role</th>
                    <th className="p-3">Action Type</th>
                    <th className="p-3 rounded-r-xl">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-[11px] text-slate-500">{formatDateTime(log.timestamp)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.actor_role === 'doctor' ? 'bg-sky-100 text-sky-600' :
                          log.actor_role === 'admin' ? 'bg-slate-200 text-slate-800' :
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          {log.actor_role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{log.action}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{JSON.stringify(log.details)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ASSIGN DOCTOR MODAL (STEP 2) */}
        {/* ========================================================================= */}
        {selectedEncounterForAssignment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-5">
              
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-sky-500" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Assign Specialist Doctor
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEncounterForAssignment(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Patient Brief */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-xs space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">
                  Patient: {getPatient(selectedEncounterForAssignment.patient_id)?.full_name}
                </p>
                <p className="text-slate-500">
                  Complaint: {selectedEncounterForAssignment.chief_complaint_summary}
                </p>
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">AI Recommended Specialty: </span>
                  <strong className="text-sky-600 font-extrabold">{selectedEncounterForAssignment.recommended_specialty || 'General Medicine'}</strong>
                </div>
              </div>

              {/* Doctor Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Doctor from {selectedEncounterForAssignment.recommended_specialty || 'Specialty'} Roster
                </label>
                <div className="space-y-2">
                  {AVAILABLE_DOCTORS.map((doc) => {
                    const isRecommended = doc.specialty.toLowerCase().includes((selectedEncounterForAssignment.recommended_specialty || '').toLowerCase());
                    const isSelected = selectedDoctorId === doc.id;

                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setSelectedDoctorId(doc.id)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                          isSelected
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 shadow-sm ring-1 ring-sky-500'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="font-bold text-slate-900 dark:text-white">{doc.name}</strong>
                            {isRecommended && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-700">
                                Recommended Match
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 text-[11px]">{doc.specialty} · {doc.department}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-sky-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assignment Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assignment Note / Fast-Track Instruction
                </label>
                <textarea
                  rows={2}
                  value={assignmentNote}
                  onChange={(e) => setAssignmentNote(e.target.value)}
                  placeholder="e.g. High priority cardiac review, STAT ECG ordered..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Confirm Assignment Button */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  onClick={() => setSelectedEncounterForAssignment(null)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignDoctor}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all"
                >
                  Confirm Doctor Assignment
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
