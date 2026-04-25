"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { user, profile, loading, profileLoading } = useAuth();

  const [timeoutReached, setTimeoutReached] = useState(false);

  const isLoginPage = pathname === "/login";
  const isPrimeiroAcessoPage = pathname === "/primeiro-acesso";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTimeoutReached(true);
    }, 8000);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading || profileLoading) return;

    if (!user) {
      if (!isLoginPage) {
        router.replace("/login");
      }

      return;
    }

    if (!profile) {
      return;
    }

    if (!profile.ativo) {
      return;
    }

    if (profile.precisa_trocar_senha && !isPrimeiroAcessoPage) {
      router.replace("/primeiro-acesso");
      return;
    }

    if (!profile.precisa_trocar_senha && (isLoginPage || isPrimeiroAcessoPage)) {
      router.replace("/");
    }
  }, [
    user,
    profile,
    loading,
    profileLoading,
    isLoginPage,
    isPrimeiroAcessoPage,
    router,
  ]);

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-sm text-zinc-600 shadow-sm">
          {timeoutReached
            ? "Ainda carregando. Verifique as variáveis de ambiente e a conexão com o Supabase."
            : "Carregando sistema..."}
        </div>
      </div>
    );
  }

  if (!user) {
    if (isLoginPage) {
      return <>{children}</>;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-sm text-zinc-600 shadow-sm">
          Redirecionando para o login...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
        <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-zinc-950">
            Usuário sem vínculo no sistema
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Seu login existe no Supabase Auth, mas não há cadastro correspondente na tabela de
            usuários do sistema.
          </p>
        </div>
      </div>
    );
  }

  if (!profile.ativo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-zinc-950">Usuário inativo</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Seu usuário está inativo. Entre em contato com o administrador do sistema.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}