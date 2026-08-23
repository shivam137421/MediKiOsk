'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/types/database';

export interface ActiveUser {
  id: string;
  role: UserRole;
  name: string;
  department?: string;
  specialty?: string;
  badge?: string;
  demo_id?: string;
}

export const DEMO_USERS: Record<UserRole, ActiveUser> = {
  patient: {
    id: 'a1111111-1111-1111-1111-111111111111',
    role: 'patient',
    name: 'Aarav Sharma',
    badge: 'Patient (ABHA: 91-4829-1029-4821)',
    demo_id: 'DEMO-P001',
  },
  doctor: {
    id: 'usr-doc-01',
    role: 'doctor',
    name: 'Dr. Arvind Sen, MD DM',
    department: 'Cardiology & Internal Medicine',
    specialty: 'Cardiology',
    badge: 'Attending Cardiologist',
  },
  admin: {
    id: 'usr-adm-01',
    role: 'admin',
    name: 'Vikram Joshi',
    department: 'Hospital Operations & Triage Management',
    badge: 'Clinical Administrator',
  },
};

interface AuthContextType {
  currentUser: ActiveUser;
  setCurrentUser: (user: ActiveUser) => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: DEMO_USERS.patient,
  setCurrentUser: () => {},
  switchRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<ActiveUser>(DEMO_USERS.patient);

  useEffect(() => {
    const saved = localStorage.getItem('medikiosk_active_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'patient' || parsed.role === 'doctor' || parsed.role === 'admin')) {
          setCurrentUser(parsed);
        } else {
          setCurrentUser(DEMO_USERS.patient);
        }
      } catch (e) {
        console.error('Error loading saved active user:', e);
      }
    }
  }, []);

  const switchRole = (role: UserRole) => {
    const targetUser = DEMO_USERS[role] || DEMO_USERS.patient;
    setCurrentUser(targetUser);
    localStorage.setItem('medikiosk_active_user', JSON.stringify(targetUser));
  };

  const handleSetCurrentUser = (user: ActiveUser) => {
    setCurrentUser(user);
    localStorage.setItem('medikiosk_active_user', JSON.stringify(user));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
