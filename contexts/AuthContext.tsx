import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    nodeType: string
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, nodeType: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const sanitizedFullName = fullName.trim();
    const sanitizedNodeType = nodeType.trim();

    if (!normalizedEmail || !password || !sanitizedFullName || !sanitizedNodeType) {
      return {
        error: {
          message: 'All signup fields are required.',
        },
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: sanitizedFullName,
          node_type: sanitizedNodeType,
        },
      },
    });

    if (error || !data.user) {
      return { error };
    }

    const isEmailConfirmationFlow = !data.session;

    try {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          user_id: data.user.id,
          email: normalizedEmail,
          full_name: sanitizedFullName,
          node_type: sanitizedNodeType,
        },
        {
          onConflict: 'user_id',
        }
      );

      if (profileError) {
        if (!isEmailConfirmationFlow) {
          await supabase.auth.signOut();
        }

        return {
          error: {
            ...profileError,
            message:
              'Signup succeeded but profile creation failed. The session was cleared to prevent an incomplete onboarding state. Please try again or contact support.',
          },
        };
      }

      return { error: null };
    } catch (profileInsertFailure: any) {
      if (!isEmailConfirmationFlow) {
        await supabase.auth.signOut();
      }

      return {
        error: {
          message:
            profileInsertFailure?.message ||
            'Signup could not be completed because profile setup failed. The session was cleared to avoid a broken account state.',
        },
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
