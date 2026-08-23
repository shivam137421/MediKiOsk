import React from 'react';
import Link from 'next/link';
import { ShieldCheck, HeartPulse } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Mission */}
        <div className="flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-sky-500" />
          <span className="font-bold text-slate-700 dark:text-slate-300">MediKiosk</span>
          <span>— Intelligent Patient Intake & Doctor Appointment System</span>
        </div>

        {/* Clinical Disclaimer */}
        <div className="text-center md:text-right text-[11px] text-slate-400">
          <span>AI-assisted draft notes require final verification and clinical sign-off by a licensed physician.</span>
        </div>

      </div>
    </footer>
  );
}
