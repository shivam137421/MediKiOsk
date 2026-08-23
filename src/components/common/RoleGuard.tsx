'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/types/database';
import { DEMO_USERS } from '@/lib/supabase/mock-db';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  stationName: string;
}

export function RoleGuard({ allowedRoles, children, stationName }: RoleGuardProps) {
  const { currentUser, setCurrentUser } = useAuth();

  const hasAccess = allowedRoles.includes(currentUser.role);

  if (!hasAccess) {
    const recommendedUser = DEMO_USERS.find((u) => allowedRoles.includes(u.role));

    return (
      <div className="flex-1 flex items-center justify-center p-6 max-w-xl mx-auto w-full">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Access Restricted
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            The <strong>{stationName}</strong> requires authorized clinical privileges ({allowedRoles.join(', ')}). Your current active role is <strong className="text-slate-800 dark:text-slate-200">{currentUser.name} ({currentUser.role})</strong>.
          </p>

          {recommendedUser && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mb-6 text-left">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Quick Demo Switch
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{recommendedUser.name}</p>
                  <p className="text-xs text-slate-500">{recommendedUser.badge}</p>
                </div>
                <button
                  onClick={() => setCurrentUser(recommendedUser)}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-semibold text-slate-950 text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Switch & Enter</span>
                </button>
              </div>
            </div>
          )}

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <span>Return to Portal Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
