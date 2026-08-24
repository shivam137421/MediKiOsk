'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogOut, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/types/database';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  stationName: string;
}

export function RoleGuard({ children, allowedRoles, stationName }: RoleGuardProps) {
  const router = useRouter();
  const { currentUser, isAuthenticated, logout } = useAuth();

  // 1. Not Logged In
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[60vh]">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 mb-6 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 mb-3 uppercase tracking-wider">
          Authentication Required
        </span>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Please Sign In to Access {stationName}
        </h2>

        <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          This clinical station requires verified credentials. Please log in with an authorized account to continue.
        </p>

        <Link
          href="/auth/login"
          className="w-full py-3.5 px-6 rounded-2xl bg-sky-500 hover:bg-sky-600 font-bold text-white text-xs shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Sign In to MediKiosk</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // 2. Role Authorized
  const isAllowed = allowedRoles.includes(currentUser.role);
  if (isAllowed) {
    return <>{children}</>;
  }

  // 3. Logged In But Unauthorized for this Station (Strict block without role-switch bypass)
  const homeDashboardRoute = 
    currentUser.role === 'patient' ? '/patient' :
    currentUser.role === 'doctor' ? '/doctor' : '/admin';

  const handleSignOutAndRelogin = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto min-h-[60vh]">
      <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 mb-6 shadow-inner">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-600 mb-3 uppercase tracking-wider">
        Restricted Station Access
      </span>

      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        Access Denied to {stationName}
      </h2>

      <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
        You are currently signed in as <strong className="text-slate-900 dark:text-white font-bold">{currentUser.name}</strong> with role <strong className="capitalize text-rose-600 dark:text-rose-400 font-bold">({currentUser.role})</strong>.
        <br />
        This portal is restricted exclusively to authorized <strong>{allowedRoles.join(' / ')}</strong> personnel.
      </p>

      <div className="w-full flex flex-col gap-3 mb-6">
        <Link
          href={homeDashboardRoute}
          className="w-full p-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Return to My Dashboard ({currentUser.role.toUpperCase()})</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <button
          onClick={handleSignOutAndRelogin}
          className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out & Log In with Authorized Account</span>
        </button>
      </div>

      <Link
        href="/"
        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline"
      >
        ← Return to MediKiosk Homepage
      </Link>
    </div>
  );
}
