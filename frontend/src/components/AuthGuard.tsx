"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

type AuthGuardProps = {
  children: ReactNode;
};

type ProfileGraceState = {
  userId: string | null;
  finished: boolean;
};

function LoadingProfileScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-zinc-950">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>

        <h1 className="text-lg font-bold text-zinc-950">
          Carregando perfil
        </h1>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Estamos preparando seu acesso ao painel operacional.
        </p>
      </div>
    </div>
  );
}

function ProfileNotLoadedScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
      <div className="w-full max-w-sm rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <h1 className="text-lg font-bold text-zinc-950">
          Perfil não carregado
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Seu login existe, mas não foi possível carregar o cadastro correspondente na tabela de usuários.
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-5 h-11 rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const currentUserId = user?.id ?? null;

  const [profileGrace, setProfileGrace] = useState<ProfileGraceState>({
    userId: null,
    finished: false,
  });

  const profileGraceFinished = useMemo(() => {
    return profileGrace.userId === currentUserId && profileGrace.finished;
  }, [profileGrace, currentUserId]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!currentUserId || profile || loading) return;

    const timerId = window.setTimeout(() => {
      setProfileGrace({
        userId: currentUserId,
        finished: true,
      });
    }, 1800);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [currentUserId, profile, loading]);

  if (loading) {
    return <LoadingProfileScreen />;
  }

  if (!user) {
    return <LoadingProfileScreen />;
  }

  if (!profile && !profileGraceFinished) {
    return <LoadingProfileScreen />;
  }

  if (!profile && profileGraceFinished) {
    return <ProfileNotLoadedScreen onRetry={() => window.location.reload()} />;
  }

  return <>{children}</>;
}