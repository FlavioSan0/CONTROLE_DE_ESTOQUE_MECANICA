"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { getMe } from "../services/users.service";

export type UserProfile = {
  id: string;
  auth_user_id?: string | null;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
  precisa_trocar_senha: boolean;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

type ErrorWithResponse = {
  response?: {
    status?: number;
    data?: {
      error?: string;
      message?: string;
    };
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getResponseStatus(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as ErrorWithResponse).response?.status === "number"
  ) {
    return (error as ErrorWithResponse).response?.status;
  }

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = useCallback(
    async (authUser?: User | null, currentSession?: Session | null) => {
      if (!authUser || !currentSession?.access_token) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);

        const me = await getMe();
        setProfile(me);
      } catch (error: unknown) {
        console.error("Erro ao carregar perfil do usuário via backend:", error);

        const status = getResponseStatus(error);

        if (status === 401) {
          setProfile(null);
        } else {
          setProfile(null);
        }
      } finally {
        setProfileLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        await loadProfile(session?.user ?? null, session ?? null);
      } catch (error: unknown) {
        console.error("Erro ao carregar sessão:", error);

        if (!mounted) return;

        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        setProfileLoading(false);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      await loadProfile(nextSession?.user ?? null, nextSession ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();

    setProfile(null);
    setSession(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(user, session);
  }, [loadProfile, user, session]);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      profileLoading,
      signIn,
      signOut,
      refreshProfile,
    }),
    [user, session, profile, loading, profileLoading, signIn, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}