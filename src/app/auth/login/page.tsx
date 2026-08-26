'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Stethoscope, 
  UserCheck, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Mail, 
  KeyRound, 
  HeartPulse, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth, REGISTERED_ACCOUNTS } from '@/lib/auth';
import { UserRole } from '@/types/database';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<UserRole>('patient');
  const [identifier, setIdentifier] = useState('aarav@medikiosk.in');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Tab change handler
  const handleTabChange = (role: UserRole) => {
    setActiveTab(role);
    setErrorMessage('');
    if (role === 'patient') {
      setIdentifier('aarav@medikiosk.in');
      setPassword('password123');
    } else if (role === 'doctor') {
      setIdentifier('doctor@medikiosk.in');
      setPassword('password123');
    } else if (role === 'admin') {
      setIdentifier('admin@medikiosk.in');
      setPassword('password123');
    }
  };

  // Real credential submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await login(identifier, password, activeTab);
      if (result.success && result.user) {
        // Route strictly to the user's authenticated dashboard role
        const targetRoute = redirectPath || (
          result.user.role === 'patient' ? '/patient' :
          result.user.role === 'doctor' ? '/doctor' : '/admin'
        );
        router.push(targetRoute);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTabLabel = (role: UserRole) => {
    switch (role) {
      case 'patient': return 'Patient Portal';
      case 'doctor': return 'Doctor Consultation';
      case 'admin': return 'Hospital Admin';
      default: return role;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-sky-500 to-teal-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-sky-500/20 mb-3">
          <HeartPulse className="w-7 h-7 animate-pulse" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          MediKiosk Authentication
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Sign in with your verified credentials to access your clinical dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
        
        {/* Left Column: Real Credentials Form (7 cols) */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          
          {/* Role Selection Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
            {(['patient', 'doctor', 'admin'] as UserRole[]).map((role) => {
              const isActive = activeTab === role;
              const Icon = role === 'doctor' ? Stethoscope : role === 'admin' ? ShieldCheck : UserCheck;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleTabChange(role)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="capitalize">{role}</span>
                </button>
              );
            })}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {activeTab === 'patient' ? 'Email / ABHA ID / Mobile Number' :
                 activeTab === 'doctor' ? 'Doctor Staff ID / Hospital Email' :
                 'Administrator ID / Hospital Email'}
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    activeTab === 'patient' ? 'aarav@medikiosk.in or 91-4829-1029-4821' :
                    activeTab === 'doctor' ? 'doctor@medikiosk.in or doc-108' :
                    'admin@medikiosk.in or adm-01'
                  }
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-2xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Account Password
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border rounded-2xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 active:scale-98 font-bold text-white text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <span>Verifying Credentials...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In as {activeTab.toUpperCase()}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center mt-6">
            Protected by MediKiosk RBAC Authentication. Unauthorized access attempts are monitored and logged.
          </p>
        </div>

        {/* Right Column: Verified Demo Credentials Reference (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Demo Accounts Reference
            </h2>
          </div>

          {REGISTERED_ACCOUNTS.map((account) => {
            const isTabMatch = activeTab === account.role;
            const Icon = account.role === 'doctor' ? Stethoscope : account.role === 'admin' ? ShieldCheck : UserCheck;

            return (
              <div
                key={account.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isTabMatch
                    ? 'bg-sky-50/60 dark:bg-sky-950/40 border-sky-400 ring-2 ring-sky-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      account.role === 'doctor' ? 'bg-sky-100 text-sky-600 dark:bg-sky-950' :
                      account.role === 'admin' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                      'bg-emerald-100 text-emerald-600 dark:bg-emerald-950'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold capitalize text-slate-900 dark:text-white">
                          {account.role}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                          password123
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {account.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {account.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(account.role);
                      setIdentifier(account.email);
                      setPassword('password123');
                      setErrorMessage('');
                    }}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 hover:text-sky-600 dark:hover:bg-sky-950 text-slate-600 dark:text-slate-300 transition-colors shrink-0 cursor-pointer"
                  >
                    Use
                  </button>
                </div>
              </div>
            );
          })}

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 text-xs">
            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
              🔒 Strict Role-Based Security:
            </p>
            <p className="text-[11px] leading-relaxed">
              Every portal route validates the account's assigned role. Switching roles requires signing out and authenticating with the respective role credentials.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading MediKiosk Login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
