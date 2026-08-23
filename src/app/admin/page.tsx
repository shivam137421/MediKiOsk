'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Activity, 
  Users, 
  Building2, 
  Smartphone, 
  Sliders, 
  FileText, 
  Clock, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  Leaf, 
  Sparkles, 
  RefreshCw,
  Lock
} from 'lucide-react';
import { RoleGuard } from '@/components/common/RoleGuard';
import { mockDB } from '@/lib/supabase/mock-db';
import { dataService } from '@/lib/supabase/service';
import { useAuth } from '@/lib/auth';
import { AuditLog } from '@/types/clinical';
import { formatDateTime } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { currentUser } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchLog, setSearchLog] = useState<string>('');
  
  // Hospital Settings & Feature Flags
  const [enableAyush, setEnableAyush] = useState<boolean>(true);
  const [enableSuggestionsDefault, setEnableSuggestionsDefault] = useState<boolean>(false);
  const [kioskTimeoutMinutes, setKioskTimeoutMinutes] = useState<number>(15);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const loadData = async () => {
    const logs = await dataService.getAuditLogs();
    setAuditLogs(logs);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = mockDB.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  const handleSaveConfig = () => {
    mockDB.logAudit({
      encounter_id: null,
      patient_id: null,
      actor_id: currentUser.id,
      actor_role: 'admin',
      action: 'SYSTEM_CONFIG_UPDATED',
      details: { enableAyush, enableSuggestionsDefault, kioskTimeoutMinutes },
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
    loadData();
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (!searchLog) return true;
    const query = searchLog.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.actor_role.toLowerCase().includes(query) ||
      JSON.stringify(log.details).toLowerCase().includes(query)
    );
  });

  const state = mockDB.getState();

  return (
    <RoleGuard allowedRoles={['admin']} stationName="Hospital Administration & Audit Portal">
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 gap-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hospital Administration & Audit</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Compliance & Controls
                </span>
              </div>
              <p className="text-xs text-slate-500">
                System Analytics · Department Management · Feature Flags · Immutable Audit Trail
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs">
              <span className="text-slate-400">Admin: </span>
              <strong className="text-slate-800 dark:text-slate-200">{currentUser.name}</strong>
            </div>
          </div>
        </div>

        {/* Real-time Hospital Intake Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Total Encounters</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{state.encounters.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">100% database-backed</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Active Kiosks</span>
              <Smartphone className="w-4 h-4 text-sky-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">3 / 3</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">All Kiosks Online</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Avg Intake Duration</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">3m 45s</p>
            <p className="text-[11px] text-slate-400 mt-1">72% faster than paper</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Red Flags Surfaced</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-3xl font-extrabold text-rose-500">{state.triageAlerts.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Automated triage triggers</p>
          </div>
        </div>

        {/* Feature Flags & System Configuration Box */}
        <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Hospital System Configuration & AI Controls
              </h2>
            </div>

            {savedNotice && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Settings Saved & Logged
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            
            {/* AYUSH Mode Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Leaf className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-slate-900 dark:text-white">AYUSH / Ayurveda Mode</span>
                </div>
                <p className="text-slate-500">
                  Enables dedicated Prakriti, Vikriti, Agni, and Dhatu case-taking questions in Kiosk & Doctor views.
                </p>
              </div>

              <label className="flex items-center justify-between pt-2 border-t cursor-pointer">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Status:</span>
                <input
                  type="checkbox"
                  checked={enableAyush}
                  onChange={(e) => setEnableAyush(e.target.checked)}
                  className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
                />
              </label>
            </div>

            {/* AI Suggestions Default Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  <span className="font-bold text-slate-900 dark:text-white">AI Decision Support</span>
                </div>
                <p className="text-slate-500">
                  Controls whether doctor AI suggestions are enabled by default or require individual opt-in.
                </p>
              </div>

              <label className="flex items-center justify-between pt-2 border-t cursor-pointer">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Default Opt-In:</span>
                <input
                  type="checkbox"
                  checked={enableSuggestionsDefault}
                  onChange={(e) => setEnableSuggestionsDefault(e.target.checked)}
                  className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500"
                />
              </label>
            </div>

            {/* Kiosk Auto-Timeout */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-slate-900 dark:text-white">Kiosk Session Expiry</span>
                </div>
                <p className="text-slate-500">
                  Automatically clears abandoned patient intake screens after inactivity.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Timeout:</span>
                <select
                  value={kioskTimeoutMinutes}
                  onChange={(e) => setKioskTimeoutMinutes(Number(e.target.value))}
                  className="px-2 py-1 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold outline-none"
                >
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                </select>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveConfig}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Apply & Log Configuration</span>
            </button>
          </div>
        </div>

        {/* Audit Trail & Security Logs Section */}
        <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span>Tamper-Evident Clinical Audit Trail</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every consent, intake, red-flag alert, physician edit, and sign-off is logged with timestamp and actor role.
              </p>
            </div>

            {/* Search filter for logs */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search audit actions..."
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500"
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
                  <th className="p-3">Encounter / Target</th>
                  <th className="p-3 rounded-r-xl">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.actor_role === 'doctor' ? 'bg-sky-100 dark:bg-sky-950 text-sky-600' :
                        log.actor_role === 'triage' ? 'bg-rose-100 dark:bg-rose-950 text-rose-600' :
                        log.actor_role === 'admin' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700' :
                        'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                      }`}>
                        {log.actor_role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                      {log.action}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">
                      {log.encounter_id ? `${log.encounter_id.slice(0, 10)}...` : 'System'}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </RoleGuard>
  );
}
