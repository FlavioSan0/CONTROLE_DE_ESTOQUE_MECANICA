"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/contexts/AuthContext";
import { api } from "../../src/lib/api";

export default function PrimeiroAcessoPage() {
  const router = useRouter();

  const {
    user,
    profile,
    loading,
    profileLoading,
    signOut,
    refreshProfile,
  } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const accessErrorMessage = useMemo(() => {
    if (loading || profileLoading) return "";
    if (!user) return "";
    if (!profile) return "Seu usuário não está vinculado ao sistema.";
    if (!profile.ativo) return "Seu usuário está inativo.";

    return "";
  }, [loading, profileLoading, user, profile]);

  const visibleErrorMessage = errorMessage || accessErrorMessage;

  useEffect(() => {
    if (loading || profileLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!profile) return;
    if (!profile.ativo) return;

    if (!profile.precisa_trocar_senha) {
      router.replace("/");
    }
  }, [user, profile, loading, profileLoading, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitting) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (password.trim().length < 6) {
      setErrorMessage("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não conferem.");
      return;
    }

    setSubmitting(true);

    try {
      const { error: updatePasswordError } = await supabase.auth.updateUser({
        password,
      });

      if (updatePasswordError) {
        setErrorMessage(updatePasswordError.message);
        return;
      }

      await api.patch("/usuarios/finalizar-primeiro-acesso");

      await refreshProfile();

      setSuccessMessage("Senha alterada com sucesso.");

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Erro ao finalizar primeiro acesso:", error);

      setErrorMessage(
        "Não foi possível finalizar o primeiro acesso. Verifique sua conexão e tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-3xl bg-zinc-950 p-4 text-white shadow-sm">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <h1 className="text-2xl font-bold text-zinc-950">Primeiro acesso</h1>

          <p className="mt-2 text-sm text-zinc-500">
            Defina uma nova senha para continuar usando o sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-800">
              Nova senha
            </label>

            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white pl-10 pr-3 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition focus:border-zinc-950"
                autoComplete="new-password"
                required
                disabled={submitting || Boolean(accessErrorMessage)}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-800">
              Confirmar nova senha
            </label>

            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white pl-10 pr-3 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition focus:border-zinc-950"
                autoComplete="new-password"
                required
                disabled={submitting || Boolean(accessErrorMessage)}
              />
            </div>
          </div>

          {visibleErrorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {visibleErrorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={
                submitting ||
                loading ||
                profileLoading ||
                Boolean(accessErrorMessage)
              }
              className="h-11 w-full rounded-xl bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Salvando..." : "Salvar nova senha"}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={submitting}
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Sair
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}