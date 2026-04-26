"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

type AuthGuardProps = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { user, profile, loading, profileLoading, profileError } = useAuth();

  useEffect(() => {
    if (loading || profileLoading) return;

    if (!user) {
      if (pathname !== "/login") {
        router.replace("/login");
      }

      return;
    }

    if (!profile) return;

    if (!profile.ativo) return;

    if (profile.precisa_trocar_senha && pathname !== "/primeiro-acesso") {
      router.replace("/primeiro-acesso");
      return;
    }

    if (!profile.precisa_trocar_senha && pathname === "/primeiro-acesso") {
      router.replace("/");
    }
  }, [user, profile, loading, profileLoading, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
        <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-600 shadow-sm">
          Carregando sistema...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (profileLoading && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
        <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-600 shadow-sm">
          Carregando perfil...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-white px-6 py-5 text-center shadow-sm">
          <h1 className="text-base font-bold text-zinc-950">
            Perfil não carregado
          </h1>

          <p className="mt-2 text-sm text-zinc-600">
            {profileError ||
              "Seu login existe, mas não foi possível carregar o cadastro correspondente na tabela de usuários."}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 h-10 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!profile.ativo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white px-6 py-5 text-center shadow-sm">
          <h1 className="text-base font-bold text-zinc-950">Usuário inativo</h1>

          <p className="mt-2 text-sm text-zinc-600">
            Entre em contato com o responsável pelo sistema.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}