'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Stethoscope, 
  UserCheck, 
  ShieldCheck, 
  Sparkles, 
  ChevronDown, 
  AlertCircle,
  Menu,
  X,
  Activity,
  HeartPulse
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '@/lib/auth';
import { UserRole } from '@/types/database';

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, switchRole } = useAuth();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/patient', label: 'Patient Care' },
    { href: '/doctor', label: 'Doctor Hub' },
    { href: '/admin', label: 'Admin Center' },
  ];

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role);
    setIsRoleDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-300">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                MediKiosk
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                  AI Intake
                </span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Clinical Intake & Doctor Appointment System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Role Switcher Dropdown & Auth Status */}
        <div className="flex items-center gap-3">
          
          {/* Quick Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 text-xs transition-all shadow-sm"
              title="Switch Active User Role"
            >
              <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-600 flex items-center justify-center font-bold text-[11px]">
                {currentUser.role === 'doctor' ? <Stethoscope className="w-3.5 h-3.5" /> :
                 currentUser.role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5" /> :
                 <UserCheck className="w-3.5 h-3.5" />}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-slate-400 uppercase font-bold leading-tight">
                  {currentUser.role}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px] text-xs">
                  {currentUser.name}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Switch Active User Role
                  </p>
                  <p className="text-xs text-slate-500">
                    Switch instantly to test different portal perspectives.
                  </p>
                </div>

                {(['patient', 'doctor', 'admin'] as UserRole[]).map((role) => {
                  const demoUser = DEMO_USERS[role];
                  const isCurrent = currentUser.role === role;
                  const Icon = role === 'doctor' ? Stethoscope : role === 'admin' ? ShieldCheck : UserCheck;

                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleSelect(role)}
                      className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-colors text-left ${
                        isCurrent
                          ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        role === 'doctor' ? 'bg-sky-100 text-sky-600 dark:bg-sky-950' :
                        role === 'admin' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800' :
                        'bg-emerald-100 text-emerald-600 dark:bg-emerald-950'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs capitalize font-bold">{role}</span>
                          {isCurrent && <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500 text-white">Active</span>}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{demoUser.name}</p>
                      </div>
                    </button>
                  );
                })}

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href="/auth/login"
                    onClick={() => setIsRoleDropdownOpen(false)}
                    className="block text-center text-xs text-sky-500 hover:text-sky-600 font-semibold py-1"
                  >
                    View All Staff & Patient Profiles →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Nav Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-semibold ${
                pathname === link.href
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
