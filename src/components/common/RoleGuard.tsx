'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowRight, UserCheck, Stethoscope, ShieldCheck } from 'lucide-react';
import { useAuth, DEMO_USERS } from '@/lib/auth';
import { UserRole } from '@/types/database';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  stationName: string;
}

export function RoleGuard({ children, allowedRoles, stationName }: RoleGuardProps) {
  const { currentUser, switchRole } = useAuth();

  const isAllowed = allowedRoles.includes(currentUser.role);

  if (isAllowed) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto min-h-[60vh]">
      <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 mb-6 shadow-inner">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-600 mb-3 uppercase tracking-wider">
        Restricted Portal Access
      </span>

      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        Access Denied to {stationName}
      </h2>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
        Your active role (<strong className="capitalize text-slate-800 dark:text-slate-200">{currentUser.role}</strong>) does not have authorization for this portal. Please switch to an authorized role below:
      </p>

      {/* 1-Click Role Switcher */}
      <div className="w-full flex flex-col gap-2.5 mb-6">
        {allowedRoles.map((role) => {
          const profile = DEMO_USERS[role];
          const Icon = role === 'doctor' ? Stethoscope : role === 'admin' ? ShieldCheck : UserCheck;
          return (
            <button
              key={role}
              onClick={() => switchRole(role)}
              className="w-full p-3.5 rounded-2xl border bg-white dark:bg-slate-900 hover:border-sky-500 hover:shadow-md transition-all flex items-center justify-between group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                    Switch to {role}: {profile.name}
                  </p>
                  <p className="text-[11px] text-slate-400">{profile.badge}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
            </button>
          );
        })}
      </div>

      <Link
        href="/"
        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline"
      >
        ← Return to Main Portal
      </Link>
    </div>
  );
}
