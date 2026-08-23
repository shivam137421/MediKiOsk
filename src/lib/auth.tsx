'use client';

import React, { createContext, useContext, useState } from 'react';
import { UserRole } from '@/types/database';
import { DemoUserProfile } from '@/types/clinical';
import { DEMO_USERS } from '@/lib/supabase/mock-db';

interface AuthContextType {
  currentUser: DemoUserProfile;
  setCurrentUser: (user: DemoUserProfile) => void;
  switchRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<DemoUserProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('medikiosk_active_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return DEMO_USERS[0];
        }
      }
    }
    return DEMO_USERS[0]; // Default: Dr. Ananya Sen
  });

  const setCurrentUser = (user: DemoUserProfile) => {
    setCurrentUserState(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('medikiosk_active_user', JSON.stringify(user));
    }
  };

  const switchRole = (role: UserRole) => {
    const targetUser = DEMO_USERS.find((u) => u.role === role) || DEMO_USERS[0];
    setCurrentUser(targetUser);
  };

  const logout = () => {
    setCurrentUser(DEMO_USERS[4]); // Set to patient default
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        isAuthenticated: true,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
