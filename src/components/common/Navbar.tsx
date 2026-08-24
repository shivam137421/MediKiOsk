'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Stethoscope, 
  UserCheck, 
  ShieldCheck, 
  LogOut, 
  LogIn,
  Menu,
  X,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Role-specific navigation links: strictly shows only accessible portals
  const getNavLinks = () => {
    if (!isAuthenticated || !currentUser) {
      return [
        { href: '/', label: 'Home' },
        { href: '/auth/login', label: 'Sign In' },
      ];
    }

    if (currentUser.role === 'patient') {
      return [
        { href: '/', label: 'Home' },
        { href: '/patient', label: 'My Care Portal' },
      ];
    }

    if (currentUser.role === 'doctor') {
      return [
        { href: '/', label: 'Home' },
        { href: '/doctor', label: 'Doctor Hub' },
      ];
    }

    if (currentUser.role === 'admin') {
      return [
        { href: '/', label: 'Home' },
        { href: '/admin', label: 'Admin Operations' },
      ];
    }

    return [{ href: '/', label: 'Home' }];
  };

  const navLinks = getNavLinks();

  const handleSignOut = () => {
    logout();
    router.push('/auth/login');
  };

  const getRoleIcon = () => {
    if (!currentUser) return <UserCheck className="w-4 h-4" />;
    if (currentUser.role === 'doctor') return <Stethoscope className="w-4 h-4" />;
    if (currentUser.role === 'admin') return <ShieldCheck className="w-4 h-4" />;
    return <UserCheck className="w-4 h-4" />;
  };

  const getRoleBadgeColor = () => {
    if (!currentUser) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    if (currentUser.role === 'doctor') return 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300';
    if (currentUser.role === 'admin') return 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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

        {/* Right Section: Authenticated User Profile & Sign Out Button */}
        <div className="flex items-center gap-3">
          {isAuthenticated && currentUser ? (
            <div className="flex items-center gap-2.5">
              
              {/* Authenticated Identity Pill */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-2xs">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${getRoleBadgeColor()}`}>
                  {getRoleIcon()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                      {currentUser.role}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate max-w-[140px]">
                    {currentUser.name}
                  </span>
                </div>
              </div>

              {/* Secure Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-600 dark:text-slate-400 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                title="Sign Out of Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 font-bold text-white text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border text-slate-600 dark:text-slate-300"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleSignOut();
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out ({currentUser?.name})</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
