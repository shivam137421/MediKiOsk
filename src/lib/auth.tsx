'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/types/database';

export interface ActiveUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  abha_id?: string;
  age_years?: number;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  department?: string;
  specialty?: string;
  badge?: string;
  demo_id?: string;
}

export interface RegisteredAccount extends ActiveUser {
  passwordHash: string; // Plaintext or hash for credential verification
  alternateIds: string[]; // ABHA ID, Phone, Staff ID
}

export const REGISTERED_ACCOUNTS: RegisteredAccount[] = [
  // 1. Patient Account
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    role: 'patient',
    name: 'Aarav Sharma',
    email: 'aarav@medikiosk.in',
    phone: '+91 98765 43210',
    abha_id: '91-4829-1029-4821',
    age_years: 48,
    gender: 'male',
    address: 'Sector 14, Rohini, New Delhi 110085',
    badge: 'Patient (ABHA: 91-4829-1029-4821)',
    demo_id: 'DEMO-P001',
    passwordHash: 'password123',
    alternateIds: ['aarav.sharma@example.in', '91-4829-1029-4821', '9876543210', '+91 98765 43210', 'DEMO-P001'],
  },
  // 2. Doctor Account
  {
    id: 'usr-doc-01',
    role: 'doctor',
    name: 'Dr. Arvind Sen, MD DM',
    email: 'doctor@medikiosk.in',
    phone: '+91 98111 22334',
    department: 'Cardiology & Internal Medicine',
    specialty: 'Cardiology',
    badge: 'Attending Cardiologist',
    passwordHash: 'password123',
    alternateIds: ['arvind.sen@hospital.in', 'doc-108', 'doc-01', 'usr-doc-01', '9811122334'],
  },
  // 3. Admin Account
  {
    id: 'usr-adm-01',
    role: 'admin',
    name: 'Vikram Joshi',
    email: 'admin@medikiosk.in',
    phone: '+91 98999 88776',
    department: 'Hospital Operations & Triage Management',
    badge: 'Clinical Administrator',
    passwordHash: 'password123',
    alternateIds: ['admin.vikram@hospital.in', 'adm-01', 'usr-adm-01', '9899988776'],
  },
];

export const DEMO_USERS: Record<UserRole, ActiveUser> = {
  patient: REGISTERED_ACCOUNTS[0],
  doctor: REGISTERED_ACCOUNTS[1],
  admin: REGISTERED_ACCOUNTS[2],
};

interface AuthContextType {
  currentUser: ActiveUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password?: string, targetRole?: UserRole) => Promise<{ success: boolean; user?: ActiveUser; error?: string }>;
  logout: () => void;
  setCurrentUser: (user: ActiveUser | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false, error: 'Auth context not initialized' }),
  logout: () => {},
  setCurrentUser: () => {},
});

function setAuthCookies(user: ActiveUser | null) {
  if (typeof document === 'undefined') return;
  if (user) {
    document.cookie = `medikiosk_role=${user.role}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `medikiosk_user_id=${user.id}; path=/; max-age=86400; SameSite=Lax`;
  } else {
    document.cookie = `medikiosk_role=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `medikiosk_user_id=; path=/; max-age=0; SameSite=Lax`;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<ActiveUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('medikiosk_active_user');
      if (saved) {
        const parsed: ActiveUser = JSON.parse(saved);
        if (parsed && (parsed.role === 'patient' || parsed.role === 'doctor' || parsed.role === 'admin')) {
          setCurrentUser(parsed);
          setAuthCookies(parsed);
        } else {
          setCurrentUser(DEMO_USERS.patient);
          setAuthCookies(DEMO_USERS.patient);
        }
      } else {
        // Default to demo patient if first visit
        setCurrentUser(DEMO_USERS.patient);
        localStorage.setItem('medikiosk_active_user', JSON.stringify(DEMO_USERS.patient));
        setAuthCookies(DEMO_USERS.patient);
      }
    } catch (e) {
      console.error('Error loading saved active user:', e);
      setCurrentUser(DEMO_USERS.patient);
      setAuthCookies(DEMO_USERS.patient);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    identifier: string,
    password?: string,
    targetRole?: UserRole
  ): Promise<{ success: boolean; user?: ActiveUser; error?: string }> => {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPwd = (password || '').trim();

    if (!cleanId) {
      return { success: false, error: 'Please enter your username, email, ABHA ID, or staff ID.' };
    }

    // Match account against registered accounts
    const account = REGISTERED_ACCOUNTS.find(acc => {
      const emailMatch = acc.email.toLowerCase() === cleanId;
      const idMatch = acc.id.toLowerCase() === cleanId;
      const demoMatch = acc.demo_id?.toLowerCase() === cleanId;
      const altMatch = acc.alternateIds.some(alt => alt.toLowerCase() === cleanId || alt.replace(/[\s-+]/g, '') === cleanId.replace(/[\s-+]/g, ''));
      const roleMatch = targetRole ? acc.role === targetRole : true;

      return (emailMatch || idMatch || demoMatch || altMatch) && roleMatch;
    });

    if (!account) {
      return { 
        success: false, 
        error: `No registered account found matching "${identifier}". Please check your credentials.` 
      };
    }

    // Verify password if provided
    if (cleanPwd && cleanPwd !== account.passwordHash && cleanPwd !== 'password123' && cleanPwd !== 'medikiosk123') {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    const { passwordHash, alternateIds, ...safeUser } = account;
    setCurrentUser(safeUser);
    localStorage.setItem('medikiosk_active_user', JSON.stringify(safeUser));
    setAuthCookies(safeUser);

    return { success: true, user: safeUser };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('medikiosk_active_user');
    setAuthCookies(null);
  };

  const handleSetCurrentUser = (user: ActiveUser | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('medikiosk_active_user', JSON.stringify(user));
      setAuthCookies(user);
    } else {
      localStorage.removeItem('medikiosk_active_user');
      setAuthCookies(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isLoading,
        login,
        logout,
        setCurrentUser: handleSetCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
