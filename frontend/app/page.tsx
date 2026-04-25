"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import EstoqueMecanicaFrontend from "../src/components/EstoqueMecanicaFrontend";
import { useAuth } from "../src/contexts/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { user, profile, loading, profileLoading, signOut } = useAuth();

  useEffect(() => {
    if (loading || profileLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!profile) {
      return;
    }

    if (!profile.ativo) {
      signOut().then(() => router.replace("/login"));
      return;
    }

    if (profile.precisa_trocar_senha) {
      router.replace("/primeiro-acesso");
    }
  }, [user, profile, loading, profileLoading, router, signOut]);

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-sm text-zinc-600 shadow-sm">
          Carregando sistema...
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-950">Usuário sem vínculo no sistema</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Seu login existe, mas não há cadastro correspondente na tabela de usuários.
          </p>
        </div>
      </div>
    );
  }

  if (!profile.ativo || profile.precisa_trocar_senha) return null;

  return <EstoqueMecanicaFrontend />;
}