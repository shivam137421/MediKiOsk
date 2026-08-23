'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Stethoscope, 
  AlertTriangle, 
  ShieldCheck, 
  Smartphone, 
  Leaf, 
  FileText, 
  Mic, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Users, 
  HeartPulse,
  Bot
} from 'lucide-react';
import { mockDB } from '@/lib/supabase/mock-db';
import { dataService } from '@/lib/supabase/service';

export default function HomePage() {
  const [stats, setStats] = useState({
    totalPatients: 3,
    activeEncounters: 3,
    redAlerts: 1,
    verifiedToday: 0
  });

  useEffect(() => {
    const update = async () => {
      const patients = await dataService.getPatients();
      const encounters = await dataService.getEncounters();
      const alerts = (await dataService.getTriageAlerts()).filter(a => !a.is_acknowledged && a.severity === 'RED');
      const verified = mockDB.getState().aiSummaries.filter(s => s.is_verified);
      setStats({
        totalPatients: patients.length,
        activeEncounters: encounters.length,
        redAlerts: alerts.length,
        verifiedToday: verified.length
      });
    };
    update();
    const unsubscribe = mockDB.subscribe(update);
    return () => unsubscribe();
  }, []);

  const portals = [
    {
      title: 'Patient Intake Kiosk',
      desc: 'Large touch + voice conversational intake in Hindi & English with informed consent, symptom ontology trees, and document OCR.',
      href: '/kiosk',
      icon: Smartphone,
      gradient: 'from-emerald-500 to-teal-700',
      badge: 'Touch & Voice Enabled',
      accentColor: 'border-emerald-200 dark:border-emerald-800'
    },
    {
      title: 'Doctor Consultation Hub',
      desc: 'Structured clinical summary, medical timeline, extracted prescriptions/labs, and doctor-supervised AI suggestions with full edit & sign-off.',
      href: '/doctor',
      icon: Stethoscope,
      gradient: 'from-sky-500 to-blue-700',
      badge: 'Physician Review Draft',
      accentColor: 'border-sky-200 dark:border-sky-800'
    },
    {
      title: 'Emergency Triage Station',
      desc: 'Realtime red-flag detection feed, automated Manchester/AIIMS acuity scoring, patient escalation, and live doctor sync.',
      href: '/triage',
      icon: AlertTriangle,
      gradient: 'from-rose-500 to-red-700',
      badge: `${stats.redAlerts} Active Red Flag`,
      accentColor: 'border-rose-200 dark:border-rose-800'
    },
    {
      title: 'AYUSH / Ayurveda Mode',
      desc: 'Comprehensive Ayurvedic case-taking capturing Prakriti, Vikriti, Agni, Dhatu, Ahara-Vihara, and Rogi-Roga Pariksha.',
      href: '/kiosk?mode=ayush',
      icon: Leaf,
      gradient: 'from-amber-500 to-yellow-700',
      badge: 'Ayush & AIIA Mode',
      accentColor: 'border-amber-200 dark:border-amber-800'
    },
    {
      title: 'Hospital Admin & Audit',
      desc: 'Realtime intake volume analytics, department/kiosk status, AI feature flags, and tamper-evident clinical audit logs.',
      href: '/admin',
      icon: ShieldCheck,
      gradient: 'from-slate-700 to-slate-900',
      badge: 'Compliance & Logs',
      accentColor: 'border-slate-200 dark:border-slate-700'
    }
  ];

  return (
    <div className="flex flex-col gap-12 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white p-8 sm:p-12 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart India Hackathon 2024 · Problem Statement 26047</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white mb-4">
            Next-Generation <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">AI Clinical Intake</span> & Triage
          </h1>

          <p className="text-lg text-slate-300 font-normal leading-relaxed mb-8">
            Engineered for high-volume Indian hospitals & AYUSH centers. Empowering patients with voice-assisted vernacular intake while providing physicians with structured, verified clinical drafts and proactive red-flag alerts.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/kiosk"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-semibold text-slate-950 text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
            >
              <Smartphone className="w-4 h-4" />
              <span>Launch Patient Kiosk</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/doctor"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all hover:scale-105"
            >
              <Stethoscope className="w-4 h-4 text-sky-400" />
              <span>Open Doctor Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Live Hospital Metrics Strip */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-800/80 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalPatients}</p>
              <p className="text-xs text-slate-400 font-medium">Registered Patients</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-800/80 text-sky-400">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.activeEncounters}</p>
              <p className="text-xs text-slate-400 font-medium">Active Encounters</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/50">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-300">{stats.redAlerts}</p>
              <p className="text-xs text-rose-400/80 font-medium">Red Flag Alert</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-800/80 text-teal-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.verifiedToday}</p>
              <p className="text-xs text-slate-400 font-medium">Verified by Doctor</p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Navigation Grid */}
      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Role-Based Clinical Modules
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Select a station to test the synchronized clinical workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portals.map((portal, idx) => {
            const Icon = portal.icon;
            return (
              <Link
                key={idx}
                href={portal.href}
                className={`group relative p-6 rounded-2xl bg-white dark:bg-slate-900 border ${portal.accentColor} shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${portal.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {portal.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2">
                    {portal.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {portal.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <span>Enter Station</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Clinical Workflow Pipeline Explanation */}
      <section className="rounded-2xl p-6 sm:p-8 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          End-to-End Case Intake Pipeline
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">1. ID & Consent</span>
            <p className="text-slate-500 dark:text-slate-400 mt-1">ABHA/Demo registration, language choice, audible consent.</p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">2. Voice+Touch AI</span>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Adaptive symptom ontology trees in Hindi/English.</p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">3. Multi-Doc OCR</span>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Prescriptions, labs & discharge summaries extracted.</p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-rose-500">4. Red-Flag Triage</span>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Immediate safety interrupt for chest pain & emergencies.</p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-sky-500">5. Doctor Sign-Off</span>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Review AI draft, edit summary, verify medications.</p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-amber-500">6. FHIR / Audit</span>
            <p className="text-slate-500 dark:text-slate-400 mt-1">ABDM-ready export & tamper-evident audit trail.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
