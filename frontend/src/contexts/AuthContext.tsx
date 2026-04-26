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
    return (error as ErrorWithResponse).response?.status ?? null;
  }

  return null;
}

function getResponseMessage(error: unknown) {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return null;
  }

  const response = (error as ErrorWithResponse).response;

  return response?.data?.error || response?.data?.message || null;
}

function normalizeAuthErrorMessage(error: unknown) {
  const status = getResponseStatus(error);
  const responseMessage = getResponseMessage(error);

  if (status === 401) {
    return "Sessão inválida ou expirada. Faça login novamente.";
  }

  if (status === 403) {
    return responseMessage || "Usuário sem permissão para acessar o sistema.";
  }

  if (status === 400 || status === 404) {
    return (
      responseMessage ||
      "Seu login existe, mas não há cadastro correspondente na tabela de usuários."
    );
  }

  if (responseMessage) {
    return responseMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível carregar os dados do usuário.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(
    async (authUser?: User | null, currentSession?: Session | null) => {
      setProfileLoading(true);

      try {
        if (!authUser || !currentSession?.access_token) {
          setProfile(null);
          return null;
        }

        const me = await getMe();
        setProfile(me);

        return me;
      } catch (error: unknown) {
        console.error("Erro ao carregar perfil do usuário via backend:", error);

        setProfile(null);

        throw error;
      } finally {
        setProfileLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      setLoading(true);
      setProfileLoading(true);

      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user && currentSession?.access_token) {
          try {
            await loadProfile(currentSession.user, currentSession);
          } catch {
            if (!mounted) return;
            setProfile(null);
          }
        } else {
          setProfile(null);
          setProfileLoading(false);
        }
      } catch (error: unknown) {
        console.error("Erro ao carregar sessão:", error);

        if (!mounted) return;

        setSession(null);
        setUser(null);
        setProfile(null);
        setProfileLoading(false);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      setLoading(true);

      try {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user && nextSession?.access_token) {
          try {
            await loadProfile(nextSession.user, nextSession);
          } catch {
            if (!mounted) return;
            setProfile(null);
          }
        } else {
          setProfile(null);
          setProfileLoading(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setProfileLoading(true);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          setSession(null);
          setUser(null);
          setProfile(null);

          return { error: error.message };
        }

        setSession(data.session ?? null);
        setUser(data.user ?? null);

        try {
          await loadProfile(data.user ?? null, data.session ?? null);
        } catch (profileError: unknown) {
          const message = normalizeAuthErrorMessage(profileError);

          await supabase.auth.signOut();

          setSession(null);
          setUser(null);
          setProfile(null);

          return { error: message };
        }

        return { error: null };
      } catch (error: unknown) {
        console.error("Erro ao fazer login:", error);

        setSession(null);
        setUser(null);
        setProfile(null);

        return {
          error: "Não foi possível fazer login. Verifique sua conexão e tente novamente.",
        };
      } finally {
        setLoading(false);
        setProfileLoading(false);
      }
    },
    [loadProfile]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    setProfileLoading(true);

    try {
      await supabase.auth.signOut();
    } finally {
      setProfile(null);
      setSession(null);
      setUser(null);
      setLoading(false);
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      await loadProfile(user, session);
    } catch (error: unknown) {
      console.error("Erro ao atualizar perfil:", error);
    }
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