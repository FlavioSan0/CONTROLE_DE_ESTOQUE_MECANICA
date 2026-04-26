"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  profileError: string;
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
  message?: string;
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

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const err = error as ErrorWithResponse;

    return (
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "Erro ao carregar perfil."
    );
  }

  return "Erro ao carregar perfil.";
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const mountedRef = useRef(false);
  const loadedProfileUserIdRef = useRef<string | null>(null);
  const profileRequestIdRef = useRef(0);

  const loadProfile = useCallback(
    async (
      authUser?: User | null,
      currentSession?: Session | null,
      options?: {
        force?: boolean;
      }
    ) => {
      const force = options?.force ?? false;

      if (!authUser || !currentSession?.access_token) {
        loadedProfileUserIdRef.current = null;
        setProfile(null);
        setProfileError("");
        setProfileLoading(false);
        return;
      }

      if (!force && loadedProfileUserIdRef.current === authUser.id && profile) {
        setProfileLoading(false);
        return;
      }

      const requestId = profileRequestIdRef.current + 1;
      profileRequestIdRef.current = requestId;

      try {
        setProfileLoading(true);
        setProfileError("");

        const me = await withTimeout(
          getMe(),
          12000,
          "Tempo excedido ao carregar perfil. Verifique se o backend está online."
        );

        if (profileRequestIdRef.current !== requestId) return;

        setProfile(me);
        loadedProfileUserIdRef.current = authUser.id;
        setProfileError("");
      } catch (error: unknown) {
        if (profileRequestIdRef.current !== requestId) return;

        console.error("Erro ao carregar perfil:", error);

        const status = getResponseStatus(error);
        const message = getErrorMessage(error);

        loadedProfileUserIdRef.current = null;
        setProfile(null);

        if (status === 401) {
          setProfileError("Sessão expirada. Faça login novamente.");
        } else if (status === 403) {
          setProfileError("Usuário sem permissão ou inativo.");
        } else if (status === 404) {
          setProfileError("Usuário não vinculado à tabela de usuários.");
        } else {
          setProfileError(message);
        }
      } finally {
        if (profileRequestIdRef.current === requestId) {
          setProfileLoading(false);
        }
      }
    },
    [profile]
  );

  useEffect(() => {
    if (mountedRef.current) return;

    mountedRef.current = true;

    let active = true;

    async function loadInitialSession() {
      try {
        setLoading(true);
        setProfileLoading(false);

        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (!active) return;

        if (error) {
          console.error("Erro ao buscar sessão:", error);

          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          setProfileLoading(false);
          setProfileError("Erro ao buscar sessão.");
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        if (currentSession?.user && currentSession?.access_token) {
          await loadProfile(currentSession.user, currentSession, {
            force: true,
          });
        } else {
          setProfile(null);
          setProfileError("");
          setProfileLoading(false);
        }
      } catch (error) {
        console.error("Erro ao carregar sessão inicial:", error);

        if (!active) return;

        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        setProfileLoading(false);
        setProfileError("Erro ao carregar sessão inicial.");
      }
    }

    loadInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;

      console.log("Auth event:", event);

      if (event === "SIGNED_OUT") {
        profileRequestIdRef.current += 1;
        loadedProfileUserIdRef.current = null;

        setSession(null);
        setUser(null);
        setProfile(null);
        setProfileError("");
        setLoading(false);
        setProfileLoading(false);
        return;
      }

      if (event === "SIGNED_IN") {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setLoading(false);

        if (nextSession?.user && nextSession?.access_token) {
          void loadProfile(nextSession.user, nextSession, {
            force: true,
          });
        }

        return;
      }

      /**
       * IMPORTANTE:
       * Esses eventos podem acontecer quando troca de aba, recarrega token,
       * volta o foco do navegador etc.
       * Não vamos buscar perfil novamente aqui para evitar loop de carregamento.
       */
      if (
        event === "INITIAL_SESSION" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setLoading(false);
        setProfileLoading(false);
        return;
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(false);
      setProfileLoading(true);
      setProfileError("");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setProfileLoading(false);
        return { error: error.message };
      }

      setSession(data.session ?? null);
      setUser(data.user ?? null);

      await loadProfile(data.user ?? null, data.session ?? null, {
        force: true,
      });

      return { error: null };
    },
    [loadProfile]
  );

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Erro ao sair. Limpando sessão local mesmo assim:", error);
    } finally {
      profileRequestIdRef.current += 1;
      loadedProfileUserIdRef.current = null;

      setSession(null);
      setUser(null);
      setProfile(null);
      setProfileError("");
      setLoading(false);
      setProfileLoading(false);

      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(user, session, {
      force: true,
    });
  }, [loadProfile, user, session]);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      profileLoading,
      profileError,
      signIn,
      signOut,
      refreshProfile,
    }),
    [
      user,
      session,
      profile,
      loading,
      profileLoading,
      profileError,
      signIn,
      signOut,
      refreshProfile,
    ]
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