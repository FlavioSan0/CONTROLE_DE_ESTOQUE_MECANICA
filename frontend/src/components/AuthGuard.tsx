"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";

type AuthGuardProps = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();

  const [profileGraceFinished, setProfileGraceFinished] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    setProfileGraceFinished(false);

    if (!user || profile || loading) return;

    const timer = window.setTimeout(() => {
      setProfileGraceFinished(true);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [user, profile, loading]);

  if (loading || (user && !profile && !profileGraceFinished)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />

          <h1 className="text-lg font-bold text-zinc-950">
            Carregando perfil
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Estamos validando seus dados de acesso e carregando as permissões do sistema.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user && !profile && profileGraceFinished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
        <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
          <h1 className="text-lg font-bold text-zinc-950">
            Perfil não carregado
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Seu login existe, mas não foi possível carregar o cadastro correspondente na tabela de usuários.
          </p>

          <Button
            type="button"
            onClick={() => {
              setProfileGraceFinished(false);
              void refreshProfile?.();
            }}
            className="mt-5 rounded-2xl bg-zinc-950 px-5 font-semibold text-white hover:bg-zinc-800"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (profile && profile.ativo === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 text-center shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
          <h1 className="text-lg font-bold text-zinc-950">
            Usuário inativo
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Sua conta está inativa. Entre em contato com um administrador para liberar o acesso.
          </p>

          <Button
            type="button"
            onClick={() => router.replace("/login")}
            className="mt-5 rounded-2xl bg-zinc-950 px-5 font-semibold text-white hover:bg-zinc-800"
          >
            Voltar para o login
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}