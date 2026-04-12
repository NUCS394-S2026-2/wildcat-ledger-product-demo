import {
  ActionCodeSettings,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  User,
} from 'firebase/auth';
import React, { createContext, useEffect, useState } from 'react';

import { auth } from '../config/firebase';

export const EMAIL_KEY = 'wl_signin_email';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  sendLoginLink: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  const sendLoginLink = async (email: string) => {
    const actionCodeSettings: ActionCodeSettings = {
      url: window.location.origin + '/login',
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    localStorage.setItem(EMAIL_KEY, email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, sendLoginLink }}>
      {children}
    </AuthContext.Provider>
  );
};
