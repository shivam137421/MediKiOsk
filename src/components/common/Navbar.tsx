'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, 
  Stethoscope, 
  AlertTriangle, 
  ShieldCheck, 
  Smartphone, 
  Leaf, 
  UserCircle2, 
  Volume2, 
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { DEMO_USERS, mockDB } from '@/lib/supabase/mock-db';
import { useAuth } from '@/lib/auth';

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, setCurrentUser } = useAuth();
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);

  useEffect(() => {
    const updateStats = () => {
      const alerts = mockDB.getTriageAlerts().filter(a => !a.is_acknowledged && (a.severity === 'RED' || a.severity === 'AMBER'));
      setActiveAlertsCount(alerts.length);
    };
    updateStats();
    const unsubscribe = mockDB.subscribe(updateStats);
    return () => unsubscribe();
  }, []);

  const navLinks = [
    { href: '/kiosk', label: 'Patient Kiosk', icon: Smartphone, color: 'text-emerald-500' },
    { href: '/triage', label: 'Triage Live', icon: AlertTriangle, color: 'text-rose-500', badge: activeAlertsCount > 0 ? activeAlertsCount : null },
    { href: '/doctor', label: 'Doctor Hub', icon: Stethoscope, color: 'text-sky-500' },
    { href: '/admin', label: 'Admin & Audit', icon: ShieldCheck, color: 'text-slate-500' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Clinical Title */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                Medi<span className="text-emerald-600 dark:text-emerald-400">Kiosk</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded">
                v2.0 (SIH 26047)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">
              Ministry of Ayush · AIIA
            </p>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${link.color}`} />
                <span>{link.label}</span>
                {link.badge !== null && link.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-rose-500 text-white rounded-full animate-bounce">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Demo Role Switcher & Status */}
        <div className="flex items-center gap-3">
          
          {/* Quick Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
            >
              <UserCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div className="text-left hidden sm:block">
                <p className="font-semibold text-[11px] leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">{currentUser.badge}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border rounded-xl shadow-xl py-2 z-50">
                <div className="px-3 py-1.5 border-b text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Role (Demo)
                </div>
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentUser(user);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                      currentUser.id === user.id ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <p>{user.name}</p>
                      <p className="text-[10px] text-slate-400">{user.badge} {user.department ? `· ${user.department}` : ''}</p>
                    </div>
                    {currentUser.id === user.id && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
