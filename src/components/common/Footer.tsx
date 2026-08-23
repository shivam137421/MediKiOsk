import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-slate-50 dark:bg-slate-950/60 py-6 text-xs text-slate-500 dark:text-slate-400 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Safety Boundary Statement */}
        <div className="flex items-center gap-2 max-w-2xl">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p>
            <strong className="text-slate-700 dark:text-slate-200">Clinical Decision Support:</strong> MediKiosk generates AI-assisted case drafts and triage alerts. All summaries, extracted entities, and suggestions require mandatory physician verification and sign-off.
          </p>
        </div>

        {/* Hackathon / Institution Note */}
        <div className="flex items-center gap-3 text-right">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-300">
            SIH 26047 · Ayush & AIIA
          </span>
          <p className="text-[11px]">
            © {new Date().getFullYear()} MediKiosk Prototype
          </p>
        </div>

      </div>
    </footer>
  );
}
