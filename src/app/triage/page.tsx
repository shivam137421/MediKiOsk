'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  Activity, 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  ArrowRight, 
  Stethoscope, 
  Filter, 
  Sparkles, 
  ShieldAlert,
  Search,
  ChevronRight,
  Flame,
  Zap
} from 'lucide-react';
import { RoleGuard } from '@/components/common/RoleGuard';
import { mockDB } from '@/lib/supabase/mock-db';
import { dataService } from '@/lib/supabase/service';
import { useAuth } from '@/lib/auth';
import { Encounter, Patient, TriageAlert } from '@/types/clinical';
import { TriagePriority } from '@/types/database';

export default function TriageDashboardPage() {
  const { currentUser } = useAuth();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<TriageAlert[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<TriageAlert | null>(null);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [assignedBay, setAssignedBay] = useState<string>('Emergency Resuscitation Bay 2');

  const loadData = async () => {
    const encList = await dataService.getEncounters();
    const patList = await dataService.getPatients();
    const alertList = await dataService.getTriageAlerts();
    setEncounters(encList);
    setPatients(patList);
    setAlerts(alertList);
    if (alertList.length > 0 && !selectedAlert) {
      setSelectedAlert(alertList[0]);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = mockDB.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  const handleAcknowledge = async (alertId: string) => {
    const action = `Assigned to ${assignedBay}. Action taken: ${actionNotes || 'STAT ECG ordered, Fast-Track physician alert dispatched.'}`;
    await dataService.acknowledgeTriageAlert(alertId, currentUser.id, action);
    
    // Update encounter status to ready_for_doctor
    if (selectedAlert) {
      await dataService.updateEncounter(selectedAlert.encounter_id, {
        status: 'ready_for_doctor',
        triage_nurse_id: currentUser.id,
      });
    }
    setActionNotes('');
    loadData();
  };

  const filteredEncounters = encounters.filter((e) => {
    if (selectedPriority === 'ALL') return true;
    return e.priority === selectedPriority;
  });

  const getPatientForEncounter = (patientId: string) => {
    return patients.find((p) => p.id === patientId) || patients[0];
  };

  return (
    <RoleGuard allowedRoles={['triage', 'doctor', 'admin']} stationName="Emergency & Triage Station">
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 gap-6">
        
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Emergency Triage Live Station</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 animate-pulse">
                  Live Sync Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Acuity Scoring (Manchester Protocol) · Automatic Kiosk Red-Flag Ingestion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs">
              <span className="text-slate-400">Logged Officer: </span>
              <strong className="text-slate-800 dark:text-slate-200">{currentUser.name}</strong>
            </div>
          </div>
        </div>

        {/* Acuity Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 ml-2" />
            <span className="text-xs font-bold text-slate-500 mr-2">Filter Acuity:</span>
            
            {(['ALL', 'RED', 'AMBER', 'YELLOW', 'GREEN'] as const).map((p) => {
              const count = p === 'ALL' ? encounters.length : encounters.filter(e => e.priority === p).length;
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPriority(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedPriority === p
                      ? p === 'RED' ? 'bg-rose-500 text-white shadow-md' :
                        p === 'AMBER' ? 'bg-amber-500 text-slate-950 shadow-md' :
                        p === 'YELLOW' ? 'bg-yellow-500 text-slate-950 shadow-md' :
                        p === 'GREEN' ? 'bg-emerald-500 text-slate-950 shadow-md' :
                        'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span>{p}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]">{count}</span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 mr-2">
            {alerts.filter(a => !a.is_acknowledged).length} Pending Red-Flag Action(s)
          </p>
        </div>

        {/* Main Grid: Live Queue (Left) vs Selected Red-Flag Action Panel (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Triage Patient Queue (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Active Ingested Patient Queue
            </h2>

            {filteredEncounters.map((enc) => {
              const pat = getPatientForEncounter(enc.patient_id);
              const relatedAlert = alerts.find(a => a.encounter_id === enc.id);
              const isSelected = selectedAlert?.encounter_id === enc.id;

              return (
                <div
                  key={enc.id}
                  onClick={() => {
                    if (relatedAlert) setSelectedAlert(relatedAlert);
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-rose-500 shadow-lg ring-2 ring-rose-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          enc.priority === 'RED' ? 'bg-rose-500 text-white animate-pulse' :
                          enc.priority === 'AMBER' ? 'bg-amber-500 text-slate-950' :
                          enc.priority === 'YELLOW' ? 'bg-yellow-400 text-slate-950' :
                          'bg-emerald-500 text-slate-950'
                        }`}>
                          {enc.priority} PRIORITY
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {pat?.abha_id || pat?.demo_id}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {pat?.full_name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {pat?.age_years}Y · {pat?.gender?.toUpperCase()} · Language: {pat?.preferred_language?.toUpperCase()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Wait: ~12m</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-xs">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {enc.chief_complaint_summary || 'Intake registered at Kiosk.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t text-xs">
                    <span className={`font-semibold text-[11px] ${
                      enc.status === 'triage_required' ? 'text-rose-500 animate-pulse' :
                      enc.status === 'ready_for_doctor' ? 'text-sky-500' : 'text-emerald-500'
                    }`}>
                      ● Status: {enc.status.replace(/_/g, ' ').toUpperCase()}
                    </span>

                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 group-hover:text-slate-700">
                      <span>Click to Action</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Red-Flag Action & Escalation Box (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Immediate Triage Action Center
            </h2>

            {selectedAlert ? (
              <div className="bg-white dark:bg-slate-900 border border-rose-500/40 rounded-3xl p-6 shadow-xl flex flex-col gap-5 sticky top-24">
                
                {/* Red Flag Badge */}
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2 text-rose-500">
                    <Flame className="w-5 h-5 animate-bounce" />
                    <span className="font-extrabold text-sm uppercase tracking-wide">
                      {selectedAlert.severity} Flag Triggered
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    selectedAlert.is_acknowledged ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-rose-100 dark:bg-rose-950 text-rose-600 animate-pulse'
                  }`}>
                    {selectedAlert.is_acknowledged ? 'ACKNOWLEDGED' : 'ACTION REQUIRED'}
                  </span>
                </div>

                {/* Clinical Trigger Details */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Trigger Symptom:</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5 text-sm">
                      {selectedAlert.trigger_symptom}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Clinical Rationale:</span>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-200 dark:border-rose-900">
                      {selectedAlert.clinical_rationale}
                    </p>
                  </div>
                </div>

                {/* Escalation Bay Assign */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Assign Emergency Bay / Station
                  </label>
                  <select
                    value={assignedBay}
                    onChange={(e) => setAssignedBay(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Emergency Resuscitation Bay 2">Emergency Resuscitation Bay 2 (STAT ECG)</option>
                    <option value="Cardiology Acute Care Unit">Cardiology Acute Care Unit</option>
                    <option value="General Fast-Track OPD">General Fast-Track OPD</option>
                    <option value="AYUSH Specialty OPD">AYUSH Specialty OPD</option>
                  </select>
                </div>

                {/* Triage Nurse Action Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nurse Triage Action Notes
                  </label>
                  <textarea
                    rows={3}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="e.g. Wheelchaired to ER Bay 2, 12-lead ECG underway, Dr. Sen notified..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  />
                </div>

                {/* Acknowledge & Dispatch Button */}
                <button
                  onClick={() => handleAcknowledge(selectedAlert.id)}
                  className="w-full py-3.5 rounded-xl bg-rose-500 hover:bg-rose-600 font-bold text-white text-xs shadow-lg shadow-rose-500/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Acknowledge & Fast-Track to Doctor</span>
                </button>

                <div className="pt-2 border-t flex justify-between text-[11px] text-slate-400">
                  <span>Encounter ID: {selectedAlert.encounter_id.slice(0, 8)}...</span>
                  <Link href="/doctor" className="text-sky-500 hover:underline font-semibold">
                    Open in Doctor View →
                  </Link>
                </div>

              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-slate-100 dark:bg-slate-800/40 border border-dashed text-center text-slate-400 text-xs">
                Select an encounter from the active queue on the left to inspect red-flag details and triage actions.
              </div>
            )}

          </div>

        </div>

      </div>
    </RoleGuard>
  );
}
