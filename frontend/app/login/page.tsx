"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "../../src/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user, profile, loading, profileLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) return;

    if (!profile) {
      setErrorMessage(
        "Login realizado, mas não foi encontrado cadastro correspondente na tabela de usuários."
      );
      setSubmitting(false);
      return;
    }

    if (!profile.ativo) {
      setErrorMessage("Seu usuário está inativo. Entre em contato com o responsável pelo sistema.");
      setSubmitting(false);
      return;
    }

    if (profile.precisa_trocar_senha) {
      router.replace("/primeiro-acesso");
      return;
    }

    router.replace("/");
  }, [user, profile, loading, profileLoading, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitting) return;

    setErrorMessage("");
    setSubmitting(true);

    try {
      const result = await signIn(email, password);

      if (result.error) {
        const message = result.error.toLowerCase();

        if (message.includes("invalid login credentials")) {
          setErrorMessage("E-mail ou senha inválidos.");
        } else if (message.includes("email not confirmed")) {
          setErrorMessage("E-mail ainda não confirmado.");
        } else {
          setErrorMessage(result.error);
        }

        setSubmitting(false);
        return;
      }

      /*
        Não redireciona aqui.
        O useEffect acima vai decidir o destino correto depois que user/profile forem carregados.
      */
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setErrorMessage("Não foi possível fazer login. Verifique sua conexão e tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-3xl bg-zinc-950 p-4 text-white shadow-sm">
            <Wrench className="h-7 w-7" />
          </div>

          <h1 className="text-2xl font-bold text-zinc-950">Controle de Estoque</h1>

          <p className="mt-2 text-sm text-zinc-500">
            Entre com seu usuário para acessar o sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-800">E-mail</label>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@empresa.com"
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white pl-10 pr-3 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition focus:border-zinc-950"
                autoComplete="email"
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-800">Senha</label>

            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white pl-10 pr-3 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition focus:border-zinc-950"
                autoComplete="current-password"
                required
                disabled={submitting}
              />
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting || loading || profileLoading}
            className="h-11 w-full rounded-xl bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting || profileLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}