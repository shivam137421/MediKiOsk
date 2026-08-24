'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  UserCheck, 
  Stethoscope, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Mic, 
  FileText, 
  Calendar, 
  Clock, 
  Shield, 
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '@/lib/auth';
import { mockDB } from '@/lib/supabase/mock-db';

export default function HomePage() {
  const [stats, setStats] = useState({
    totalEncounters: 3,
    emergencyCount: 1,
    assignedCount: 2,
    confirmedCount: 1,
  });

  useEffect(() => {
    const updateStats = () => {
      const state = mockDB.getState();
      const encounters = state.encounters;
      setStats({
        totalEncounters: encounters.length,
        emergencyCount: encounters.filter(e => e.is_emergency).length,
        assignedCount: encounters.filter(e => e.assigned_doctor_id !== null).length,
        confirmedCount: encounters.filter(e => e.status === 'appointment_confirmed').length,
      });
    };
    updateStats();
    const unsubscribe = mockDB.subscribe(updateStats);
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full">
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        
        {/* Simple Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
          <span>AI-Assisted Patient Intake & Doctor Appointment System</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Intelligent Clinical Care, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Simplified from Intake to Appointment
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
          Patients speak or type their symptoms naturally. Our AI generates a verified clinical summary, detects emergencies, and recommends the right medical specialty for instant doctor assignment.
        </p>

        {/* Live System Counter Pill */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-500" />
            <strong className="text-slate-800 dark:text-slate-200">{stats.totalEncounters}</strong> Patients Ingested
          </span>
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <strong className="text-slate-800 dark:text-slate-200">{stats.emergencyCount}</strong> Priority Alerts
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sky-500" />
            <strong className="text-slate-800 dark:text-slate-200">{stats.confirmedCount}</strong> Appointments Scheduled
          </span>
        </div>
      </div>

      {/* Primary Action Cards: Exactly Three Roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
        
        {/* Option 1: Patient */}
        <Link
          href="/patient"
          className="group relative flex flex-col justify-between p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UserCheck className="w-7 h-7" />
            </div>

            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              For Patients
            </span>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 mb-2">
              I'm a Patient
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Describe your health problem using voice or text in Hindi or English, upload previous prescriptions, and receive your confirmed doctor appointment.
            </p>

            <ul className="mt-5 space-y-2 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-emerald-500" />
                <span>Voice-first symptom conversation</span>
              </li>
              <li className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span>Upload past reports & prescriptions</span>
              </li>
              <li className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>Track appointment status live</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>Start Voice Intake</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </Link>

        {/* Option 2: Doctor */}
        <Link
          href="/doctor"
          className="group relative flex flex-col justify-between p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/60 dark:hover:border-sky-500/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Stethoscope className="w-7 h-7" />
            </div>

            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              For Physicians
            </span>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 mb-2">
              I'm a Doctor
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Review assigned patient intake packages, verify AI-extracted summaries, propose appointment slots, and conduct consultations with full patient history.
            </p>

            <ul className="mt-5 space-y-2 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-sky-500" />
                <span>Complete pre-visit clinical summary</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                <span>Source-linked timeline & OCR reports</span>
              </li>
              <li className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-sky-500" />
                <span>Propose & confirm appointment slots</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400">
            <span>Open Doctor Hub</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </Link>

        {/* Option 3: Admin */}
        <Link
          href="/admin"
          className="group relative flex flex-col justify-between p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-700/60 dark:hover:border-slate-500/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              For Hospital Ops
            </span>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 mb-2">
              Admin Login
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Triage incoming patient intake queue with automatic emergency prioritization, assign matching doctors, confirm appointments, and inspect audit logs.
            </p>

            <ul className="mt-5 space-y-2 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>Emergency top-of-queue priority</span>
              </li>
              <li className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Match doctors by medical specialty</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span>Confirm appointments & audit trail</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Enter Admin Center</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </Link>

      </div>

      {/* Quick 5-Step Workflow Explainer */}
      <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 text-center">
          How MediKiosk Works — 5 Simple Steps
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border shadow-2xs">
            <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-extrabold text-[11px] flex items-center justify-center mb-2">1</span>
            <strong className="block text-slate-900 dark:text-white mb-1">Patient AI Intake</strong>
            <p className="text-slate-500 text-[11px]">Natural voice conversation + follow-up clarifying questions + document upload.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border shadow-2xs">
            <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-extrabold text-[11px] flex items-center justify-center mb-2">2</span>
            <strong className="block text-slate-900 dark:text-white mb-1">Admin Doctor Assignment</strong>
            <p className="text-slate-500 text-[11px]">Admin reviews recommended specialty. Emergencies jump straight to the top of the queue.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border shadow-2xs">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-extrabold text-[11px] flex items-center justify-center mb-2">3</span>
            <strong className="block text-slate-900 dark:text-white mb-1">Doctor Review & Slot</strong>
            <p className="text-slate-500 text-[11px]">Doctor reviews full AI draft and proposes an appointment date & time slot.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border shadow-2xs">
            <span className="w-6 h-6 rounded-full bg-purple-500 text-white font-extrabold text-[11px] flex items-center justify-center mb-2">4</span>
            <strong className="block text-slate-900 dark:text-white mb-1">Admin Confirmation</strong>
            <p className="text-slate-500 text-[11px]">Admin confirms the slot, logging it in the audit trail and notifying the patient.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border shadow-2xs">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-extrabold text-[11px] flex items-center justify-center mb-2">5</span>
            <strong className="block text-slate-900 dark:text-white mb-1">Confirmed Consultation</strong>
            <p className="text-slate-500 text-[11px]">Patient sees confirmed appointment card. Doctor already has complete pre-visit history.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
