'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Activity, 
  Stethoscope, 
  AlertTriangle, 
  ShieldCheck, 
  Smartphone, 
  UserCheck, 
  ArrowRight,
  Lock,
  Mail
} from 'lucide-react';
import { DEMO_USERS } from '@/lib/supabase/mock-db';
import { useAuth } from '@/lib/auth';
import { DemoUserProfile } from '@/types/clinical';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleDemoLogin = (user: DemoUserProfile) => {
    setCurrentUser(user);
    if (user.role === 'patient') router.push('/kiosk');
    else if (user.role === 'doctor') router.push('/doctor');
    else if (user.role === 'triage') router.push('/triage');
    else if (user.role === 'admin') router.push('/admin');
    else router.push('/');
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Use demo doctor profile if standard login attempted
    handleDemoLogin(DEMO_USERS[0]);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 max-w-4xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white dark:bg-slate-900 border rounded-3xl p-8 shadow-xl w-full">
        
        {/* Left: Standard Login Form */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">MediKiosk Auth</h1>
                <p className="text-xs text-slate-500">Clinical Identity Access Management</p>
              </div>
            </div>

            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hospital Email / Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@hospital.gov.in"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-semibold text-slate-950 text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Sign In with Hospital Credentials</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <p className="text-[11px] text-slate-400 mt-6 text-center">
            Role-Based Access Control (RBAC) enforced via PostgreSQL RLS.
          </p>
        </div>

        {/* Right: Instant 1-Click Demo Profiles */}
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1-Click Demo Profiles
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded">
                Instant Access
              </span>
            </div>

            <div className="space-y-2.5">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleDemoLogin(user)}
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border hover:border-emerald-500 shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      user.role === 'doctor' ? 'bg-sky-100 dark:bg-sky-950 text-sky-600' :
                      user.role === 'triage' ? 'bg-rose-100 dark:bg-rose-950 text-rose-600' :
                      user.role === 'admin' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600' :
                      'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                    }`}>
                      {user.role === 'doctor' ? <Stethoscope className="w-4 h-4" /> :
                       user.role === 'triage' ? <AlertTriangle className="w-4 h-4" /> :
                       user.role === 'admin' ? <ShieldCheck className="w-4 h-4" /> :
                       <Smartphone className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {user.badge} {user.department ? `· ${user.department}` : ''}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-center">
            <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
              ← Return to Main Portal
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
