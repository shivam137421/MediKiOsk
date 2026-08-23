'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Stethoscope, 
  UserCheck, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Lock,
  HeartPulse,
  Building2
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '@/lib/auth';
import { UserRole } from '@/types/database';

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, switchRole, setCurrentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUser.role);
  const [hospitalId, setHospitalId] = useState('');
  const [password, setPassword] = useState('');

  const demoAccounts = [
    {
      id: 'a1111111-1111-1111-1111-111111111111',
      role: 'patient' as UserRole,
      name: 'Aarav Sharma',
      badge: 'Patient (ABHA: 91-4829-1029-4821)',
      desc: 'Voice & text intake, document upload, appointment tracker',
      route: '/patient',
    },
    {
      id: 'usr-doc-01',
      role: 'doctor' as UserRole,
      name: 'Dr. Arvind Sen, MD DM',
      badge: 'Attending Cardiologist',
      desc: 'Assigned patient queue, clinical draft review, propose appointment',
      route: '/doctor',
    },
    {
      id: 'usr-adm-01',
      role: 'admin' as UserRole,
      name: 'Vikram Joshi',
      badge: 'Clinical Administrator',
      desc: 'Incoming patient queue, doctor assignment, appointment confirmation, audit logs',
      route: '/admin',
    },
  ];

  const handleQuickLogin = (account: typeof demoAccounts[0]) => {
    switchRole(account.role);
    setCurrentUser({
      id: account.id,
      role: account.role,
      name: account.name,
      badge: account.badge,
    });
    router.push(account.route);
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    switchRole(selectedRole);
    if (selectedRole === 'patient') router.push('/patient');
    else if (selectedRole === 'doctor') router.push('/doctor');
    else if (selectedRole === 'admin') router.push('/admin');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-sky-500 to-teal-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-sky-500/20 mb-3">
          <HeartPulse className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          MediKiosk Portal Authentication
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Sign in to access your designated role portal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
        
        {/* Left Column: 1-Click Demo Profiles (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Instant 1-Click Role Profiles
            </h2>
          </div>

          {demoAccounts.map((account) => {
            const isCurrent = currentUser.role === account.role;
            const Icon = account.role === 'doctor' ? Stethoscope : account.role === 'admin' ? ShieldCheck : UserCheck;

            return (
              <button
                key={account.id}
                onClick={() => handleQuickLogin(account)}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between group ${
                  isCurrent
                    ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-500 shadow-md ring-2 ring-sky-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    account.role === 'doctor' ? 'bg-sky-100 dark:bg-sky-950 text-sky-600' :
                    account.role === 'admin' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' :
                    'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold capitalize text-slate-900 dark:text-white">
                        {account.role}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-sky-500 text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {account.name}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {account.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-sky-500 font-bold text-xs group-hover:translate-x-1 transition-transform self-center">
                  <span>Enter</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Custom Login Form (5 cols) */}
        <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Staff ID Sign In
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Select Portal Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="patient">Patient (Intake & Appointments)</option>
                <option value="doctor">Doctor (Consultation Hub)</option>
                <option value="admin">Administrator (Triage & Assignment)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                User / Staff ID
              </label>
              <input
                type="text"
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                placeholder="e.g. DOC-108 / ADM-01"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Password / Passcode
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold text-xs shadow-md transition-all mt-2"
            >
              Sign In to Selected Portal
            </button>
          </form>

          <div className="pt-4 border-t text-center text-[11px] text-slate-400 mt-4">
            <span>Hospital security & role policies active</span>
          </div>
        </div>

      </div>

    </div>
  );
}
