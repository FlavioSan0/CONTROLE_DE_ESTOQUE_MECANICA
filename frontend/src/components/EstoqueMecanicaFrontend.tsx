"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearAdminData,
  type ClearTarget,
} from "../services/admin-maintenance.service";


import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
  type Customer,
} from "../services/customers.service";

import {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  updateSupplier,
} from "../services/suppliers.service";

import {
  exportCsv,
  formatCurrencyForCsv,
  formatDateTimeForCsv,
  todayFileDate,
} from "../utils/exportCsv";

import ProductDetailsModal from "./ProductDetailsModal";
import { getProductDetails } from "../services/product-details.service";
import type { ProdutoDetalhes } from "../types/product-details";

import { getUsers, createUser, updateUser } from "../services/users.service";
import { useAuth } from "../contexts/AuthContext";

import type {
  CreateProductPayload,
  CreateUserPayload,
  DashboardData,
  Movimentacao,
  ProductCreateOptions,
  Produto,
  ProdutoDetalhe,
  UpdateUserPayload,
  UsuarioSistema,
} from "../types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Wrench,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardList,
  BarChart3,
  Users,
  Search,
  TriangleAlert,
  Menu,
  LogOut,
  Plus,
  Filter,
  Warehouse,
  LockKeyhole,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ArrowUpAZ,
  ArrowDownAZ,
  UserCircle2,
  Mail,
  BadgeCheck,
  MapPin,
  ChevronDown,
  UsersRound,
  IdCard,
} from "lucide-react";

import {
  createProduct,
  getProductById,
  getProductCreateOptions,
  getProducts,
  inactivateProduct,
  updateProduct,
} from "../services/products.service";

import { getDashboard } from "../services/dashboard.service";

import {
  createEntryWithInvoice,
  createExit,
  getEntryFormOptions,
  getExitFormOptions,
  getFilterOptions,
  getMovements,
} from "../services/movements.service";


type PageKey =
  | "dashboard"
  | "produtos"
  | "entradas"
  | "saidas"
  | "movimentacoes"
  | "usuario"
  | "usuarios"
  | "fornecedores"
  | "clientes"
  | "relatorios";

type NavItem = {
  key: PageKey;
  label: string;
  icon: React.ElementType;
};

type ProductSortKey =
  | "codigo"
  | "nome"
  | "categoria"
  | "fornecedor"
  | "estoqueAtual"
  | "preco";

type SortDirection = "asc" | "desc";

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "produtos", label: "Produtos", icon: Package },
  { key: "entradas", label: "Entradas", icon: ArrowDownCircle },
  { key: "saidas", label: "Saídas", icon: ArrowUpCircle },
  { key: "movimentacoes", label: "Movimentações", icon: ClipboardList },
  { key: "clientes", label: "Clientes", icon: UsersRound },
  { key: "fornecedores", label: "Fornecedores", icon: Warehouse },
  { key: "usuarios", label: "Usuários", icon: Users },
  { key: "relatorios", label: "Relatórios", icon: Wrench },
];

function UsersPage() {
  const { profile } = useAuth();

  type UserForm = {
    nome: string;
    email: string;
    perfil: string;
    ativo: boolean;
    senha_temporaria: string;
    nova_senha_temporaria: string;
    precisa_trocar_senha: boolean;
  };

  const FIELD_LIMITS = {
    busca: 120,
    nome: 120,
    email: 160,
    senha: 50,
  } as const;

  const FIELD_PLACEHOLDERS = {
    buscaUsuario: "Buscar por nome, e-mail ou perfil",
    nomeUsuario: "Ex: João da Silva",
    emailUsuario: "Ex: usuario@empresa.com",
    senhaTemporaria: "Digite a senha temporária",
    novaSenhaTemporaria: "Digite a nova senha temporária",
  } as const;

  function normalizeTextInput(value: string, maxLength: number) {
    return value.slice(0, maxLength);
  }

  function normalizeLowercaseInput(value: string, maxLength: number) {
    return value.toLowerCase().slice(0, maxLength);
  }

  function premiumCardClass(extra?: string) {
    return cn(
      "rounded-3xl border border-zinc-200/80 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]",
      extra
    );
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioSistema | null>(null);
  const [targetUser, setTargetUser] = useState<UsuarioSistema | null>(null);
  const [users, setUsers] = useState<UsuarioSistema[]>([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState<UserForm>({
    nome: "",
    email: "",
    perfil: "usuario",
    ativo: true,
    senha_temporaria: "",
    nova_senha_temporaria: "",
    precisa_trocar_senha: true,
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const data = await getUsers();
      setUsers(data);
    } catch (error: unknown) {
      console.error("Erro ao carregar usuários:", error);

      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error ===
          "string"
          ? (error as { response?: { data?: { error?: string } } }).response!.data!.error!
          : "Não foi possível carregar os usuários.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await loadUsers();
    };

    run();
  }, [loadUsers]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return users;

    return users.filter((item) => {
      return (
        item.nome.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        item.perfil.toLowerCase().includes(term)
      );
    });
  }, [users, search]);

  function resetForm() {
    setForm({
      nome: "",
      email: "",
      perfil: "usuario",
      ativo: true,
      senha_temporaria: "",
      nova_senha_temporaria: "",
      precisa_trocar_senha: true,
    });
    setEditingUser(null);
  }

  function openCreateDialog() {
    resetForm();
    setDialogOpen(true);
  }

  function openEditDialog(user: UsuarioSistema) {
    setEditingUser(user);
    setForm({
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      ativo: user.ativo,
      senha_temporaria: "",
      nova_senha_temporaria: "",
      precisa_trocar_senha: user.precisa_trocar_senha,
    });
    setDialogOpen(true);
  }

  function openToggleDialog(user: UsuarioSistema) {
    setTargetUser(user);
    setConfirmToggleOpen(true);
  }

  function closeDialogs() {
    setDialogOpen(false);
    setConfirmToggleOpen(false);
    setTargetUser(null);
    resetForm();
  }

  async function handleSubmit() {
    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (!form.nome.trim()) {
        setErrorMessage("Informe o nome do usuário.");
        return;
      }

      if (!form.email.trim() && !editingUser) {
        setErrorMessage("Informe o e-mail do usuário.");
        return;
      }

      if (!form.perfil.trim()) {
        setErrorMessage("Selecione o perfil do usuário.");
        return;
      }

      if (!editingUser && form.senha_temporaria.trim().length < 6) {
        setErrorMessage("A senha temporária deve ter pelo menos 6 caracteres.");
        return;
      }

      if (
        editingUser &&
        form.nova_senha_temporaria &&
        form.nova_senha_temporaria.trim().length < 6
      ) {
        setErrorMessage("A nova senha temporária deve ter pelo menos 6 caracteres.");
        return;
      }

      if (!editingUser) {
        const payload: CreateUserPayload = {
          nome: form.nome.trim(),
          email: form.email.trim().toLowerCase(),
          perfil: form.perfil.trim(),
          senha_temporaria: form.senha_temporaria.trim(),
          ativo: form.ativo,
        };

        await createUser(payload);
        setSuccessMessage("Usuário criado com sucesso.");
      } else {
        const payload: UpdateUserPayload = {
          nome: form.nome.trim(),
          perfil: form.perfil.trim(),
          ativo: form.ativo,
          precisa_trocar_senha: form.precisa_trocar_senha,
          nova_senha_temporaria: form.nova_senha_temporaria.trim() || undefined,
        };

        await updateUser(editingUser.id, payload);
        setSuccessMessage("Usuário atualizado com sucesso.");
      }

      closeDialogs();
      await loadUsers();
    } catch (error: unknown) {
      console.error("Erro ao salvar usuário:", error);

      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error ===
          "string"
          ? (error as { response?: { data?: { error?: string } } }).response!.data!.error!
          : "Não foi possível salvar o usuário.";

      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmToggleActive() {
    if (!targetUser) return;

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      await updateUser(targetUser.id, {
        ativo: !targetUser.ativo,
      });

      setSuccessMessage(
        targetUser.ativo ? "Usuário inativado com sucesso." : "Usuário ativado com sucesso."
      );

      setConfirmToggleOpen(false);
      setTargetUser(null);
      await loadUsers();
    } catch (error: unknown) {
      console.error("Erro ao alterar status do usuário:", error);

      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error ===
          "string"
          ? (error as { response?: { data?: { error?: string } } }).response!.data!.error!
          : "Não foi possível alterar o status do usuário.";

      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }

  if (profile?.perfil !== "admin") {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Card className={premiumCardClass()}>
          <CardHeader>
            <CardTitle className="text-zinc-950">Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
              Apenas usuários admin podem acessar esta área.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total de usuários"
          value={users.length}
          subtitle="Usuários cadastrados no sistema"
          icon={Users}
        />
        <StatCard
          title="Usuários ativos"
          value={users.filter((item) => item.ativo).length}
          subtitle="Podem acessar o sistema"
          icon={ShieldCheck}
        />
        <StatCard
          title="Troca de senha pendente"
          value={users.filter((item) => item.precisa_trocar_senha).length}
          subtitle="Primeiro acesso obrigatório"
          icon={LockKeyhole}
        />
      </div>

      <Card className={premiumCardClass("overflow-hidden")}>
        <CardHeader className="border-b border-zinc-100 bg-gradient-to-r from-white via-zinc-50/60 to-white pb-4">
          <CardTitle className="text-zinc-950">Gerenciar usuários</CardTitle>
          <p className="text-sm text-zinc-500">
            Controle de acesso, perfis e primeiro login do sistema.
          </p>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="rounded-3xl border border-zinc-200/80 bg-zinc-50/70 p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={search}
                  maxLength={FIELD_LIMITS.busca}
                  onChange={(e) =>
                    setSearch(normalizeTextInput(e.target.value, FIELD_LIMITS.busca))
                  }
                  placeholder={FIELD_PLACEHOLDERS.buscaUsuario}
                  className="border-zinc-300 bg-white pl-9 xl:max-w-md"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100"
                  onClick={() => setSearch("")}
                >
                  Limpar busca
                </Button>

                <Button
                  className="rounded-2xl bg-zinc-950 font-semibold text-white shadow-sm hover:bg-zinc-800"
                  onClick={openCreateDialog}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo usuário
                </Button>
              </div>
            </div>
          </div>

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className={premiumCardClass("overflow-hidden")}>
        <CardHeader className="border-b border-zinc-100 bg-gradient-to-r from-white via-zinc-50/60 to-white pb-4">
          <CardTitle className="text-zinc-950">Usuários cadastrados</CardTitle>
        </CardHeader>

        <CardContent className="p-6 overflow-x-auto">
          {loading ? (
            <p className="text-sm text-zinc-500">Carregando usuários...</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-200 bg-zinc-50/80 hover:bg-zinc-50/80">
                    <TableHead className="text-zinc-600">Nome</TableHead>
                    <TableHead className="text-zinc-600">E-mail</TableHead>
                    <TableHead className="text-zinc-600">Perfil</TableHead>
                    <TableHead className="text-zinc-600">Status</TableHead>
                    <TableHead className="text-zinc-600">Primeiro acesso</TableHead>
                    <TableHead className="text-right text-zinc-600">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredUsers.map((item) => (
                    <TableRow key={item.id} className="border-zinc-100 hover:bg-zinc-50">
                      <TableCell className="font-medium text-zinc-900">{item.nome}</TableCell>
                      <TableCell className="text-zinc-700">{item.email}</TableCell>
                      <TableCell>
                        <Badge className="border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-50">
                          {item.perfil}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.ativo ? (
                          <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.precisa_trocar_senha ? (
                          <Badge className="border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
                            Pendente
                          </Badge>
                        ) : (
                          <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                            Ok
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100"
                            onClick={() => openEditDialog(item)}
                          >
                            Editar
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100"
                            onClick={() => openToggleDialog(item)}
                          >
                            {item.ativo ? "Inativar" : "Ativar"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredUsers.length === 0 ? (
                <div className="py-10 text-center text-sm text-zinc-500">
                  Nenhum usuário encontrado.
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(value) => {
          setDialogOpen(value);
          if (!value) closeDialogs();
        }}
      >
        <DialogContent className="w-[95vw] max-w-lg rounded-3xl border-zinc-200 bg-white p-0 overflow-hidden">
          <DialogHeader className="border-b border-zinc-200 px-6 py-4">
            <DialogTitle className="text-zinc-950">
              {editingUser ? "Editar usuário" : "Novo usuário"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                maxLength={FIELD_LIMITS.nome}
                placeholder={FIELD_PLACEHOLDERS.nomeUsuario}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    nome: normalizeTextInput(e.target.value, FIELD_LIMITS.nome),
                  }))
                }
                className="border-zinc-300 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                value={form.email}
                maxLength={FIELD_LIMITS.email}
                placeholder={FIELD_PLACEHOLDERS.emailUsuario}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    email: normalizeLowercaseInput(e.target.value, FIELD_LIMITS.email),
                  }))
                }
                className="border-zinc-300 bg-white"
                disabled={Boolean(editingUser)}
              />
            </div>

            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select
                value={form.perfil}
                onValueChange={(value) => setForm((prev) => ({ ...prev, perfil: value }))}
              >
                <SelectTrigger className="border-zinc-300 bg-white">
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usuario">usuario</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!editingUser ? (
              <div className="space-y-2">
                <Label>Senha temporária</Label>
                <Input
                  type="password"
                  value={form.senha_temporaria}
                  maxLength={FIELD_LIMITS.senha}
                  placeholder={FIELD_PLACEHOLDERS.senhaTemporaria}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      senha_temporaria: normalizeTextInput(
                        e.target.value,
                        FIELD_LIMITS.senha
                      ),
                    }))
                  }
                  className="border-zinc-300 bg-white"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Nova senha temporária</Label>
                <Input
                  type="password"
                  value={form.nova_senha_temporaria}
                  maxLength={FIELD_LIMITS.senha}
                  placeholder={FIELD_PLACEHOLDERS.novaSenhaTemporaria}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      nova_senha_temporaria: normalizeTextInput(
                        e.target.value,
                        FIELD_LIMITS.senha
                      ),
                    }))
                  }
                  className="border-zinc-300 bg-white"
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-2xl border border-zinc-200 px-3 py-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm((prev) => ({ ...prev, ativo: e.target.checked }))}
                />
                Usuário ativo
              </label>

              <label className="flex items-center gap-2 rounded-2xl border border-zinc-200 px-3 py-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={form.precisa_trocar_senha}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      precisa_trocar_senha: e.target.checked,
                    }))
                  }
                />
                Exigir troca de senha
              </label>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 border-t border-zinc-200 px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="w-full rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100 sm:w-auto"
              onClick={closeDialogs}
            >
              Cancelar
            </Button>

            <Button
              className="w-full rounded-2xl bg-zinc-950 font-semibold text-white hover:bg-zinc-800 sm:w-auto"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Salvando..." : editingUser ? "Salvar alterações" : "Criar usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmToggleOpen}
        onOpenChange={(value) => {
          setConfirmToggleOpen(value);
          if (!value) setTargetUser(null);
        }}
      >
        <DialogContent className="w-[95vw] max-w-md rounded-3xl border-zinc-200 bg-white p-0 overflow-hidden">
          <DialogHeader className="border-b border-zinc-200 px-6 py-4">
            <DialogTitle className="text-zinc-950">
              {targetUser?.ativo ? "Confirmar inativação" : "Confirmar ativação"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
              <p>
                {targetUser?.ativo
                  ? "Tem certeza que deseja inativar este usuário?"
                  : "Tem certeza que deseja ativar este usuário?"}
              </p>

              <div className="mt-3 space-y-2">
                <p>
                  <span className="font-semibold">Nome:</span> {targetUser?.nome ?? "-"}
                </p>
                <p>
                  <span className="font-semibold">E-mail:</span> {targetUser?.email ?? "-"}
                </p>
                <p>
                  <span className="font-semibold">Perfil:</span> {targetUser?.perfil ?? "-"}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 border-t border-zinc-200 px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="w-full rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100 sm:w-auto"
              onClick={() => {
                setConfirmToggleOpen(false);
                setTargetUser(null);
              }}
            >
              Cancelar
            </Button>

            <Button
              className={cn(
                "w-full rounded-2xl font-semibold text-white sm:w-auto",
                targetUser?.ativo
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              )}
              onClick={confirmToggleActive}
              disabled={saving}
            >
              {saving
                ? "Salvando..."
                : targetUser?.ativo
                ? "Confirmar inativação"
                : "Confirmar ativação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const FIELD_LIMITS = {
  nome: 120,
  nomeFantasia: 120,
  email: 160,
  perfil: 20,
  senhaTemporaria: 60,
  busca: 120,
  codigo: 30,
  sku: 40,
  ncm: 20,
  marca: 60,
  descricaoCurta: 255,
  descricaoLonga: 500,
  observacoes: 500,
  cidade: 80,
  estado: 2,
  cnpj: 18,
  telefone: 20,
  whatsapp: 20,
  contatoResponsavel: 100,
  numeroNotaFiscal: 40,
  documentoReferencia: 60,
} as const;

const FIELD_PLACEHOLDERS = {
  nomeUsuario: "Ex: Flávio Santos",
  emailUsuario: "Ex: flavio@email.com",
  senhaTemporaria: "Mínimo de 6 caracteres",
  novaSenhaTemporaria: "Preencha apenas se quiser redefinir",
  buscaUsuario: "Buscar por nome, e-mail ou perfil",

  codigoProduto: "Ex: P-0001",
  nomeProduto: "Ex: Óleo 5W30 Sintético",
  descricaoProduto: "Descreva o item, aplicação ou observações relevantes",
  marcaProduto: "Ex: Mobil",
  skuProduto: "Ex: SKU-000123",
  ncmProduto: "Ex: 27101932",

  buscaProduto: "Digite código ou nome do produto",
  numeroNotaFiscal: "Ex: 12345",
  observacaoEntrada: "Ex: Compra de reposição do fornecedor",
  observacaoSaida: "Ex: Uso interno / ajuste / perda",

  buscaMovimentacao: "Buscar por produto, tipo, usuário ou observação",

  nomeFornecedor: "Ex: Auto Peças RN",
  nomeFantasiaFornecedor: "Ex: Auto Peças RN Distribuição",
  cnpjFornecedor: "Ex: 12.345.678/0001-90",
  emailFornecedor: "Ex: contato@empresa.com",
  telefoneFornecedor: "Ex: (84) 99999-0001",
  whatsappFornecedor: "Ex: (84) 99999-0001",
  contatoResponsavelFornecedor: "Ex: João Silva",
  cidadeFornecedor: "Ex: Natal",
  estadoFornecedor: "Ex: RN",
  observacoesFornecedor: "Informações comerciais, prazos, observações ou condições especiais",
  buscaFornecedor: "Buscar por nome, cidade, contato, CNPJ ou e-mail",
} as const;

function normalizeTextInput(value: string, maxLength: number) {
  return value.slice(0, maxLength);
}

function normalizeUppercaseInput(value: string, maxLength: number) {
  return value.toUpperCase().slice(0, maxLength);
}


function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-500">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">{value}</p>
            <p className="mt-2 text-xs text-zinc-500">{subtitle}</p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-3 shadow-sm">
            <Icon className="h-5 w-5 text-amber-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Sidebar({
  page,
  setPage,
  isAdmin,
}: {
  page: PageKey;
  setPage: (page: PageKey) => void;
  isAdmin: boolean;
}) {
  const visibleNavItems = navItems.filter((item) => {
    if (item.key === "usuarios" && !isAdmin) return false;
    return true;
  });

  return (
    <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-zinc-200/80 bg-white/95 backdrop-blur lg:flex xl:w-76">
      <div className="border-b border-zinc-200/80 bg-gradient-to-r from-white via-zinc-50/70 to-white p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-3xl bg-zinc-950 p-3 text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)]">
            <Wrench className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-950">
              Estoque Mecânica
            </h1>
            <p className="text-sm text-zinc-500">Painel operacional</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;

            return (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all",
                  active
                    ? "bg-zinc-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
                    : "text-zinc-700 hover:bg-zinc-100/90 hover:text-zinc-950"
                )}
              >
                <div
                  className={cn(
                    "rounded-xl p-2 transition",
                    active
                      ? "bg-white/10"
                      : "bg-zinc-100 text-zinc-600 group-hover:bg-white group-hover:text-zinc-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}

function MobileSidebar({
  page,
  setPage,
  isAdmin,
}: {
  page: PageKey;
  setPage: (page: PageKey) => void;
  isAdmin: boolean;
}) {
  const visibleNavItems = navItems.filter((item) => {
    if (item.key === "usuarios" && !isAdmin) return false;
    return true;
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-2xl border-zinc-300 bg-white text-zinc-800 shadow-sm hover:bg-zinc-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-76 border-zinc-200 bg-white p-0">
        <div className="border-b border-zinc-200/80 bg-gradient-to-r from-white via-zinc-50/70 to-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-3xl bg-zinc-950 p-3 text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)]">
              <Wrench className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-950">
                Estoque Mecânica
              </h1>
              <p className="text-sm text-zinc-500">Painel operacional premium</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <nav className="space-y-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active = page === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => setPage(item.key)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all",
                    active
                      ? "bg-zinc-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
                      : "text-zinc-700 hover:bg-zinc-100/90 hover:text-zinc-950"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-xl p-2 transition",
                      active
                        ? "bg-white/10"
                        : "bg-zinc-100 text-zinc-600 group-hover:bg-white group-hover:text-zinc-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AppHeader({
  title,
  subtitle,
  page,
  setPage,
  isAdmin,
}: {
  title: string;
  subtitle: string;
  page: PageKey;
  setPage: (page: PageKey) => void;
  isAdmin: boolean;
}) {
  return (
    <div className="border-b border-zinc-200/80 bg-white/95 backdrop-blur">
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <MobileSidebar page={page} setPage={setPage} isAdmin={isAdmin} />

            <div className="min-w-0">
              <h2 className="truncate text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                {title}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Button
              variant="outline"
              onClick={() => setPage("usuario")}
              className={cn(
                "h-11 rounded-2xl border bg-white px-3 font-medium shadow-sm transition",
                page === "usuario"
                  ? "border-zinc-950 text-zinc-950"
                  : "border-zinc-300 text-zinc-800 hover:bg-zinc-100"
              )}
            >
              <div className="mr-3 rounded-xl border border-zinc-200 bg-zinc-50 p-1.5">
                <UserCircle2 className="h-4 w-4" />
              </div>

              <div className="flex flex-col items-start leading-none">
                <span className="text-xs text-zinc-500">Conta</span>
                <span className="mt-1 text-sm font-semibold text-zinc-900">Usuário</span>
              </div>

              <ChevronDown className="ml-3 h-4 w-4 text-zinc-500" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserPage({
  onLogout,
}: {
  onLogout: () => Promise<void>;
}) {
  const { user, profile } = useAuth();

  function premiumCardClass(extra?: string) {
    return cn(
      "rounded-3xl border border-zinc-200/80 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]",
      extra
    );
  }

  const nomeUsuario = profile?.nome || "Usuário do sistema";
  const emailUsuario = user?.email || "-";
  const perfilUsuario = profile?.perfil || "usuario";
  const statusUsuario = profile?.ativo ? "Ativo" : "Inativo";
  const trocaSenhaPendente = Boolean(profile?.precisa_trocar_senha);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Nome do usuário"
          value={nomeUsuario}
          subtitle="Cadastro vinculado ao acesso atual"
          icon={UserCircle2}
        />
        <StatCard
          title="Perfil"
          value={perfilUsuario}
          subtitle="Nível de acesso no sistema"
          icon={BadgeCheck}
        />
        <StatCard
          title="Status"
          value={statusUsuario}
          subtitle="Situação atual da conta"
          icon={ShieldCheck}
        />
      </div>

      <Card className={premiumCardClass("overflow-hidden")}>
        <CardHeader className="border-b border-zinc-100 bg-gradient-to-r from-white via-zinc-50/60 to-white pb-4">
          <div>
            <CardTitle className="text-zinc-950">Meu usuário</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">
              Informações da conta atualmente autenticada no sistema.
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-white to-zinc-50/60 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="flex items-start gap-4">
                  <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
                    <UserCircle2 className="h-8 w-8 text-amber-600" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold text-zinc-950">{nomeUsuario}</h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      Conta utilizada para acessar o painel operacional
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge className="border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-50">
                        {perfilUsuario}
                      </Badge>

                      {profile?.ativo ? (
                        <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
                          Inativo
                        </Badge>
                      )}

                      {trocaSenhaPendente ? (
                        <Badge className="border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
                          Troca de senha pendente
                        </Badge>
                      ) : (
                        <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                          Senha regular
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <h3 className="text-lg font-semibold text-zinc-950">Informações da conta</h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Mail className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-[0.18em]">
                        E-mail
                      </span>
                    </div>
                    <p className="mt-3 break-all text-sm font-medium text-zinc-900">
                      {emailUsuario}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <BadgeCheck className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-[0.18em]">
                        Perfil
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium capitalize text-zinc-900">
                      {perfilUsuario}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <h3 className="text-lg font-semibold text-zinc-950">Segurança da conta</h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div
                    className={cn(
                      "rounded-2xl border px-4 py-4",
                      trocaSenhaPendente
                        ? "border-amber-200 bg-amber-50"
                        : "border-emerald-200 bg-emerald-50"
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs uppercase tracking-[0.18em]",
                        trocaSenhaPendente ? "text-amber-700" : "text-emerald-700"
                      )}
                    >
                      Situação da senha
                    </p>
                    <p
                      className={cn(
                        "mt-3 text-sm font-semibold",
                        trocaSenhaPendente ? "text-amber-800" : "text-emerald-800"
                      )}
                    >
                      {trocaSenhaPendente
                        ? "Troca obrigatória pendente"
                        : "Senha em situação regular"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      Acesso ao sistema
                    </p>
                    <p className="mt-3 text-sm font-semibold text-zinc-900">
                      {profile?.ativo ? "Liberado" : "Bloqueado"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                  <p className="text-sm text-zinc-700">
                    Para reforçar a segurança, mantenha sua senha atualizada e evite compartilhar
                    suas credenciais de acesso.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-zinc-950 to-zinc-800 p-5 text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)]">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-300">
                  Resumo rápido
                </p>
                <h3 className="mt-3 text-xl font-semibold">Conta em operação</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Esta área centraliza as principais informações da conta usada no painel.
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <h3 className="text-lg font-semibold text-zinc-950">Acesso</h3>

                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Status</p>
                    <p className="mt-2 text-sm font-medium text-zinc-900">{statusUsuario}</p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      Troca de senha
                    </p>
                    <p className="mt-2 text-sm font-medium text-zinc-900">
                      {trocaSenhaPendente ? "Pendente" : "Regularizada"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      Tipo de perfil
                    </p>
                    <p className="mt-2 text-sm font-medium capitalize text-zinc-900">
                      {perfilUsuario}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 shadow-sm hover:bg-zinc-100"
                  >
                    <LockKeyhole className="mr-2 h-4 w-4" />
                    Alterar senha
                  </Button>

                  <Button
                    variant="outline"
                    onClick={onLogout}
                    className="w-full rounded-2xl border-red-200 bg-white font-medium text-red-700 shadow-sm hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair da conta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardPage({
  dashboard,
  loading,
}: {
  dashboard: DashboardData | null;
  loading: boolean;
}) {
  function premiumCardClass(extra?: string) {
    return cn(
      "rounded-3xl border border-zinc-200/80 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]",
      extra
    );
  }

  function getMovementBadgeClass(tipo: string) {
    const value = tipo.toLowerCase();

    if (
      value.includes("entrada") ||
      value.includes("compra") ||
      value.includes("reposição") ||
      value.includes("reposicao") ||
      value.includes("devolução") ||
      value.includes("devolucao")
    ) {
      return "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50";
    }

    if (
      value.includes("saída") ||
      value.includes("saida") ||
      value.includes("venda") ||
      value.includes("uso") ||
      value.includes("perda") ||
      value.includes("avaria")
    ) {
      return "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50";
    }

    return "border border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-100";
  }

  if (loading) {
    return <div className="p-6">Carregando dashboard...</div>;
  }

  if (!dashboard) {
    return <div className="p-6">Não foi possível carregar o dashboard.</div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Produtos cadastrados"
          value={dashboard.totalProdutos}
          subtitle="Base atual do sistema"
          icon={Package}
        />
        <StatCard
          title="Itens com estoque baixo"
          value={dashboard.produtosEmAlerta}
          subtitle="Precisam de reposição"
          icon={TriangleAlert}
        />
        <StatCard
          title="Entradas hoje"
          value={dashboard.entradasHoje}
          subtitle="Movimentações de entrada"
          icon={ArrowDownCircle}
        />
        <StatCard
          title="Saídas hoje"
          value={dashboard.saidasHoje}
          subtitle="Vendas e uso interno"
          icon={ArrowUpCircle}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className={premiumCardClass("overflow-hidden")}>
          <CardHeader className="border-b border-zinc-100 bg-gradient-to-r from-white via-zinc-50/60 to-white pb-4">
            <CardTitle className="text-zinc-950">Últimas movimentações</CardTitle>
            <p className="text-sm text-zinc-500">
              Acompanhe os lançamentos mais recentes do estoque em tempo real.
            </p>
          </CardHeader>

          <CardContent className="space-y-4 p-6">
            {dashboard.ultimasMovimentacoes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 py-12 text-center text-sm text-zinc-500">
                Nenhuma movimentação registrada ainda.
              </div>
            ) : (
              dashboard.ultimasMovimentacoes.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-white to-zinc-50/60 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-zinc-950">{item.produto}</p>
                        <Badge className={getMovementBadgeClass(item.tipo)}>
                          {item.tipo} ({item.quantidade})
                        </Badge>
                      </div>

                      <div className="mt-2 flex flex-col gap-1 text-sm text-zinc-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                        <span>{item.data}</span>
                        <span>{item.usuario}</span>
                      </div>

                      <p className="mt-3 text-sm text-zinc-700">
                        {item.observacao || "Sem observação informada."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-right shadow-sm">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        Quantidade
                      </p>
                      <p className="mt-1 text-2xl font-bold text-zinc-950">{item.quantidade}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className={premiumCardClass("overflow-hidden")}>
          <CardHeader className="border-b border-zinc-100 bg-gradient-to-r from-white via-red-50/20 to-white pb-4">
            <CardTitle className="text-zinc-950">Produtos em alerta</CardTitle>
            <p className="text-sm text-zinc-500">
              Itens com estoque abaixo do mínimo para atenção imediata.
            </p>
          </CardHeader>

          <CardContent className="space-y-4 p-6">
            {dashboard.produtosAlerta.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 py-12 text-center text-sm text-zinc-500">
                Nenhum produto em alerta no momento.
              </div>
            ) : (
              dashboard.produtosAlerta.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50/70 to-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-zinc-950">{item.nome}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {item.codigo} • {item.localizacao}
                      </p>
                    </div>

                    <Badge className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
                      Baixo
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        Estoque atual
                      </p>
                      <p className="mt-2 text-2xl font-bold text-red-700">
                        {item.estoqueAtual}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        Estoque mínimo
                      </p>
                      <p className="mt-2 text-2xl font-bold text-zinc-950">
                        {item.estoqueMinimo}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProductFormDialog({
  onCreated,
  productId,
  onCloseEdit,
}: {
  onCreated: () => Promise<void>;
  productId?: string | null;
  onCloseEdit?: () => void;
}) {
  const isEdit = Boolean(productId);
  const [open, setOpen] = useState(false);
  const dialogOpen = isEdit ? true : open;

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [options, setOptions] = useState<ProductCreateOptions>({
    categorias: [],
    fornecedores: [],
    unidadesMedida: [],
    localizacoes: [],
  });

  const [form, setForm] = useState<CreateProductPayload>({ ...EMPTY_PRODUCT_FORM });

  useEffect(() => {
    const loadData = async () => {
      if (!dialogOpen) return;

      try {
        setLoadingOptions(true);
        setErrorMessage("");

        const optionsData = await getProductCreateOptions();
        setOptions(optionsData);

        if (productId) {
          setLoadingProduct(true);
          const product: ProdutoDetalhe = await getProductById(productId);

          setForm({
            codigo: product.codigo,
            nome: product.nome,
            descricao: product.descricao ?? "",
            categoria_id: product.categoria_id,
            fornecedor_principal_id: product.fornecedor_principal_id,
            unidade_medida_id: product.unidade_medida_id,
            localizacao_id: product.localizacao_id,
            marca: product.marca ?? "",
            sku: product.sku ?? "",
            ncm: product.ncm ?? "",
            custo_medio: Number(product.custo_medio ?? 0),
            preco_venda: Number(product.preco_venda ?? 0),
            estoque_atual: Number(product.estoque_atual ?? 0),
            estoque_minimo: Number(product.estoque_minimo ?? 0),
            controla_estoque: product.controla_estoque,
            ativo: product.ativo,
          });
        } else {
          setForm({ ...EMPTY_PRODUCT_FORM });
        }
      } catch (error) {
        console.error("Erro ao carregar dados do formulário:", error);
        setErrorMessage("Não foi possível carregar os dados do formulário.");
      } finally {
        setLoadingOptions(false);
        setLoadingProduct(false);
      }
    };

    loadData();
  }, [dialogOpen, productId]);

  function updateField<K extends keyof CreateProductPayload>(
    field: K,
    value: CreateProductPayload[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit() {
    try {
      setSaving(true);
      setErrorMessage("");

      const payload: CreateProductPayload = {
        ...form,
        custo_medio: Number(form.custo_medio ?? 0),
        preco_venda: Number(form.preco_venda ?? 0),
        estoque_atual: Number(form.estoque_atual ?? 0),
        estoque_minimo: Number(form.estoque_minimo ?? 0),
      };

      if (productId) {
        await updateProduct(productId, payload);
      } else {
        await createProduct(payload);
      }

      if (!isEdit) {
        setOpen(false);
      }

      setForm({ ...EMPTY_PRODUCT_FORM });
      await onCreated();
      onCloseEdit?.();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      setErrorMessage("Não foi possível salvar o produto.");
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(value: boolean) {
    if (!isEdit) {
      setOpen(value);
    }

    if (!value) {
      onCloseEdit?.();
      setErrorMessage("");

      if (!productId) {
        setForm({ ...EMPTY_PRODUCT_FORM });
      }
    }
  }

  function premiumInputClass(extra?: string) {
    return cn(
      "h-12 w-full min-w-0 rounded-2xl border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm transition",
      "placeholder:text-zinc-400",
      "focus-visible:ring-2 focus-visible:ring-zinc-200 focus-visible:ring-offset-0",
      "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500",
      extra
    );
  }

  function premiumSelectClass(extra?: string) {
    return cn(
      "h-12 w-full min-w-0 rounded-2xl border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm transition",
      "focus:ring-2 focus:ring-zinc-200 focus:ring-offset-0",
      "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500",
      "[&>span]:block [&>span]:max-w-full [&>span]:truncate",
      extra
    );
  }

  function sectionCardClass(extra?: string) {
    return cn(
      "min-w-0 rounded-[26px] border border-zinc-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
      extra
    );
  }

  function fieldWrapperClass(extra?: string) {
    return cn("min-w-0 space-y-2", extra);
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {!isEdit ? (
        <DialogTrigger asChild>
          <Button className="h-12 rounded-2xl bg-zinc-950 px-5 font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] hover:bg-zinc-800">
            <Plus className="mr-2 h-4 w-4" />
            Novo produto
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent
        className={cn(
          "flex max-h-[90vh] w-[calc(100vw-3rem)] !max-w-[1120px] flex-col overflow-hidden rounded-[30px] border border-zinc-200 bg-white p-0 shadow-[0_28px_80px_rgba(15,23,42,0.24)]",
          "sm:!max-w-[1120px] lg:!max-w-[1120px]"
        )}
      >
        <DialogHeader className="shrink-0 border-b border-zinc-200 bg-white px-6 py-5 sm:px-8">
          <div className="flex min-w-0 items-start justify-between gap-5">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
                <Package className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <DialogTitle className="text-2xl font-semibold tracking-tight text-zinc-950">
                  {productId ? "Editar produto" : "Cadastrar produto"}
                </DialogTitle>

                <p className="mt-1 max-w-2xl text-sm leading-5 text-zinc-500">
                  Organize as informações comerciais, fiscais e de estoque do produto em um único
                  cadastro.
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {loadingOptions || loadingProduct ? (
          <div className="flex min-h-[420px] flex-1 items-center justify-center px-8 py-14 text-center">
            <div>
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />

              <p className="text-sm font-semibold text-zinc-800">
                Carregando dados do produto...
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Aguarde enquanto buscamos as opções de cadastro.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-zinc-50/60 px-6 py-6 sm:px-8">
            <div className="grid min-w-0 gap-5 xl:grid-cols-[1.35fr_0.9fr]">
              <div className="min-w-0 space-y-5">
                <div className={sectionCardClass()}>
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-zinc-950">
                        Informações principais
                      </h3>

                      <p className="mt-1 text-sm leading-5 text-zinc-500">
                        Dados básicos de identificação e categorização do produto.
                      </p>
                    </div>
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                    <div className={fieldWrapperClass()}>
                      <Label className="text-sm font-medium text-zinc-700">Código</Label>
                      <Input
                        value={form.codigo}
                        onChange={(e) =>
                          updateField(
                            "codigo",
                            normalizeUppercaseInput(e.target.value, FIELD_LIMITS.codigo)
                          )
                        }
                        placeholder={FIELD_PLACEHOLDERS.codigoProduto}
                        maxLength={FIELD_LIMITS.codigo}
                        className={premiumInputClass()}
                      />
                    </div>

                    <div className={fieldWrapperClass()}>
                      <Label className="text-sm font-medium text-zinc-700">Nome</Label>
                      <Input
                        value={form.nome}
                        onChange={(e) =>
                          updateField(
                            "nome",
                            normalizeTextInput(e.target.value, FIELD_LIMITS.nome)
                          )
                        }
                        placeholder={FIELD_PLACEHOLDERS.nomeProduto}
                        maxLength={FIELD_LIMITS.nome}
                        className={premiumInputClass()}
                      />
                    </div>

                    <div className={fieldWrapperClass("md:col-span-2")}>
                      <Label className="text-sm font-medium text-zinc-700">Descrição</Label>
                      <Input
                        value={form.descricao ?? ""}
                        onChange={(e) =>
                          updateField(
                            "descricao",
                            normalizeTextInput(e.target.value, FIELD_LIMITS.descricaoCurta)
                          )
                        }
                        placeholder={FIELD_PLACEHOLDERS.descricaoProduto}
                        maxLength={FIELD_LIMITS.descricaoCurta}
                        className={premiumInputClass()}
                      />
                    </div>

                    <div className={fieldWrapperClass()}>
                      <Label className="text-sm font-medium text-zinc-700">Categoria</Label>
                      <Select
                        value={form.categoria_id}
                        onValueChange={(value) => updateField("categoria_id", value)}
                      >
                        <SelectTrigger className={premiumSelectClass()}>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>

                        <SelectContent className="max-h-72 rounded-2xl border-zinc-200 bg-white">
                          {options.categorias.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={fieldWrapperClass()}>
                      <Label className="text-sm font-medium text-zinc-700">Fornecedor</Label>
                      <Select
                        value={form.fornecedor_principal_id}
                        onValueChange={(value) =>
                          updateField("fornecedor_principal_id", value)
                        }
                      >
                        <SelectTrigger className={premiumSelectClass()}>
                          <SelectValue placeholder="Selecione o fornecedor" />
                        </SelectTrigger>

                        <SelectContent className="max-h-72 rounded-2xl border-zinc-200 bg-white">
                          {options.fornecedores.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={fieldWrapperClass()}>
                      <Label className="text-sm font-medium text-zinc-700">
                        Unidade de medida
                      </Label>
                      <Select
                        value={form.unidade_medida_id}
                        onValueChange={(value) => updateField("unidade_medida_id", value)}
                      >
                        <SelectTrigger className={premiumSelectClass()}>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>

                        <SelectContent className="max-h-72 rounded-2xl border-zinc-200 bg-white">
                          {options.unidadesMedida.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={fieldWrapperClass()}>
                      <Label className="text-sm font-medium text-zinc-700">Localização</Label>
                      <Select
                        value={form.localizacao_id}
                        onValueChange={(value) => updateField("localizacao_id", value)}
                      >
                        <SelectTrigger className={premiumSelectClass()}>
                          <SelectValue placeholder="Selecione a localização" />
                        </SelectTrigger>

                        <SelectContent className="max-h-72 rounded-2xl border-zinc-200 bg-white">
                          {options.localizacoes.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className={sectionCardClass()}>
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-zinc-950">
                      Dados complementares
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-zinc-500">
                      Identificação comercial e fiscal do produto.
                    </p>
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className={fieldWrapperClass()}>
                      <Label className="text-sm font-medium text-zinc-700">Marca</Label>
                      <Input
                        value={form.marca ?? ""}
                        onChange={(e) =>
                          updateField(
                            "marca",
                            normalizeTextInput(e.target.value, FIELD_LIMITS.marca)
                          )
                        }
                        placeholder={FIELD_PLACEHOLDERS.marcaProduto}
                        maxLength={FIELD_LIMITS.marca}
                        className={premiumInputClass()}
                      />
                    </div>

                    <div className={fieldWrapperClass()}>
                      <Label className="text-sm font-medium text-zinc-700">SKU</Label>
                      <Input
                        value={form.sku ?? ""}
                        onChange={(e) =>
                          updateField(
                            "sku",
                            normalizeUppercaseInput(e.target.value, FIELD_LIMITS.sku)
                          )
                        }
                        placeholder={FIELD_PLACEHOLDERS.skuProduto}
                        maxLength={FIELD_LIMITS.sku}
                        className={premiumInputClass()}
                      />
                    </div>

                    <div className={fieldWrapperClass()}>
                      <Label className="text-sm font-medium text-zinc-700">NCM</Label>
                      <Input
                        value={form.ncm ?? ""}
                        onChange={(e) =>
                          updateField("ncm", onlyDigits(e.target.value).slice(0, 8))
                        }
                        placeholder={FIELD_PLACEHOLDERS.ncmProduto}
                        maxLength={8}
                        inputMode="numeric"
                        className={premiumInputClass()}
                      />
                    </div>

                    <div className={fieldWrapperClass()}>
                      <Label className="text-sm font-medium text-zinc-700">Custo médio</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.custo_medio ?? 0}
                        onChange={(e) => updateField("custo_medio", Number(e.target.value))}
                        placeholder="Ex: 25,90"
                        className={premiumInputClass()}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 space-y-5">
                <div className={sectionCardClass("bg-gradient-to-br from-white to-zinc-50")}>
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-zinc-950">
                      Estoque e precificação
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-zinc-500">
                      Controle de valores, quantidades e alertas do item.
                    </p>
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-4">
                    <div className={fieldWrapperClass()}>
                      <Label className="text-sm font-medium text-zinc-700">
                        Preço de venda
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.preco_venda ?? 0}
                        onChange={(e) => updateField("preco_venda", Number(e.target.value))}
                        placeholder="Ex: 49,90"
                        className={premiumInputClass()}
                      />
                    </div>

                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
                      <div className={fieldWrapperClass()}>
                        <Label className="text-sm font-medium text-zinc-700">
                          Estoque atual
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          value={form.estoque_atual ?? 0}
                          onChange={(e) =>
                            updateField("estoque_atual", Number(e.target.value))
                          }
                          placeholder="Ex: 10"
                          className={premiumInputClass()}
                        />
                      </div>

                      <div className={fieldWrapperClass()}>
                        <Label className="text-sm font-medium text-zinc-700">
                          Estoque mínimo
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          value={form.estoque_minimo ?? 0}
                          onChange={(e) =>
                            updateField("estoque_minimo", Number(e.target.value))
                          }
                          placeholder="Ex: 3"
                          className={premiumInputClass()}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={sectionCardClass()}>
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-zinc-950">
                      Configurações do produto
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-zinc-500">
                      Defina como este produto será tratado dentro do sistema.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex min-w-0 cursor-pointer items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm text-zinc-700 shadow-sm transition hover:bg-zinc-50">
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900">Controla estoque</p>
                        <p className="mt-1 text-xs leading-4 text-zinc-500">
                          Define se o item participa do controle quantitativo.
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        checked={Boolean(form.controla_estoque)}
                        onChange={(e) => updateField("controla_estoque", e.target.checked)}
                        className="h-5 w-5 shrink-0 accent-zinc-950"
                      />
                    </label>

                    <label className="flex min-w-0 cursor-pointer items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm text-zinc-700 shadow-sm transition hover:bg-zinc-50">
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900">Produto ativo</p>
                        <p className="mt-1 text-xs leading-4 text-zinc-500">
                          Mantém o produto disponível para uso no sistema.
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        checked={Boolean(form.ativo)}
                        onChange={(e) => updateField("ativo", e.target.checked)}
                        className="h-5 w-5 shrink-0 accent-zinc-950"
                      />
                    </label>
                  </div>
                </div>

                {errorMessage ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {errorMessage}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="shrink-0 border-t border-zinc-200 bg-white px-6 py-4 sm:px-8">
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="h-11 rounded-2xl border-zinc-300 bg-white px-6 font-medium text-zinc-800 hover:bg-zinc-100"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>

            <Button
              className="h-11 rounded-2xl bg-zinc-950 px-7 font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Salvando..." : productId ? "Salvar alterações" : "Salvar produto"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmInactivateDialog({
  open,
  productName,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  productName: string;
  loading: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onCancel()}>
      <DialogContent className="w-[95vw] max-w-md overflow-hidden rounded-[28px] border-zinc-200 bg-white p-0 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
        <DialogHeader className="border-b border-zinc-200 bg-gradient-to-r from-white to-red-50/40 px-6 py-5">
          <DialogTitle className="text-xl font-bold tracking-tight text-zinc-950">
            Inativar produto
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5">
          <div className="rounded-3xl border border-red-100 bg-red-50/70 p-5">
            <p className="text-sm font-semibold text-zinc-950">
              Tem certeza que deseja inativar este produto?
            </p>
            <p className="mt-3 text-sm text-zinc-700">
              Produto: <span className="font-semibold">{productName}</span>
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              O item deixará de aparecer como ativo no sistema e poderá impactar
              consultas futuras e operações ligadas ao catálogo.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-zinc-200 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="w-full rounded-2xl border-zinc-300 bg-white font-semibold text-zinc-800 hover:bg-zinc-100 sm:w-auto"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            className="w-full rounded-2xl bg-red-600 font-semibold text-white shadow-sm hover:bg-red-700 sm:w-auto"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Inativando..." : "Confirmar inativação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SortButton({
  label,
  column,
  sortKey,
  sortDirection,
  onSort,
  align = "left",
}: {
  label: string;
  column: ProductSortKey;
  sortKey: ProductSortKey;
  sortDirection: SortDirection;
  onSort: (column: ProductSortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === column;

  return (
    <button
      onClick={() => onSort(column)}
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold tracking-tight transition hover:text-zinc-900",
        active ? "text-zinc-900" : "text-zinc-600",
        align === "right" ? "ml-auto" : ""
      )}
    >
      <span>{label}</span>
      {active ? (
        sortDirection === "asc" ? (
          <ArrowUpAZ className="h-4 w-4 text-amber-600" />
        ) : (
          <ArrowDownAZ className="h-4 w-4 text-amber-600" />
        )
      ) : (
        <ArrowUpAZ className="h-4 w-4 opacity-30" />
      )}
    </button>
  );
}

function AdminClearDataCard({
  isAdmin,
  target,
  title,
  description,
  confirmationText,
  onCleared,
}: {
  isAdmin: boolean;
  target: ClearTarget;
  title: string;
  description: string;
  confirmationText: string;
  onCleared?: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isAdmin) return null;

  function resetDialogState() {
    setConfirmacao("");
    setAdminPassword("");
    setErrorMessage("");
  }

  async function handleClearData() {
    if (confirmacao !== confirmationText) {
      setErrorMessage(`Digite exatamente: ${confirmationText}`);
      return;
    }

    if (!adminPassword.trim()) {
      setErrorMessage("Informe a senha do admin para confirmar a limpeza.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await clearAdminData(
        target,
        confirmacao,
        adminPassword
      );

      setSuccessMessage(result.message);
      setOpen(false);
      resetDialogState();

      await onCleared?.();
    } catch (error: unknown) {
      console.error("Erro ao executar limpeza:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível executar a limpeza.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden rounded-3xl border border-red-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
      <CardHeader className="border-b border-red-100 bg-gradient-to-r from-red-50 via-white to-white pb-4">
        <CardTitle className="text-red-700">Área administrativa</CardTitle>
        <p className="text-sm text-zinc-600">
          Esta ação aparece somente para administradores e exige senha para confirmação.
        </p>
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        <div className="rounded-3xl border border-red-100 bg-red-50/70 p-5">
          <h3 className="text-base font-bold text-red-700">{title}</h3>

          <p className="mt-2 text-sm leading-6 text-zinc-700">
            {description}
          </p>

          {successMessage ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {errorMessage && !open ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <Button
            type="button"
            onClick={() => {
              setOpen(true);
              setErrorMessage("");
              setSuccessMessage("");
              setConfirmacao("");
              setAdminPassword("");
            }}
            className="mt-5 rounded-2xl bg-red-600 font-semibold text-white hover:bg-red-700"
          >
            {title}
          </Button>
        </div>

        <Dialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value);

            if (!value) {
              resetDialogState();
            }
          }}
        >
          <DialogContent className="w-[95vw] max-w-md overflow-hidden rounded-3xl border-red-200 bg-white p-0">
            <DialogHeader className="border-b border-red-100 bg-red-50 px-6 py-5">
              <DialogTitle className="text-red-700">{title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Esta ação é permanente. Para continuar, confirme a frase de segurança
                e informe a senha atual do administrador.
              </div>

              <div className="space-y-2">
                <Label>
                  Digite exatamente{" "}
                  <span className="font-bold text-red-700">
                    {confirmationText}
                  </span>
                </Label>

                <Input
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value)}
                  placeholder={confirmationText}
                  className="h-11 rounded-2xl border-zinc-300 bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Senha do admin</Label>

                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  autoComplete="current-password"
                  className="h-11 rounded-2xl border-zinc-300 bg-white"
                />
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}
            </div>

            <DialogFooter className="flex-col gap-2 border-t border-zinc-200 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="w-full rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100 sm:w-auto"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={handleClearData}
                disabled={
                  loading ||
                  confirmacao !== confirmationText ||
                  !adminPassword.trim()
                }
                className="w-full rounded-2xl bg-red-600 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? "Validando e limpando..." : "Confirmar limpeza"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function ProductsPage({
  products,
  loading,
  onCreated,
  isAdmin,
}: {
  products: Produto[];
  loading: boolean;
  onCreated: () => Promise<void>;
  isAdmin: boolean;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [supplierFilter, setSupplierFilter] = useState("todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);
  const [productToInactivate, setProductToInactivate] = useState<Produto | null>(null);
  const [sortKey, setSortKey] = useState<ProductSortKey>("codigo");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState<ProdutoDetalhes | null>(null);
  const [detailsProductId, setDetailsProductId] = useState<string | null>(null);

  const pageSize = 8;

  const categories = useMemo(
    () => Array.from(new Set(products.map((item) => item.categoria).filter(Boolean))).sort(),
    [products]
  );

  const suppliers = useMemo(
    () => Array.from(new Set(products.map((item) => item.fornecedor).filter(Boolean))).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter((item) => {
      const matchesQuery = [item.nome, item.codigo, item.marca, item.categoria, item.fornecedor]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesStatus = statusFilter === "todos" ? true : item.status === statusFilter;
      const matchesCategory = categoryFilter === "todas" ? true : item.categoria === categoryFilter;
      const matchesSupplier = supplierFilter === "todos" ? true : item.fornecedor === supplierFilter;

      return matchesQuery && matchesStatus && matchesCategory && matchesSupplier;
    });
  }, [products, query, statusFilter, categoryFilter, supplierFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];

    list.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      switch (sortKey) {
        case "codigo":
          return a.codigo.localeCompare(b.codigo, "pt-BR", { numeric: true }) * direction;
        case "nome":
          return a.nome.localeCompare(b.nome, "pt-BR") * direction;
        case "categoria":
          return a.categoria.localeCompare(b.categoria, "pt-BR") * direction;
        case "fornecedor":
          return a.fornecedor.localeCompare(b.fornecedor, "pt-BR") * direction;
        case "estoqueAtual":
          return (a.estoqueAtual - b.estoqueAtual) * direction;
        case "preco":
          return (a.preco - b.preco) * direction;
        default:
          return 0;
      }
    });

    return list;
  }, [filtered, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage]);

  const totalProducts = products.length;
  const totalFiltered = filtered.length;
  const totalAlerts = products.filter((item) => item.status === "baixo").length;
  const totalCategories = categories.length;

  function premiumCardClass(extra?: string) {
    return cn(
      "rounded-3xl border border-zinc-200/80 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]",
      extra
    );
  }

  function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));
}

  function handleSort(column: ProductSortKey) {
    setCurrentPage(1);

    if (sortKey === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(column);
    setSortDirection("asc");
  }

  async function handleConfirmInactivate() {
    if (!productToInactivate) return;

    try {
      setInactivatingId(productToInactivate.id);
      await inactivateProduct(productToInactivate.id);

      if (detailsProductId === productToInactivate.id) {
        setDetailsOpen(false);
        setDetailsData(null);
        setDetailsProductId(null);
      }

      setProductToInactivate(null);
      await onCreated();
    } catch (error) {
      console.error("Erro ao inativar produto:", error);
      alert("Não foi possível inativar o produto.");
    } finally {
      setInactivatingId(null);
    }
  }

  async function handleOpenDetails(productId: string) {
    try {
      setDetailsProductId(productId);
      setDetailsOpen(true);
      setDetailsLoading(true);
      setDetailsData(null);

      const data = await getProductDetails(productId);
      setDetailsData(data);
    } catch (error) {
      console.error("Erro ao carregar detalhes do produto:", error);
      setDetailsData(null);
    } finally {
      setDetailsLoading(false);
    }
  }

  function handleEditFromDetails() {
    if (!detailsProductId) return;

    setDetailsOpen(false);
    setEditingId(detailsProductId);
  }

  function handleInactivateFromDetails() {
    if (!detailsProductId) return;

    const product = products.find((item) => item.id === detailsProductId);
    if (!product) return;

    setProductToInactivate(product);
  }

  async function refreshAfterEdit() {
    await onCreated();

    if (detailsProductId) {
      await handleOpenDetails(detailsProductId);
    }
  }

  if (loading) {
    return <div className="p-6">Carregando produtos...</div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total de produtos" value={totalProducts} subtitle="Itens carregados no sistema" icon={Package} />
        <StatCard title="Resultados filtrados" value={totalFiltered} subtitle="Itens conforme filtros atuais" icon={Filter} />
        <StatCard title="Produtos em alerta" value={totalAlerts} subtitle="Abaixo do estoque mínimo" icon={TriangleAlert} />
        <StatCard title="Categorias ativas" value={totalCategories} subtitle="Categorias com itens cadastrados" icon={Warehouse} />
      </div>

      <Card className={premiumCardClass("overflow-hidden")}>
        <CardHeader className="border-b border-zinc-100 bg-gradient-to-r from-white via-zinc-50/60 to-white pb-4">
          <CardTitle className="text-zinc-950">Painel de produtos</CardTitle>
          <p className="text-sm text-zinc-500">
            Filtre, organize e acesse rapidamente os detalhes de cada item do estoque.
          </p>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="rounded-3xl border border-zinc-200/80 bg-zinc-50/60 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <div className="grid gap-3">
              <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_180px_200px_210px]">
                <div className="relative min-w-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Buscar por nome, código, marca ou fornecedor"
                    className="h-12 rounded-2xl border-zinc-300 bg-white pl-9 shadow-sm"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 shadow-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-200 bg-white">
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="ok">Estoque normal</SelectItem>
                    <SelectItem value="baixo">Estoque baixo</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-12 rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 shadow-sm">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-200 bg-white">
                    <SelectItem value="todas">Todas categorias</SelectItem>
                    {categories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger className="h-12 rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 shadow-sm">
                    <SelectValue placeholder="Fornecedor" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-200 bg-white">
                    <SelectItem value="todos">Todos fornecedores</SelectItem>
                    {suppliers.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="h-11 rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100"
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("todos");
                    setCategoryFilter("todas");
                    setSupplierFilter("todos");
                    setSortKey("codigo");
                    setSortDirection("asc");
                    setCurrentPage(1);
                  }}
                >
                  Limpar filtros
                </Button>

                <ProductFormDialog onCreated={onCreated} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.03)] sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-600">
              Exibindo <span className="font-semibold text-zinc-950">{paginatedProducts.length}</span> itens na página{" "}
              <span className="font-semibold text-zinc-950">{currentPage}</span> de{" "}
              <span className="font-semibold text-zinc-950">{totalPages}</span>.
            </div>

            <div className="text-sm text-zinc-600">
              Ordenação atual: <span className="font-semibold text-zinc-950">{sortKey}</span> ({sortDirection})
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={premiumCardClass("overflow-hidden")}>
  <CardHeader className="border-b border-zinc-100 bg-gradient-to-r from-white via-zinc-50/60 to-white pb-4">
    <CardTitle className="text-zinc-950">Produtos cadastrados</CardTitle>
    <p className="text-sm text-zinc-500">
      Visualização em tabela no desktop e em cards no celular.
    </p>
  </CardHeader>

  <CardContent className="p-4 sm:p-6">
    {/* Desktop / notebook */}
    <div className="hidden overflow-x-auto rounded-3xl border border-zinc-200/80 lg:block">
      <Table className="min-w-[1180px]">
        <TableHeader>
          <TableRow className="border-zinc-200 bg-zinc-50/90 hover:bg-zinc-50/90">
            <TableHead className="w-[110px]">
              <SortButton
                label="Código"
                column="codigo"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </TableHead>

            <TableHead className="w-[260px]">
              <SortButton
                label="Produto"
                column="nome"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </TableHead>

            <TableHead className="w-[160px]">
              <SortButton
                label="Categoria"
                column="categoria"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </TableHead>

            <TableHead className="w-[130px] text-zinc-600">Marca</TableHead>

            <TableHead className="w-[240px]">
              <SortButton
                label="Fornecedor"
                column="fornecedor"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </TableHead>

            <TableHead className="w-[120px] text-zinc-600">Localização</TableHead>

            <TableHead className="w-[100px]">
              <SortButton
                label="Estoque"
                column="estoqueAtual"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </TableHead>

            <TableHead className="w-[120px]">
              <SortButton
                label="Preço"
                column="preco"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </TableHead>

            <TableHead className="w-[90px] text-zinc-600">Status</TableHead>
            <TableHead className="w-[130px] text-right text-zinc-600">Ações</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedProducts.map((item) => (
            <TableRow
              key={item.id}
              className="border-zinc-100 bg-white hover:bg-zinc-50/60"
            >
              <TableCell className="whitespace-nowrap font-semibold text-zinc-950">
                {item.codigo}
              </TableCell>

              <TableCell className="font-medium text-zinc-900">
                <div className="max-w-[250px] truncate" title={item.nome}>
                  {item.nome}
                </div>
              </TableCell>

              <TableCell className="text-zinc-700">
                <div className="max-w-[150px] truncate" title={item.categoria}>
                  {item.categoria}
                </div>
              </TableCell>

              <TableCell className="text-zinc-700">
                <div className="max-w-[120px] truncate" title={item.marca}>
                  {item.marca || "-"}
                </div>
              </TableCell>

              <TableCell className="text-zinc-700">
                <div className="max-w-[230px] truncate" title={item.fornecedor}>
                  {item.fornecedor || "-"}
                </div>
              </TableCell>

              <TableCell className="whitespace-nowrap text-zinc-700">
                {item.localizacao || "-"}
              </TableCell>

              <TableCell className="whitespace-nowrap font-medium text-zinc-900">
                {item.estoqueAtual}
              </TableCell>

              <TableCell className="whitespace-nowrap font-medium text-zinc-900">
                {formatMoney(item.preco)}
              </TableCell>

              <TableCell>
                {item.status === "baixo" ? (
                  <Badge className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
                    Baixo
                  </Badge>
                ) : (
                  <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                    Normal
                  </Badge>
                )}
              </TableCell>

              <TableCell>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100"
                    onClick={() => handleOpenDetails(item.id)}
                  >
                    Ver detalhes
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    {/* Tablet / celular */}
    <div className="space-y-3 lg:hidden">
      {paginatedProducts.map((item) => (
        <div
          key={item.id}
          className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {item.codigo}
              </p>

              <h3 className="mt-1 line-clamp-2 text-base font-bold text-zinc-950">
                {item.nome}
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                {item.categoria || "Sem categoria"}
              </p>
            </div>

            {item.status === "baixo" ? (
              <Badge className="shrink-0 border border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
                Baixo
              </Badge>
            ) : (
              <Badge className="shrink-0 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                Normal
              </Badge>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3">
              <p className="text-xs text-zinc-500">Estoque</p>
              <p className="mt-1 text-lg font-bold text-zinc-950">
                {item.estoqueAtual}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3">
              <p className="text-xs text-zinc-500">Preço</p>
              <p className="mt-1 text-lg font-bold text-zinc-950">
                {formatMoney(item.preco)}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-zinc-500">Marca</span>
              <span className="text-right font-medium text-zinc-800">
                {item.marca || "-"}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-zinc-500">Fornecedor</span>
              <span className="max-w-[190px] truncate text-right font-medium text-zinc-800">
                {item.fornecedor || "-"}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-zinc-500">Localização</span>
              <span className="text-right font-medium text-zinc-800">
                {item.localizacao || "-"}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="mt-4 h-11 w-full rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100"
            onClick={() => handleOpenDetails(item.id)}
          >
            Ver detalhes
          </Button>
        </div>
      ))}
    </div>

    {paginatedProducts.length === 0 ? (
      <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-500">
        Nenhum produto encontrado com os filtros aplicados.
      </div>
    ) : null}

    {sorted.length > 0 ? (
      <div className="mt-5 flex flex-col gap-3 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-zinc-600">
          Mostrando {Math.min((currentPage - 1) * pageSize + 1, sorted.length)} a{" "}
          {Math.min(currentPage * pageSize, sorted.length)} de{" "}
          <span className="font-semibold text-zinc-950">{sorted.length}</span> produtos.
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Button>

          <div className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800">
            Página {currentPage} de {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    ) : null}
  </CardContent>
</Card>

      {editingId ? (
        <ProductFormDialog
          productId={editingId}
          onCreated={refreshAfterEdit}
          onCloseEdit={() => setEditingId(null)}
        />
      ) : null}

      <ConfirmInactivateDialog
        open={Boolean(productToInactivate)}
        productName={productToInactivate?.nome ?? ""}
        loading={Boolean(productToInactivate && inactivatingId === productToInactivate.id)}
        onConfirm={handleConfirmInactivate}
        onCancel={() => {
          if (!inactivatingId) setProductToInactivate(null);
        }}
      />

      <AdminClearDataCard
        isAdmin={isAdmin}
        target="produtos"
        title="Limpar produtos"
        description="Remove todos os produtos cadastrados. Para evitar erro de vínculo, as movimentações também serão removidas antes dos produtos."
        confirmationText="LIMPAR PRODUTOS"
        onCleared={onCreated}
      />

      <ProductDetailsModal
        open={detailsOpen}
        loading={detailsLoading}
        data={detailsData}
        onClose={() => {
          setDetailsOpen(false);
          setDetailsData(null);
          setDetailsProductId(null);
        }}
        onEdit={handleEditFromDetails}
        onInactivate={handleInactivateFromDetails}
        inactivating={Boolean(
          detailsProductId &&
            productToInactivate &&
            inactivatingId === detailsProductId &&
            productToInactivate.id === detailsProductId
        )}
      />
    </div>
  );
}

function EntriesPage({
  onCreated,
  isAdmin,
}: {
  onCreated: () => Promise<void>;
  isAdmin: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [recentMovements, setRecentMovements] = useState<Movimentacao[]>([]);
  const [options, setOptions] = useState<{
    produtos: { id: string; nome: string; estoqueAtual: number; status: string }[];
    tiposEntrada: { id: string; nome: string }[];
  }>({
    produtos: [],
    tiposEntrada: [],
  });

  const [form, setForm] = useState({
    produto_id: "",
    tipo_movimentacao_id: "",
    quantidade: 1,
    custo_unitario: 0,
    observacoes: "",
    nota_fiscal_numero: "",
    nota_fiscal_arquivo: null as File | null,
  });

  function premiumCardClass(extra?: string) {
    return cn(
      "rounded-3xl border border-zinc-200/80 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]",
      extra
    );
  }

  function sectionCardClass(extra?: string) {
    return cn(
      "rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-white to-zinc-50/50 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]",
      extra
    );
  }

  function premiumInputClass(extra?: string) {
    return cn(
      "h-12 rounded-2xl border-zinc-200 bg-white text-zinc-900 shadow-sm transition",
      "placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-200 focus-visible:ring-offset-0",
      extra
    );
  }

  const loadEntryOptions = useCallback(async (preserveSelectedProductId?: string) => {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await getEntryFormOptions();
      setOptions(data);

      if (preserveSelectedProductId) {
        const exists = data.produtos.some((item) => item.id === preserveSelectedProductId);

        if (!exists) {
          setForm((prev) => ({
            ...prev,
            produto_id: "",
          }));
        }
      }
    } catch (error) {
      console.error("Erro ao carregar opções de entrada:", error);
      setErrorMessage("Não foi possível carregar os dados da entrada.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecentMovements = useCallback(async (productId?: string) => {
    if (!productId) {
      setRecentMovements([]);
      return;
    }

    try {
      setHistoryLoading(true);

      const data = await getMovements({
        produto: productId,
      });

      setRecentMovements(data.slice(0, 5));
    } catch (error) {
      console.error("Erro ao carregar histórico do produto:", error);
      setRecentMovements([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await loadEntryOptions();
    };

    run();
  }, [loadEntryOptions]);

  useEffect(() => {
    const run = async () => {
      await loadRecentMovements(form.produto_id || undefined);
    };

    run();
  }, [form.produto_id, loadRecentMovements]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const selectedProduct = options.produtos.find((item) => item.id === form.produto_id);
  const selectedType = options.tiposEntrada.find((item) => item.id === form.tipo_movimentacao_id);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();

    if (!term) return options.produtos;

    return options.produtos.filter((item) => item.nome.toLowerCase().includes(term));
  }, [options.produtos, productSearch]);

  const estoqueAtual = selectedProduct ? Number(selectedProduct.estoqueAtual ?? 0) : 0;
  const quantidadeEntrada = Number(form.quantidade ?? 0);
  const custoUnitario = Number(form.custo_unitario ?? 0);
  const estoqueProjetado = selectedProduct ? estoqueAtual + quantidadeEntrada : 0;
  const custoTotal = quantidadeEntrada * custoUnitario;

  const quantidadeInvalida = !Number.isFinite(quantidadeEntrada) || quantidadeEntrada <= 0;
  const custoInvalido = !Number.isFinite(custoUnitario) || custoUnitario < 0;

  const canSubmit =
    Boolean(form.produto_id) &&
    Boolean(form.tipo_movimentacao_id) &&
    !quantidadeInvalida &&
    !custoInvalido &&
    !saving &&
    !loading;

  async function handleConfirmSave() {
    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const produtoSelecionadoId = form.produto_id;
      const nomeProduto = selectedProduct?.nome ?? "Produto";
      const quantidadeSalva = quantidadeEntrada;

      const formData = new FormData();
      formData.append("produto_id", produtoSelecionadoId);
      formData.append("tipo_movimentacao_id", form.tipo_movimentacao_id);
      formData.append("quantidade", String(quantidadeSalva));
      formData.append("custo_unitario", String(custoUnitario));
      formData.append("observacoes", form.observacoes || "");
      formData.append("nota_fiscal_numero", form.nota_fiscal_numero || "");

      if (form.nota_fiscal_arquivo) {
        formData.append("nota_fiscal_arquivo", form.nota_fiscal_arquivo);
      }

      await createEntryWithInvoice(formData);

      await Promise.all([
        onCreated(),
        loadEntryOptions(produtoSelecionadoId),
        loadRecentMovements(produtoSelecionadoId),
      ]);

      setForm((prev) => ({
        ...prev,
        produto_id: produtoSelecionadoId,
        quantidade: 1,
        custo_unitario: 0,
        observacoes: "",
        nota_fiscal_numero: "",
        nota_fiscal_arquivo: null,
      }));

      setConfirmOpen(false);
      setSuccessMessage(
        `Entrada registrada com sucesso para ${nomeProduto}. Quantidade adicionada: ${quantidadeSalva}.`
      );
    } catch (error: unknown) {
      console.error("Erro ao registrar entrada:", error);

      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error ===
          "string"
          ? (error as { response?: { data?: { error?: string } } }).response!.data!.error!
          : "Não foi possível registrar a entrada.";

      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }

  function handleLaunchAgain() {
    setForm((prev) => ({
      ...prev,
      quantidade: 1,
      custo_unitario: 0,
      observacoes: "",
      nota_fiscal_numero: "",
      nota_fiscal_arquivo: null,
    }));
    setSuccessMessage("");
    setErrorMessage("");
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className={premiumCardClass("overflow-hidden")}>
          <CardHeader className="border-b border-zinc-100 bg-gradient-to-r from-white via-zinc-50/60 to-white pb-4">
            <CardTitle className="text-zinc-950">Registrar entrada</CardTitle>
            <p className="text-sm text-zinc-500">
              Cadastre reposições e compras com nota fiscal e custo unitário.
            </p>
          </CardHeader>

          <CardContent className="space-y-5 p-6">
            {loading ? (
              <p className="text-sm text-zinc-500">Carregando opções...</p>
            ) : (
              <>
                <div className={sectionCardClass()}>
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-zinc-950">Dados da entrada</h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      Selecione o produto e informe os dados financeiros e do documento.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-zinc-700">Buscar produto</Label>
                      <Input
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Digite código ou nome do produto"
                        className={premiumInputClass()}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-zinc-700">Produto</Label>
                      <Select
                        value={form.produto_id}
                        onValueChange={(value) => {
                          setForm((prev) => ({ ...prev, produto_id: value }));
                          setSuccessMessage("");
                          setErrorMessage("");
                        }}
                      >
                        <SelectTrigger className={premiumInputClass()}>
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-zinc-200 bg-white">
                          {filteredProducts.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-zinc-500">
                              Nenhum produto encontrado.
                            </div>
                          ) : (
                            filteredProducts.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.nome}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-zinc-700">Tipo de entrada</Label>
                      <Select
                        value={form.tipo_movimentacao_id}
                        onValueChange={(value) => {
                          setForm((prev) => ({
                            ...prev,
                            tipo_movimentacao_id: value,
                          }));
                          setSuccessMessage("");
                          setErrorMessage("");
                        }}
                      >
                        <SelectTrigger className={premiumInputClass()}>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-zinc-200 bg-white">
                          {options.tiposEntrada.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-zinc-700">Quantidade</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.quantidade}
                        onChange={(e) => {
                          setForm((prev) => ({
                            ...prev,
                            quantidade: Number(e.target.value),
                          }));
                          setSuccessMessage("");
                          setErrorMessage("");
                        }}
                        placeholder="0"
                        className={premiumInputClass(
                          quantidadeInvalida
                            ? "border-red-300 focus-visible:ring-red-200"
                            : ""
                        )}
                      />
                      {quantidadeInvalida ? (
                        <p className="text-xs text-red-600">Informe uma quantidade maior que zero.</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-zinc-700">Custo unitário</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.custo_unitario}
                        onChange={(e) => {
                          setForm((prev) => ({
                            ...prev,
                            custo_unitario: Number(e.target.value),
                          }));
                          setSuccessMessage("");
                          setErrorMessage("");
                        }}
                        placeholder="0,00"
                        className={premiumInputClass(
                          custoInvalido
                            ? "border-red-300 focus-visible:ring-red-200"
                            : ""
                        )}
                      />
                      {custoInvalido ? (
                        <p className="text-xs text-red-600">O custo unitário não pode ser negativo.</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-zinc-700">Número da nota fiscal</Label>
                      <Input
                        value={form.nota_fiscal_numero}
                        onChange={(e) => {
                          setForm((prev) => ({
                            ...prev,
                            nota_fiscal_numero: e.target.value,
                          }));
                          setSuccessMessage("");
                          setErrorMessage("");
                        }}
                        placeholder="Ex: 12345"
                        className={premiumInputClass()}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-zinc-700">Anexar nota fiscal</Label>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          setForm((prev) => ({
                            ...prev,
                            nota_fiscal_arquivo: e.target.files?.[0] ?? null,
                          }));
                          setSuccessMessage("");
                          setErrorMessage("");
                        }}
                        className={cn(
                          premiumInputClass(
                            "h-12 file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
                          )
                        )}
                      />
                      {form.nota_fiscal_arquivo ? (
                        <p className="text-xs text-zinc-500">
                          Arquivo selecionado: {form.nota_fiscal_arquivo.name}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-zinc-700">Observação</Label>
                      <Input
                        value={form.observacoes}
                        onChange={(e) => {
                          setForm((prev) => ({
                            ...prev,
                            observacoes: e.target.value,
                          }));
                          setSuccessMessage("");
                        }}
                        placeholder="Ex: Compra de reposição do fornecedor"
                        className={premiumInputClass()}
                      />
                    </div>
                  </div>
                </div>

                {successMessage ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {successMessage}
                  </div>
                ) : null}

                {errorMessage ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-2xl border-zinc-300 bg-white px-5 font-medium text-zinc-800 hover:bg-zinc-100"
                    onClick={handleLaunchAgain}
                    disabled={saving}
                  >
                    Lançar novamente
                  </Button>

                  <Button
                    className="h-12 rounded-2xl bg-zinc-950 px-6 font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] hover:bg-zinc-800"
                    onClick={() => setConfirmOpen(true)}
                    disabled={!canSubmit}
                  >
                    {saving ? "Salvando..." : "Salvar entrada"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={premiumCardClass("overflow-hidden")}>
          <CardHeader className="border-b border-zinc-100 bg-gradient-to-r from-white via-zinc-50/60 to-white pb-4">
            <CardTitle className="text-zinc-950">Resumo da operação</CardTitle>
            <p className="text-sm text-zinc-500">
              Acompanhe impacto no estoque e no custo antes de confirmar.
            </p>
          </CardHeader>

          <CardContent className="space-y-4 p-6">
            <div className={sectionCardClass("p-4")}>
              <p className="text-sm text-zinc-500">Produto selecionado</p>
              <p className="mt-1 font-semibold text-zinc-950">
                {selectedProduct?.nome ?? "Nenhum produto selecionado"}
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Tipo: {selectedType?.nome ?? "Não selecionado"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className={sectionCardClass("p-4")}>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Estoque atual</p>
                <p className="mt-2 text-2xl font-bold text-zinc-950">{estoqueAtual}</p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-[0_8px_24px_rgba(16,185,129,0.08)]">
                <p className="text-xs uppercase tracking-wide text-emerald-700">
                  Estoque após entrada
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">
                  {selectedProduct ? estoqueProjetado : "-"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className={sectionCardClass("p-4")}>
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Quantidade informada
                </p>
                <p className="mt-2 text-xl font-semibold text-zinc-950">
                  {quantidadeEntrada || 0}
                </p>
              </div>

              <div className={sectionCardClass("p-4")}>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Custo unitário</p>
                <p className="mt-2 text-xl font-semibold text-zinc-950">
                  R$ {custoUnitario.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-[0_8px_24px_rgba(245,158,11,0.08)]">
              <p className="text-xs uppercase tracking-wide text-amber-700">
                Custo total da entrada
              </p>
              <p className="mt-2 text-3xl font-bold text-amber-700">
                R$ {custoTotal.toFixed(2)}
              </p>
            </div>

            <div className={sectionCardClass("p-4")}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">
                  Últimas movimentações do produto
                </p>
                {historyLoading ? (
                  <span className="text-xs text-zinc-500">Atualizando...</span>
                ) : null}
              </div>

              {!form.produto_id ? (
                <p className="text-sm text-zinc-500">
                  Selecione um produto para ver o histórico recente.
                </p>
              ) : recentMovements.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhuma movimentação recente encontrada.</p>
              ) : (
                <div className="space-y-2">
                  {recentMovements.map((item) => {
                    const isEntrada =
                      (item.natureza ?? "").toLowerCase().includes("entrada") ||
                      item.tipo.toLowerCase().includes("entrada") ||
                      item.tipo.toLowerCase().includes("compra");
                                                      
                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-zinc-900">{item.tipo}</span>
                          <Badge
                            className={
                              isEntrada
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                                : "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
                            }
                          >
                            {item.quantidade}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {new Date(item.data).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="w-[95vw] max-w-md rounded-3xl border border-zinc-200 bg-white p-0 overflow-hidden shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          <DialogHeader className="border-b border-zinc-100 bg-gradient-to-r from-white via-zinc-50/70 to-white px-6 py-5">
            <DialogTitle className="text-zinc-950">Confirmar entrada</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-zinc-950">
                Confirma o lançamento desta entrada no estoque?
              </p>

              <div className="mt-3 space-y-2 text-sm text-zinc-700">
                <p>
                  <span className="font-semibold">Produto:</span> {selectedProduct?.nome ?? "-"}
                </p>
                <p>
                  <span className="font-semibold">Tipo:</span> {selectedType?.nome ?? "-"}
                </p>
                <p>
                  <span className="font-semibold">Quantidade:</span> {quantidadeEntrada}
                </p>
                <p>
                  <span className="font-semibold">Custo unitário:</span> R$ {custoUnitario.toFixed(2)}
                </p>
                <p>
                  <span className="font-semibold">Custo total:</span> R$ {custoTotal.toFixed(2)}
                </p>
                <p>
                  <span className="font-semibold">Número da nota fiscal:</span>{" "}
                  {form.nota_fiscal_numero || "-"}
                </p>
                <p>
                  <span className="font-semibold">Arquivo da nota:</span>{" "}
                  {form.nota_fiscal_arquivo?.name || "Não anexado"}
                </p>
                <p>
                  <span className="font-semibold">Estoque atual:</span> {estoqueAtual}
                </p>
                <p>
                  <span className="font-semibold">Estoque após entrada:</span>{" "}
                  {selectedProduct ? estoqueProjetado : "-"}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 border-t border-zinc-100 px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="h-11 w-full rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100 sm:w-auto"
              onClick={() => setConfirmOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>

            <Button
              className="h-11 w-full rounded-2xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700 sm:w-auto"
              onClick={handleConfirmSave}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Confirmar entrada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AdminClearDataCard
        isAdmin={isAdmin}
        target="entradas"
        title="Limpar entradas"
        description="Remove todos os registros de entrada cadastrados no sistema. Os produtos permanecem cadastrados, mas o histórico de entrada será apagado."
        confirmationText="LIMPAR ENTRADAS"
        onCleared={onCreated}
      />
    </div>
    
  );
}

function OutputsPage({
  onCreated,
  isAdmin,
}: {
  onCreated: () => Promise<void>;
  isAdmin: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [recentMovements, setRecentMovements] = useState<Movimentacao[]>([]);
  const [options, setOptions] = useState<{
    produtos: { id: string; nome: string; estoqueAtual: number; status: string }[];
    tiposSaida: { id: string; nome: string }[];
  }>({
    produtos: [],
    tiposSaida: [],
  });

  const [form, setForm] = useState({
    produto_id: "",
    tipo_movimentacao_id: "",
    quantidade: 1,
    observacoes: "",
  });

  const loadExitOptions = useCallback(async (preserveSelectedProductId?: string) => {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await getExitFormOptions();
      setOptions(data);

      if (preserveSelectedProductId) {
        const exists = data.produtos.some((item) => item.id === preserveSelectedProductId);

        if (!exists) {
          setForm((prev) => ({
            ...prev,
            produto_id: "",
          }));
        }
      }
    } catch (error) {
      console.error("Erro ao carregar opções de saída:", error);
      setErrorMessage("Não foi possível carregar os dados da saída.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecentMovements = useCallback(async (productId?: string) => {
    if (!productId) {
      setRecentMovements([]);
      return;
    }

    try {
      setHistoryLoading(true);

      const data = await getMovements({
        produto: productId,
      });

      setRecentMovements(data.slice(0, 5));
    } catch (error) {
      console.error("Erro ao carregar histórico do produto:", error);
      setRecentMovements([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await loadExitOptions();
    };

    run();
  }, [loadExitOptions]);

  useEffect(() => {
    const run = async () => {
      await loadRecentMovements(form.produto_id || undefined);
    };

    run();
  }, [form.produto_id, loadRecentMovements]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const selectedProduct = options.produtos.find((item) => item.id === form.produto_id);
  const selectedType = options.tiposSaida.find((item) => item.id === form.tipo_movimentacao_id);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();

    if (!term) return options.produtos;

    return options.produtos.filter((item) => item.nome.toLowerCase().includes(term));
  }, [options.produtos, productSearch]);

  const estoqueAtual = selectedProduct ? Number(selectedProduct.estoqueAtual ?? 0) : 0;
  const quantidadeSaida = Number(form.quantidade ?? 0);
  const estoqueProjetado = selectedProduct ? estoqueAtual - quantidadeSaida : 0;
  const quantidadeInvalida = !Number.isFinite(quantidadeSaida) || quantidadeSaida <= 0;
  const saidaInvalida = selectedProduct ? quantidadeSaida > estoqueAtual : false;
  const ficaraNegativo = selectedProduct ? estoqueProjetado < 0 : false;

  const canSubmit =
    Boolean(form.produto_id) &&
    Boolean(form.tipo_movimentacao_id) &&
    !quantidadeInvalida &&
    !saidaInvalida &&
    !ficaraNegativo &&
    !saving &&
    !loading;

  function premiumCardClass(extra?: string) {
    return cn(
      "rounded-3xl border border-zinc-200/80 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]",
      extra
    );
  }

  function summaryMiniCardClass(extra?: string) {
    return cn(
      "rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]",
      extra
    );
  }

  async function handleConfirmSave() {
    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const produtoSelecionadoId = form.produto_id;
      const nomeProduto = selectedProduct?.nome ?? "Produto";
      const quantidadeSalva = quantidadeSaida;

      await createExit({
        produto_id: produtoSelecionadoId,
        tipo_movimentacao_id: form.tipo_movimentacao_id,
        quantidade: quantidadeSalva,
        observacoes: form.observacoes,
      });

      await Promise.all([
        onCreated(),
        loadExitOptions(produtoSelecionadoId),
        loadRecentMovements(produtoSelecionadoId),
      ]);

      setForm((prev) => ({
        ...prev,
        produto_id: produtoSelecionadoId,
        quantidade: 1,
        observacoes: "",
      }));

      setConfirmOpen(false);
      setSuccessMessage(
        `Saída registrada com sucesso para ${nomeProduto}. Quantidade baixada: ${quantidadeSalva}.`
      );
    } catch (error: unknown) {
      console.error("Erro ao registrar saída:", error);

      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error ===
          "string"
          ? (error as { response?: { data?: { error?: string } } }).response!.data!.error!
          : "Não foi possível registrar a saída.";

      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }

  function handleLaunchAgain() {
    setForm((prev) => ({
      ...prev,
      quantidade: 1,
      observacoes: "",
    }));
    setSuccessMessage("");
    setErrorMessage("");
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className={premiumCardClass("overflow-hidden")}>
          <CardHeader className="border-b border-zinc-100 bg-gradient-to-r from-white via-zinc-50/60 to-white pb-4">
            <CardTitle className="text-zinc-950">Registrar saída</CardTitle>
            <p className="text-sm text-zinc-500">
              Lance baixas de estoque com validação visual do saldo disponível.
            </p>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {loading ? (
              <p className="text-sm text-zinc-500">Carregando opções...</p>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-zinc-700">Buscar produto</Label>
                    <Input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Digite código ou nome do produto"
                      className="h-12 rounded-2xl border-zinc-300 bg-white shadow-sm"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-zinc-700">Produto</Label>
                    <Select
                      value={form.produto_id}
                      onValueChange={(value) => {
                        setForm((prev) => ({ ...prev, produto_id: value }));
                        setSuccessMessage("");
                        setErrorMessage("");
                      }}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-zinc-300 bg-white shadow-sm">
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProducts.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-zinc-500">
                            Nenhum produto encontrado.
                          </div>
                        ) : (
                          filteredProducts.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.nome}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-700">Tipo de saída</Label>
                    <Select
                      value={form.tipo_movimentacao_id}
                      onValueChange={(value) => {
                        setForm((prev) => ({
                          ...prev,
                          tipo_movimentacao_id: value,
                        }));
                        setSuccessMessage("");
                        setErrorMessage("");
                      }}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-zinc-300 bg-white shadow-sm">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.tiposSaida.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-700">Quantidade</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.quantidade}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          quantidade: Number(e.target.value),
                        }));
                        setSuccessMessage("");
                        setErrorMessage("");
                      }}
                      className={cn(
                        "h-12 rounded-2xl bg-white shadow-sm",
                        quantidadeInvalida || saidaInvalida
                          ? "border-red-300 focus-visible:ring-red-200"
                          : "border-zinc-300"
                      )}
                    />
                    {quantidadeInvalida ? (
                      <p className="text-xs text-red-600">Informe uma quantidade maior que zero.</p>
                    ) : null}
                    {!quantidadeInvalida && saidaInvalida ? (
                      <p className="text-xs text-red-600">
                        A quantidade informada é maior que o estoque disponível.
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-zinc-700">Observação</Label>
                    <Input
                      value={form.observacoes}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          observacoes: e.target.value,
                        }));
                        setSuccessMessage("");
                      }}
                      placeholder="Ex: Uso interno / ajuste / perda"
                      className="h-12 rounded-2xl border-zinc-300 bg-white shadow-sm"
                    />
                  </div>
                </div>

                {successMessage ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {successMessage}
                  </div>
                ) : null}

                {errorMessage ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl border-zinc-300 bg-white px-5 font-medium text-zinc-800 hover:bg-zinc-100"
                    onClick={handleLaunchAgain}
                    disabled={saving}
                  >
                    Lançar novamente
                  </Button>

                  <Button
                    className="h-11 rounded-2xl bg-zinc-950 px-5 font-semibold text-white shadow-sm hover:bg-zinc-800"
                    onClick={() => setConfirmOpen(true)}
                    disabled={!canSubmit}
                  >
                    {saving ? "Salvando..." : "Salvar saída"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={premiumCardClass("overflow-hidden")}>
          <CardHeader className="border-b border-zinc-100 bg-gradient-to-r from-white via-amber-50/25 to-white pb-4">
            <CardTitle className="text-zinc-950">Resumo da operação</CardTitle>
            <p className="text-sm text-zinc-500">
              Confira o saldo final antes de confirmar a baixa.
            </p>
          </CardHeader>

          <CardContent className="space-y-4 p-6">
            <div className="rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 to-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <p className="text-sm text-zinc-500">Produto selecionado</p>
              <p className="mt-2 text-lg font-semibold text-zinc-950">
                {selectedProduct?.nome ?? "Nenhum produto selecionado"}
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Tipo: {selectedType?.nome ?? "Não selecionado"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className={summaryMiniCardClass()}>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Estoque atual</p>
                <p className="mt-3 text-3xl font-bold text-zinc-950">{estoqueAtual}</p>
              </div>

              <div
                className={summaryMiniCardClass(
                  saidaInvalida || ficaraNegativo
                    ? "border-red-200 bg-gradient-to-br from-red-50 to-white"
                    : "border-amber-200 bg-gradient-to-br from-amber-50 to-white"
                )}
              >
                <p
                  className={cn(
                    "text-xs uppercase tracking-[0.18em]",
                    saidaInvalida || ficaraNegativo ? "text-red-700" : "text-amber-700"
                  )}
                >
                  Estoque após saída
                </p>
                <p
                  className={cn(
                    "mt-3 text-3xl font-bold",
                    saidaInvalida || ficaraNegativo ? "text-red-700" : "text-amber-700"
                  )}
                >
                  {selectedProduct ? estoqueProjetado : "-"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className={summaryMiniCardClass()}>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Quantidade informada
                </p>
                <p className="mt-3 text-2xl font-semibold text-zinc-950">
                  {quantidadeSaida || 0}
                </p>
              </div>

              <div className={summaryMiniCardClass()}>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Disponível para saída
                </p>
                <p className="mt-3 text-2xl font-semibold text-zinc-950">{estoqueAtual}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200/80 bg-zinc-50/70 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-900">
                  Últimas movimentações do produto
                </p>
                {historyLoading ? (
                  <span className="text-xs text-zinc-500">Atualizando...</span>
                ) : null}
              </div>

              {!form.produto_id ? (
                <p className="text-sm text-zinc-500">
                  Selecione um produto para ver o histórico recente.
                </p>
              ) : recentMovements.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhuma movimentação recente encontrada.</p>
              ) : (
                <div className="space-y-2">
                  {recentMovements.map((item) => {
                    const isEntrada =
                      (item.natureza ?? "").toLowerCase().includes("entrada") ||
                      item.tipo.toLowerCase().includes("entrada") ||
                      item.tipo.toLowerCase().includes("compra");

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-zinc-900">
                              {item.tipo}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {new Date(item.data).toLocaleString("pt-BR")}
                            </p>
                          </div>

                          <Badge
                            className={
                              isEntrada
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                                : "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
                            }
                          >
                            {item.quantidade}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <AdminClearDataCard
              isAdmin={isAdmin}
              target="saidas"
              title="Limpar saídas"
              description="Remove todos os registros de saída cadastrados no sistema. Os produtos permanecem cadastrados, mas o histórico de saída será apagado."
              confirmationText="LIMPAR SAIDAS"
              onCleared={onCreated}
            />
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="w-[95vw] max-w-md overflow-hidden rounded-3xl border-zinc-200 bg-white p-0">
          <DialogHeader className="border-b border-zinc-100 bg-gradient-to-r from-white via-amber-50/30 to-white px-6 py-5">
            <DialogTitle className="text-zinc-950">Confirmar saída</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5">
            <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5">
              <p className="text-sm font-medium text-zinc-950">
                Confirma o lançamento desta saída no estoque?
              </p>

              <div className="mt-4 space-y-2 text-sm text-zinc-700">
                <p>
                  <span className="font-semibold">Produto:</span> {selectedProduct?.nome ?? "-"}
                </p>
                <p>
                  <span className="font-semibold">Tipo:</span> {selectedType?.nome ?? "-"}
                </p>
                <p>
                  <span className="font-semibold">Quantidade:</span> {quantidadeSaida}
                </p>
                <p>
                  <span className="font-semibold">Estoque atual:</span> {estoqueAtual}
                </p>
                <p>
                  <span className="font-semibold">Estoque após saída:</span>{" "}
                  {selectedProduct ? estoqueProjetado : "-"}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 border-t border-zinc-100 px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="h-11 w-full rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100 sm:w-auto"
              onClick={() => setConfirmOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>

            <Button
              className="h-11 w-full rounded-2xl bg-amber-600 font-semibold text-white hover:bg-amber-700 sm:w-auto"
              onClick={handleConfirmSave}
              disabled={saving || saidaInvalida || ficaraNegativo}
            >
              {saving ? "Salvando..." : "Confirmar saída"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 


function MovementsPage({
  isAdmin,
  onCleared,
}: {
  isAdmin: boolean;
  onCleared: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [movements, setMovements] = useState<Movimentacao[]>([]);
  const [options, setOptions] = useState<{
    produtos: { id: string; nome: string }[];
    tipos: { id: string; nome: string }[];
  }>({
    produtos: [],
    tipos: [],
  });

  const [filters, setFilters] = useState({
    produto: "todos",
    tipo: "todos",
    dataInicial: "",
    dataFinal: "",
  });

  const loadFilters = useCallback(async () => {
    try {
      setFiltersLoading(true);
      setErrorMessage("");

      const data = await getFilterOptions();
      setOptions(data);
    } catch (error) {
      console.error("Erro ao carregar filtros de movimentação:", error);
      setErrorMessage("Não foi possível carregar os filtros de movimentação.");
    } finally {
      setFiltersLoading(false);
    }
  }, []);

  const loadMovements = useCallback(
    async (activeFilters?: {
      produto: string;
      tipo: string;
      dataInicial: string;
      dataFinal: string;
    }) => {
      const currentFilters = activeFilters ?? filters;

      try {
        setLoading(true);
        setErrorMessage("");

        if (
          currentFilters.dataInicial &&
          currentFilters.dataFinal &&
          currentFilters.dataFinal < currentFilters.dataInicial
        ) {
          setMovements([]);
          setErrorMessage("A data final não pode ser menor que a data inicial.");
          return;
        }

        const data = await getMovements({
          produto: currentFilters.produto !== "todos" ? currentFilters.produto : undefined,
          tipo: currentFilters.tipo !== "todos" ? currentFilters.tipo : undefined,
          dataInicial: currentFilters.dataInicial || undefined,
          dataFinal: currentFilters.dataFinal || undefined,
        });

        setMovements(data);
      } catch (error: unknown) {
        console.error("Erro ao carregar movimentações:", error);

        const message =
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error ===
            "string"
            ? (error as { response?: { data?: { error?: string } } }).response!.data!.error!
            : "Não foi possível carregar as movimentações.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    const run = async () => {
      await Promise.all([loadFilters(), loadMovements()]);
    };

    run();
  }, [loadFilters, loadMovements]);

  const handleApplyFilters = async () => {
    await loadMovements(filters);
  };

  const handleClearFilters = async () => {
    const resetFilters = {
      produto: "todos",
      tipo: "todos",
      dataInicial: "",
      dataFinal: "",
    };

    setFilters(resetFilters);
    setSearchText("");
    await loadMovements(resetFilters);
  };

  const filteredMovements = useMemo(() => {
    const term = searchText.trim().toLowerCase();

    if (!term) return movements;

    return movements.filter((item) => {
      const product = String(item.produto ?? "").toLowerCase();
      const type = String(item.tipo ?? "").toLowerCase();
      const user = String(item.usuario ?? "").toLowerCase();
      const observation = String(item.observacao ?? "").toLowerCase();
      const nature = String(item.natureza ?? "").toLowerCase();
      const nf = String(item.nota_fiscal_numero ?? "").toLowerCase();

      return (
        product.includes(term) ||
        type.includes(term) ||
        user.includes(term) ||
        observation.includes(term) ||
        nature.includes(term) ||
        nf.includes(term)
      );
    });
  }, [movements, searchText]);

  const totalMovements = filteredMovements.length;

  const totalEntradas = filteredMovements.filter((item) => {
    const natureza = (item.natureza ?? "").toLowerCase();
    const tipo = item.tipo.toLowerCase();

    return (
      natureza.includes("entrada") ||
      tipo.includes("entrada") ||
      tipo.includes("compra") ||
      tipo.includes("reposição") ||
      tipo.includes("reposicao") ||
      tipo.includes("devolução") ||
      tipo.includes("devolucao") ||
      tipo.includes("ajuste positivo")
    );
  }).length;

  const totalSaidas = filteredMovements.filter((item) => {
    const natureza = (item.natureza ?? "").toLowerCase();
    const tipo = item.tipo.toLowerCase();

    return (
      natureza.includes("saida") ||
      natureza.includes("saída") ||
      tipo.includes("saida") ||
      tipo.includes("saída") ||
      tipo.includes("venda") ||
      tipo.includes("uso") ||
      tipo.includes("perda") ||
      tipo.includes("avaria") ||
      tipo.includes("ajuste negativo")
    );
  }).length;

  function premiumCardClass(extra?: string) {
    return cn(
      "rounded-3xl border border-zinc-200/80 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]",
      extra
    );
  }

  function getNatureInfo(item: Movimentacao) {
    const natureza = (item.natureza ?? "").toLowerCase();
    const tipo = item.tipo.toLowerCase();

    const isEntrada =
      natureza.includes("entrada") ||
      tipo.includes("entrada") ||
      tipo.includes("compra") ||
      tipo.includes("reposição") ||
      tipo.includes("reposicao") ||
      tipo.includes("devolução") ||
      tipo.includes("devolucao") ||
      tipo.includes("ajuste positivo");

    if (isEntrada) {
      return {
        badgeClass:
          "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
        rowClass: "bg-emerald-50/35",
        quantityClass: "text-emerald-700 font-semibold",
        label: "Entrada",
        signal: "+",
      };
    }

    return {
      badgeClass:
        "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
      rowClass: "bg-amber-50/35",
      quantityClass: "text-amber-700 font-semibold",
      label: "Saída",
      signal: "-",
    };
  }

  function handleExportCsv() {
    try {
      setErrorMessage("");

      const rows = filteredMovements.map((item) => ({
        Data: formatDateTimeForCsv(item.data),
        Produto: item.produto,
        Tipo: item.tipo,
        Natureza: item.natureza ?? "",
        Quantidade: item.quantidade,
        Usuario: item.usuario,
        Observacao: item.observacao ?? "",
        NotaFiscal: item.nota_fiscal_numero ?? "",
        LinkNotaFiscal: item.nota_fiscal_url ?? "",
      }));

      exportCsv({
        filename: `movimentacoes_filtradas_${todayFileDate()}.csv`,
        rows,
        emptyMessage: "Não há movimentações para exportar com os filtros atuais.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível exportar as movimentações.";

      setErrorMessage(message);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total de movimentações"
          value={totalMovements}
          subtitle="Registros conforme filtros e busca"
          icon={ClipboardList}
        />
        <StatCard
          title="Entradas"
          value={totalEntradas}
          subtitle="Movimentações de entrada encontradas"
          icon={ArrowDownCircle}
        />
        <StatCard
          title="Saídas"
          value={totalSaidas}
          subtitle="Movimentações de saída encontradas"
          icon={ArrowUpCircle}
        />
      </div>

      <Card className={premiumCardClass("overflow-hidden")}>
        <CardHeader className="border-b border-zinc-100 bg-gradient-to-r from-white via-zinc-50/60 to-white pb-4">
          <CardTitle className="text-zinc-950">Filtros de movimentação</CardTitle>
          <p className="text-sm text-zinc-500">
            Refine por produto, tipo, período e encontre rapidamente qualquer lançamento.
          </p>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          {filtersLoading ? (
            <p className="text-sm text-zinc-500">Carregando filtros...</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-zinc-700">Produto</Label>
                  <Select
                    value={filters.produto}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        produto: value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-zinc-300 bg-white shadow-sm">
                      <SelectValue placeholder="Todos os produtos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os produtos</SelectItem>
                      {options.produtos.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-700">Tipo</Label>
                  <Select
                    value={filters.tipo}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        tipo: value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-zinc-300 bg-white shadow-sm">
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      {options.tipos.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-700">Data inicial</Label>
                  <Input
                    type="date"
                    value={filters.dataInicial}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dataInicial: e.target.value,
                      }))
                    }
                    className="h-12 rounded-2xl border-zinc-300 bg-white shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-700">Data final</Label>
                  <Input
                    type="date"
                    value={filters.dataFinal}
                    min={filters.dataInicial || undefined}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dataFinal: e.target.value,
                      }))
                    }
                    className="h-12 rounded-2xl border-zinc-300 bg-white shadow-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="space-y-2">
                  <Label className="text-zinc-700">Busca rápida</Label>
                  <Input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Buscar por produto, tipo, usuário, observação ou nota fiscal"
                    className="h-12 rounded-2xl border-zinc-300 bg-white shadow-sm"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100"
                    onClick={handleClearFilters}
                    disabled={loading}
                  >
                    Limpar filtros
                  </Button>

                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100"
                    onClick={() => loadMovements(filters)}
                    disabled={loading}
                  >
                    {loading ? "Atualizando..." : "Atualizar"}
                  </Button>

                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100"
                    onClick={handleExportCsv}
                    disabled={loading || filteredMovements.length === 0}
                  >
                    Exportar CSV
                  </Button>

                  <Button
                    className="h-11 rounded-2xl bg-zinc-950 font-semibold text-white hover:bg-zinc-800"
                    onClick={handleApplyFilters}
                    disabled={loading}
                  >
                    {loading ? "Filtrando..." : "Aplicar filtros"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className={premiumCardClass("overflow-hidden")}>
        <CardHeader className="border-b border-zinc-100 bg-gradient-to-r from-white via-zinc-50/60 to-white pb-4">
          <CardTitle className="text-zinc-950">Histórico de movimentações</CardTitle>
          <p className="text-sm text-zinc-500">
            Visualização consolidada das entradas e saídas com destaque visual por natureza.
          </p>
        </CardHeader>

        <CardContent className="p-6">
          {errorMessage ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {loading ? (
            <p className="text-sm text-zinc-500">Carregando movimentações...</p>
          ) : filteredMovements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 py-12 text-center text-sm text-zinc-500">
              Nenhuma movimentação encontrada com os filtros aplicados.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMovements.map((item) => {
                const nature = getNatureInfo(item);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-3xl border border-zinc-200 p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] transition",
                      nature.rowClass
                    )}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-zinc-950">{item.produto}</p>
                          <Badge className={nature.badgeClass}>{nature.label}</Badge>
                          <Badge className="border border-zinc-200 bg-white text-zinc-700 hover:bg-white">
                            {item.tipo}
                          </Badge>
                        </div>

                        <div className="mt-2 flex flex-col gap-1 text-sm text-zinc-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                          <span>{new Date(item.data).toLocaleString("pt-BR")}</span>
                          <span>Usuário: {item.usuario || "-"}</span>
                          {item.nota_fiscal_numero ? (
                            <span>
                              NF:{" "}
                              {item.nota_fiscal_url ? (
                                <a
                                  href={item.nota_fiscal_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-blue-600 hover:underline"
                                >
                                  {item.nota_fiscal_numero}
                                </a>
                              ) : (
                                item.nota_fiscal_numero
                              )}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-3 text-sm text-zinc-700">
                          {item.observacao || "Sem observação informada."}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 xl:justify-end">
                        <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-right shadow-sm backdrop-blur">
                          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                            Quantidade
                          </p>
                          <p className={cn("mt-1 text-2xl", nature.quantityClass)}>
                            {nature.signal} {item.quantidade}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

          <AdminClearDataCard
            isAdmin={isAdmin}
            target="movimentacoes"
            title="Limpar movimentações"
            description="Remove todo o histórico de movimentações, incluindo entradas e saídas registradas. Os cadastros principais permanecem."
            confirmationText="LIMPAR MOVIMENTACOES"
            onCleared={async () => {
              await loadMovements();
              await onCleared();
            }}
          />

    </div>
  );
}

function SuppliersPage({ isAdmin }: { isAdmin: boolean }) {
  type Supplier = {
    id: number;
    nome: string;
    nomeFantasia?: string | null;
    cnpj?: string | null;
    email?: string | null;
    telefone?: string | null;
    whatsapp?: string | null;
    contatoResponsavel?: string | null;
    cidade?: string | null;
    estado?: string | null;
    observacoes?: string | null;
    ativo: boolean;
  };

  type SupplierForm = {
    id: number | null;
    nome: string;
    nomeFantasia: string;
    cnpj: string;
    email: string;
    telefone: string;
    whatsapp: string;
    contatoResponsavel: string;
    cidade: string;
    estado: string;
    observacoes: string;
    ativo: boolean;
  };

  const emptySupplierForm: SupplierForm = {
    id: null,
    nome: "",
    nomeFantasia: "",
    cnpj: "",
    email: "",
    telefone: "",
    whatsapp: "",
    contatoResponsavel: "",
    cidade: "",
    estado: "",
    observacoes: "",
    ativo: true,
  };

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierForm, setSupplierForm] =
    useState<SupplierForm>(emptySupplierForm);

  const [searchSupplier, setSearchSupplier] = useState("");
  const [showInactiveSuppliers, setShowInactiveSuppliers] = useState(false);

  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [savingSupplier, setSavingSupplier] = useState(false);

  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [deleteSupplierModalOpen, setDeleteSupplierModalOpen] = useState(false);
  const [selectedSupplierToDelete, setSelectedSupplierToDelete] =
    useState<Supplier | null>(null);

  function premiumCardClass(extra?: string) {
    return cn(
      "rounded-3xl border border-zinc-200/80 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]",
      extra
    );
  }

  function normalizeText(value: string) {
    return value.trim();
  }

  function normalizeUppercaseInput(value: string) {
    return value.trim().toUpperCase();
  }

  function normalizeLowercaseInput(value: string) {
    return value.trim().toLowerCase();
  }

  function onlyDigits(value: string) {
    return value.replace(/\D/g, "");
  }

  function formatPhoneLike(value: string) {
    const digits = onlyDigits(value).slice(0, 11);

    if (digits.length <= 10) {
      return digits
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function formatCnpj(value: string) {
    return onlyDigits(value)
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  function getSupplierPayload() {
    return {
      nome: normalizeText(supplierForm.nome),
      nomeFantasia: normalizeText(supplierForm.nomeFantasia),
      cnpj: normalizeText(supplierForm.cnpj),
      email: normalizeLowercaseInput(supplierForm.email),
      telefone: normalizeText(supplierForm.telefone),
      whatsapp: normalizeText(supplierForm.whatsapp),
      contatoResponsavel: normalizeText(supplierForm.contatoResponsavel),
      cidade: normalizeText(supplierForm.cidade),
      estado: normalizeUppercaseInput(supplierForm.estado),
      observacoes: normalizeText(supplierForm.observacoes),
      ativo: supplierForm.ativo,
    };
  }

  const loadSuppliers = useCallback(async () => {
  try {
    setLoadingSuppliers(true);

    const data = await listSuppliers();

    setSuppliers(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Erro ao carregar fornecedores:", error);
    alert("Não foi possível carregar os fornecedores.");
  } finally {
    setLoadingSuppliers(false);
  }
}, []);

useEffect(() => {
  let isMounted = true;

  const timer = window.setTimeout(() => {
    if (isMounted) {
      void loadSuppliers();
    }
  }, 0);

  return () => {
    isMounted = false;
    window.clearTimeout(timer);
  };
}, [loadSuppliers]);
useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    void loadSuppliers();
  }, 0);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [loadSuppliers]);

useEffect(() => {
  let active = true;

  queueMicrotask(() => {
    if (active) {
      void loadSuppliers();
    }
  });

  return () => {
    active = false;
  };
}, [loadSuppliers]);

useEffect(() => {
  let active = true;

  queueMicrotask(() => {
    if (active) {
      void loadSuppliers();
    }
  });

  return () => {
    active = false;
  };
}, [loadSuppliers]);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const activeSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => supplier.ativo);
  }, [suppliers]);

  const supplierStats = useMemo(() => {
    const cities = new Set(
      activeSuppliers
        .map((supplier) => supplier.cidade?.trim())
        .filter(Boolean)
    );

    const states = new Set(
      activeSuppliers
        .map((supplier) => supplier.estado?.trim())
        .filter(Boolean)
    );

    return {
      total: activeSuppliers.length,
      cidades: cities.size,
      estados: states.size,
    };
  }, [activeSuppliers]);

  const filteredSuppliers = useMemo(() => {
    const search = searchSupplier.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesStatus = showInactiveSuppliers ? true : supplier.ativo;

      const searchableText = [
        supplier.nome,
        supplier.nomeFantasia,
        supplier.cnpj,
        supplier.email,
        supplier.telefone,
        supplier.whatsapp,
        supplier.contatoResponsavel,
        supplier.cidade,
        supplier.estado,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [suppliers, searchSupplier, showInactiveSuppliers]);

  function handleOpenCreateSupplier() {
    setSupplierForm(emptySupplierForm);
    setSupplierModalOpen(true);
  }

  function handleOpenEditSupplier(supplier: Supplier) {
    setSupplierForm({
      id: supplier.id,
      nome: supplier.nome ?? "",
      nomeFantasia: supplier.nomeFantasia ?? "",
      cnpj: supplier.cnpj ?? "",
      email: supplier.email ?? "",
      telefone: supplier.telefone ?? "",
      whatsapp: supplier.whatsapp ?? "",
      contatoResponsavel: supplier.contatoResponsavel ?? "",
      cidade: supplier.cidade ?? "",
      estado: supplier.estado ?? "",
      observacoes: supplier.observacoes ?? "",
      ativo: supplier.ativo,
    });

    setSupplierModalOpen(true);
  }

  function handleOpenDeleteSupplier(supplier: Supplier) {
    setSelectedSupplierToDelete(supplier);
    setDeleteSupplierModalOpen(true);
  }

  async function handleSubmitSupplier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (savingSupplier) return;

    const payload = getSupplierPayload();

    if (!payload.nome) {
      alert("Informe o nome do fornecedor.");
      return;
    }

    try {
      setSavingSupplier(true);

      if (supplierForm.id) {
        await updateSupplier(supplierForm.id, payload);
      } else {
        await createSupplier(payload);
      }

      await loadSuppliers();

      setSupplierModalOpen(false);
      setSupplierForm(emptySupplierForm);
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      alert("Não foi possível salvar o fornecedor.");
    } finally {
      setSavingSupplier(false);
    }
  }

  async function handleConfirmDeleteSupplier() {
    if (!selectedSupplierToDelete || savingSupplier) return;

    try {
      setSavingSupplier(true);

      await deleteSupplier(selectedSupplierToDelete.id);

      await loadSuppliers();

      setDeleteSupplierModalOpen(false);
      setSelectedSupplierToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
      alert(
        "Não foi possível excluir o fornecedor. Se ele estiver vinculado a produtos ou movimentações, o ideal é inativar em vez de excluir."
      );
    } finally {
      setSavingSupplier(false);
    }
  }

  async function handleToggleSupplierStatus(supplier: Supplier) {
    if (savingSupplier) return;

    try {
      setSavingSupplier(true);

      await updateSupplier(supplier.id, {
        ativo: !supplier.ativo,
      });

      await loadSuppliers();
    } catch (error) {
      console.error("Erro ao alterar status do fornecedor:", error);
      alert("Não foi possível alterar o status do fornecedor.");
    } finally {
      setSavingSupplier(false);
    }
  }

  function handleChangeSupplierForm<K extends keyof SupplierForm>(
    field: K,
    value: SupplierForm[K]
  ) {
    setSupplierForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function exportSuppliersCsv() {
    const headers = [
      "Nome",
      "Nome fantasia",
      "CNPJ",
      "E-mail",
      "Telefone",
      "WhatsApp",
      "Contato responsável",
      "Cidade",
      "Estado",
      "Status",
      "Observações",
    ];

    const rows = filteredSuppliers.map((supplier) => [
      supplier.nome ?? "",
      supplier.nomeFantasia ?? "",
      supplier.cnpj ?? "",
      supplier.email ?? "",
      supplier.telefone ?? "",
      supplier.whatsapp ?? "",
      supplier.contatoResponsavel ?? "",
      supplier.cidade ?? "",
      supplier.estado ?? "",
      supplier.ativo ? "Ativo" : "Inativo",
      supplier.observacoes ?? "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const safeValue = String(value).replace(/"/g, '""');
            return `"${safeValue}"`;
          })
          .join(";")
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "fornecedores.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Fornecedores"
          value={supplierStats.total}
          subtitle="Fornecedores ativos cadastrados"
          icon={Warehouse}
        />

        <StatCard
          title="Cidades atendidas"
          value={supplierStats.cidades}
          subtitle="Cidades com fornecedores ativos"
          icon={MapPin}
        />

        <StatCard
          title="Estados"
          value={supplierStats.estados}
          subtitle="Estados com fornecedores ativos"
          icon={MapPin}
        />
      </div>

      <div className={premiumCardClass("p-4 sm:p-5")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-950">Fornecedores</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Cadastre, edite, inative e exporte os fornecedores da oficina.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={exportSuppliersCsv}
              disabled={loadingSuppliers || filteredSuppliers.length === 0}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Exportar CSV
            </button>

            <button
              type="button"
              onClick={handleOpenCreateSupplier}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Novo fornecedor
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={searchSupplier}
            onChange={(e) => setSearchSupplier(e.target.value)}
            placeholder="Buscar por nome, fantasia, CNPJ, cidade, telefone ou e-mail"
            className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950"
          />

          <label className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={showInactiveSuppliers}
              onChange={(e) => setShowInactiveSuppliers(e.target.checked)}
              className="h-4 w-4"
            />
            Mostrar inativos
          </label>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-zinc-200">
          {loadingSuppliers ? (
            <div className="flex min-h-40 items-center justify-center text-sm text-zinc-500">
              Carregando fornecedores...
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="flex min-h-40 items-center justify-center px-4 text-center text-sm text-zinc-500">
              Nenhum fornecedor encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                      Fornecedor
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                      Contato
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                      Local
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-zinc-700">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100 bg-white">
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-zinc-50/70">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-zinc-950">
                          {supplier.nome}
                        </div>

                        {supplier.nomeFantasia ? (
                          <div className="text-xs text-zinc-500">
                            {supplier.nomeFantasia}
                          </div>
                        ) : null}

                        {supplier.cnpj ? (
                          <div className="mt-1 text-xs text-zinc-400">
                            CNPJ: {supplier.cnpj}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-zinc-600">
                        {supplier.contatoResponsavel ? (
                          <div>{supplier.contatoResponsavel}</div>
                        ) : null}

                        {supplier.telefone ? (
                          <div className="text-xs text-zinc-500">
                            Tel: {supplier.telefone}
                          </div>
                        ) : null}

                        {supplier.whatsapp ? (
                          <div className="text-xs text-zinc-500">
                            WhatsApp: {supplier.whatsapp}
                          </div>
                        ) : null}

                        {supplier.email ? (
                          <div className="text-xs text-zinc-500">
                            {supplier.email}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-zinc-600">
                        {[supplier.cidade, supplier.estado]
                          .filter(Boolean)
                          .join(" / ") || "-"}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                            supplier.ativo
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-zinc-500"
                          )}
                        >
                          {supplier.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSupplier(supplier)}
                            className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleSupplierStatus(supplier)}
                            disabled={savingSupplier}
                            className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {supplier.ativo ? "Inativar" : "Ativar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDeleteSupplier(supplier)}
                            disabled={savingSupplier}
                            className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {supplierModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-zinc-950">
                  {supplierForm.id ? "Editar fornecedor" : "Novo fornecedor"}
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Preencha os dados comerciais e de contato do fornecedor.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSupplierModalOpen(false)}
                disabled={savingSupplier}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmitSupplier} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    Nome do fornecedor
                  </label>
                  <input
                    type="text"
                    value={supplierForm.nome}
                    onChange={(e) =>
                      handleChangeSupplierForm("nome", e.target.value)
                    }
                    placeholder="Ex: Auto Peças Padre Cícero"
                    maxLength={80}
                    required
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    Nome fantasia
                  </label>
                  <input
                    type="text"
                    value={supplierForm.nomeFantasia}
                    onChange={(e) =>
                      handleChangeSupplierForm("nomeFantasia", e.target.value)
                    }
                    placeholder="Ex: Padre Cícero Distribuidora"
                    maxLength={80}
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={supplierForm.cnpj}
                    onChange={(e) =>
                      handleChangeSupplierForm("cnpj", formatCnpj(e.target.value))
                    }
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) =>
                      handleChangeSupplierForm(
                        "email",
                        e.target.value.toLowerCase()
                      )
                    }
                    placeholder="fornecedor@email.com"
                    maxLength={100}
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={supplierForm.telefone}
                    onChange={(e) =>
                      handleChangeSupplierForm(
                        "telefone",
                        formatPhoneLike(e.target.value)
                      )
                    }
                    placeholder="(84) 3333-3333"
                    maxLength={15}
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={supplierForm.whatsapp}
                    onChange={(e) =>
                      handleChangeSupplierForm(
                        "whatsapp",
                        formatPhoneLike(e.target.value)
                      )
                    }
                    placeholder="(84) 99999-9999"
                    maxLength={15}
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    Contato responsável
                  </label>
                  <input
                    type="text"
                    value={supplierForm.contatoResponsavel}
                    onChange={(e) =>
                      handleChangeSupplierForm(
                        "contatoResponsavel",
                        e.target.value
                      )
                    }
                    placeholder="Ex: João Silva"
                    maxLength={80}
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={supplierForm.cidade}
                    onChange={(e) =>
                      handleChangeSupplierForm("cidade", e.target.value)
                    }
                    placeholder="Ex: Natal"
                    maxLength={60}
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={supplierForm.estado}
                    onChange={(e) =>
                      handleChangeSupplierForm(
                        "estado",
                        e.target.value.toUpperCase().slice(0, 2)
                      )
                    }
                    placeholder="RN"
                    maxLength={2}
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm uppercase outline-none focus:border-zinc-950"
                  />
                </div>

                <label className="flex h-11 items-center gap-2 self-end rounded-2xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700">
                  <input
                    type="checkbox"
                    checked={supplierForm.ativo}
                    onChange={(e) =>
                      handleChangeSupplierForm("ativo", e.target.checked)
                    }
                    className="h-4 w-4"
                  />
                  Fornecedor ativo
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">
                  Observações
                </label>
                <textarea
                  value={supplierForm.observacoes}
                  onChange={(e) =>
                    handleChangeSupplierForm("observacoes", e.target.value)
                  }
                  placeholder="Informações adicionais sobre prazos, marcas, condições de pagamento ou observações internas."
                  maxLength={300}
                  className="min-h-28 w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSupplierModalOpen(false)}
                  disabled={savingSupplier}
                  className="h-11 rounded-2xl border border-zinc-200 px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingSupplier}
                  className="h-11 rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingSupplier ? "Salvando..." : "Salvar fornecedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteSupplierModalOpen && selectedSupplierToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <h3 className="text-lg font-bold text-zinc-950">
              Excluir fornecedor?
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
              Você está prestes a excluir o fornecedor{" "}
              <strong className="text-zinc-900">
                {selectedSupplierToDelete.nome}
              </strong>
              . Essa ação deve ser usada somente se ele não tiver vínculo com
              produtos ou movimentações.
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setDeleteSupplierModalOpen(false);
                  setSelectedSupplierToDelete(null);
                }}
                disabled={savingSupplier}
                className="h-11 rounded-2xl border border-zinc-200 px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteSupplier}
                disabled={savingSupplier}
                className="h-11 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingSupplier ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <AdminClearDataCard
        isAdmin={isAdmin}
        target="fornecedores"
        title="Limpar fornecedores"
        description="Remove todos os fornecedores cadastrados. Se houver produtos vinculados a fornecedores, a limpeza pode exigir remover produtos ou vínculos antes."
        confirmationText="LIMPAR FORNECEDORES"
        onCleared={loadSuppliers}
      />  
    </div>
  );
}

function CustomersPage({ isAdmin }: { isAdmin: boolean }) {
  type CustomerForm = {
    id: number | null;
    nome: string;
    cpf_cnpj: string;
    telefone: string;
    whatsapp: string;
    email: string;
    endereco: string;
    bairro: string;
    cidade: string;
    estado: string;
    observacoes: string;
    ativo: boolean;
  };

  const emptyCustomerForm: CustomerForm = {
    id: null,
    nome: "",
    cpf_cnpj: "",
    telefone: "",
    whatsapp: "",
    email: "",
    endereco: "",
    bairro: "",
    cidade: "",
    estado: "",
    observacoes: "",
    ativo: true,
  };

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerForm, setCustomerForm] =
    useState<CustomerForm>(emptyCustomerForm);

  const [searchCustomer, setSearchCustomer] = useState("");
  const [showInactiveCustomers, setShowInactiveCustomers] = useState(false);

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [deleteCustomerModalOpen, setDeleteCustomerModalOpen] = useState(false);
  const [selectedCustomerToDelete, setSelectedCustomerToDelete] =
    useState<Customer | null>(null);

  function premiumCardClass(extra?: string) {
    return cn(
      "rounded-3xl border border-zinc-200/80 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]",
      extra
    );
  }

  function onlyDigits(value: string) {
    return value.replace(/\D/g, "");
  }

  function normalizeText(value: string) {
    return value.trim();
  }

  function normalizeLowercaseInput(value: string) {
    return value.trim().toLowerCase();
  }

  function normalizeUppercaseInput(value: string) {
    return value.trim().toUpperCase();
  }

  function formatCpfCnpj(value: string) {
    const digits = onlyDigits(value).slice(0, 14);

    if (digits.length <= 11) {
      return digits
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2");
    }

    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  function formatPhoneLike(value: string) {
    const digits = onlyDigits(value).slice(0, 11);

    if (digits.length <= 10) {
      return digits
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function getCustomerPayload() {
    return {
      nome: normalizeText(customerForm.nome),
      cpf_cnpj: normalizeText(customerForm.cpf_cnpj),
      telefone: normalizeText(customerForm.telefone),
      whatsapp: normalizeText(customerForm.whatsapp),
      email: normalizeLowercaseInput(customerForm.email),
      endereco: normalizeText(customerForm.endereco),
      bairro: normalizeText(customerForm.bairro),
      cidade: normalizeText(customerForm.cidade),
      estado: normalizeUppercaseInput(customerForm.estado),
      observacoes: normalizeText(customerForm.observacoes),
      ativo: customerForm.ativo,
    };
  }

  const loadCustomers = useCallback(async () => {
  try {
    setLoadingCustomers(true);

    const data = await listCustomers();

    setCustomers(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
    alert("Não foi possível carregar os clientes.");
  } finally {
    setLoadingCustomers(false);
  }
}, []);

useEffect(() => {
  let isMounted = true;

  const timer = window.setTimeout(() => {
    if (isMounted) {
      void loadCustomers();
    }
  }, 0);

  return () => {
    isMounted = false;
    window.clearTimeout(timer);
  };
}, [loadCustomers]);

useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    void loadCustomers();
  }, 0);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [loadCustomers]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const activeCustomers = useMemo(() => {
    return customers.filter((customer) => customer.ativo);
  }, [customers]);

  const customerStats = useMemo(() => {
    const cities = new Set(
      activeCustomers
        .map((customer) => customer.cidade?.trim())
        .filter(Boolean)
    );

    const states = new Set(
      activeCustomers
        .map((customer) => customer.estado?.trim())
        .filter(Boolean)
    );

    return {
      total: activeCustomers.length,
      cidades: cities.size,
      estados: states.size,
    };
  }, [activeCustomers]);

  const filteredCustomers = useMemo(() => {
    const search = searchCustomer.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesStatus = showInactiveCustomers ? true : customer.ativo;

      const searchableText = [
        customer.nome,
        customer.cpf_cnpj,
        customer.telefone,
        customer.whatsapp,
        customer.email,
        customer.endereco,
        customer.bairro,
        customer.cidade,
        customer.estado,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [customers, searchCustomer, showInactiveCustomers]);

  function handleChangeCustomerForm<K extends keyof CustomerForm>(
    field: K,
    value: CustomerForm[K]
  ) {
    setCustomerForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleOpenCreateCustomer() {
    setCustomerForm(emptyCustomerForm);
    setCustomerModalOpen(true);
  }

  function handleOpenEditCustomer(customer: Customer) {
    setCustomerForm({
      id: customer.id,
      nome: customer.nome ?? "",
      cpf_cnpj: customer.cpf_cnpj ?? "",
      telefone: customer.telefone ?? "",
      whatsapp: customer.whatsapp ?? "",
      email: customer.email ?? "",
      endereco: customer.endereco ?? "",
      bairro: customer.bairro ?? "",
      cidade: customer.cidade ?? "",
      estado: customer.estado ?? "",
      observacoes: customer.observacoes ?? "",
      ativo: customer.ativo,
    });

    setCustomerModalOpen(true);
  }

  function handleOpenDeleteCustomer(customer: Customer) {
    setSelectedCustomerToDelete(customer);
    setDeleteCustomerModalOpen(true);
  }

  async function handleSubmitCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (savingCustomer) return;

    const payload = getCustomerPayload();

    if (!payload.nome) {
      alert("Informe o nome do cliente.");
      return;
    }

    try {
      setSavingCustomer(true);

      if (customerForm.id) {
        await updateCustomer(customerForm.id, payload);
      } else {
        await createCustomer(payload);
      }

      await loadCustomers();

      setCustomerModalOpen(false);
      setCustomerForm(emptyCustomerForm);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Não foi possível salvar o cliente.");
    } finally {
      setSavingCustomer(false);
    }
  }

  async function handleConfirmDeleteCustomer() {
    if (!selectedCustomerToDelete || savingCustomer) return;

    try {
      setSavingCustomer(true);

      await deleteCustomer(selectedCustomerToDelete.id);

      await loadCustomers();

      setDeleteCustomerModalOpen(false);
      setSelectedCustomerToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      alert(
        "Não foi possível excluir o cliente. Se ele tiver vínculo com veículos ou ordens de serviço, o ideal será inativar."
      );
    } finally {
      setSavingCustomer(false);
    }
  }

  async function handleToggleCustomerStatus(customer: Customer) {
    if (savingCustomer) return;

    try {
      setSavingCustomer(true);

      await updateCustomer(customer.id, {
        ativo: !customer.ativo,
      });

      await loadCustomers();
    } catch (error) {
      console.error("Erro ao alterar status do cliente:", error);
      alert("Não foi possível alterar o status do cliente.");
    } finally {
      setSavingCustomer(false);
    }
  }

  function exportCustomersCsv() {
    const headers = [
      "Nome",
      "CPF/CNPJ",
      "Telefone",
      "WhatsApp",
      "E-mail",
      "Endereço",
      "Bairro",
      "Cidade",
      "Estado",
      "Status",
      "Observações",
    ];

    const rows = filteredCustomers.map((customer) => [
      customer.nome ?? "",
      customer.cpf_cnpj ?? "",
      customer.telefone ?? "",
      customer.whatsapp ?? "",
      customer.email ?? "",
      customer.endereco ?? "",
      customer.bairro ?? "",
      customer.cidade ?? "",
      customer.estado ?? "",
      customer.ativo ? "Ativo" : "Inativo",
      customer.observacoes ?? "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const safeValue = String(value).replace(/"/g, '""');
            return `"${safeValue}"`;
          })
          .join(";")
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "clientes.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Clientes"
          value={customerStats.total}
          subtitle="Clientes ativos cadastrados"
          icon={UsersRound}
        />

        <StatCard
          title="Cidades"
          value={customerStats.cidades}
          subtitle="Cidades com clientes ativos"
          icon={MapPin}
        />

        <StatCard
          title="Estados"
          value={customerStats.estados}
          subtitle="Estados com clientes ativos"
          icon={IdCard}
        />
      </div>

      <div className={premiumCardClass("p-4 sm:p-5")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-950">Clientes</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Cadastre, edite, inative e exporte os clientes da oficina.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={exportCustomersCsv}
              disabled={loadingCustomers || filteredCustomers.length === 0}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Exportar CSV
            </button>

            <button
              type="button"
              onClick={handleOpenCreateCustomer}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Novo cliente
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
            placeholder="Buscar por nome, CPF/CNPJ, telefone, cidade ou e-mail"
            className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950"
          />

          <label className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={showInactiveCustomers}
              onChange={(e) => setShowInactiveCustomers(e.target.checked)}
              className="h-4 w-4"
            />
            Mostrar inativos
          </label>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-zinc-200">
          {loadingCustomers ? (
            <div className="flex min-h-40 items-center justify-center text-sm text-zinc-500">
              Carregando clientes...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex min-h-40 items-center justify-center px-4 text-center text-sm text-zinc-500">
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                      Contato
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                      Endereço
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-zinc-700">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100 bg-white">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-zinc-50/70">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-zinc-950">
                          {customer.nome}
                        </div>

                        {customer.cpf_cnpj ? (
                          <div className="mt-1 text-xs text-zinc-500">
                            CPF/CNPJ: {customer.cpf_cnpj}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-zinc-600">
                        {customer.telefone ? (
                          <div className="text-xs text-zinc-500">
                            Tel: {customer.telefone}
                          </div>
                        ) : null}

                        {customer.whatsapp ? (
                          <div className="text-xs text-zinc-500">
                            WhatsApp: {customer.whatsapp}
                          </div>
                        ) : null}

                        {customer.email ? (
                          <div className="text-xs text-zinc-500">
                            {customer.email}
                          </div>
                        ) : null}

                        {!customer.telefone &&
                        !customer.whatsapp &&
                        !customer.email ? (
                          <div className="text-xs text-zinc-400">-</div>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-zinc-600">
                        {customer.endereco ? (
                          <div>{customer.endereco}</div>
                        ) : null}

                        {[customer.bairro, customer.cidade, customer.estado]
                          .filter(Boolean)
                          .join(" / ") || "-"}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                            customer.ativo
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-zinc-500"
                          )}
                        >
                          {customer.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCustomer(customer)}
                            className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleCustomerStatus(customer)}
                            disabled={savingCustomer}
                            className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {customer.ativo ? "Inativar" : "Ativar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDeleteCustomer(customer)}
                            disabled={savingCustomer}
                            className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {customerModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-zinc-950">
                  {customerForm.id ? "Editar cliente" : "Novo cliente"}
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Preencha os dados cadastrais e de contato do cliente.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCustomerModalOpen(false)}
                disabled={savingCustomer}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmitCustomer} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    Nome do cliente
                  </label>

                  <input
                    type="text"
                    value={customerForm.nome}
                    onChange={(e) =>
                      handleChangeCustomerForm("nome", e.target.value)
                    }
                    placeholder="Ex: João da Silva"
                    maxLength={100}
                    required
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    CPF/CNPJ
                  </label>

                  <input
                    type="text"
                    value={customerForm.cpf_cnpj}
                    onChange={(e) =>
                      handleChangeCustomerForm(
                        "cpf_cnpj",
                        formatCpfCnpj(e.target.value)
                      )
                    }
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    maxLength={18}
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    Telefone
                  </label>

                  <input
                    type="text"
                    value={customerForm.telefone}
                    onChange={(e) =>
                      handleChangeCustomerForm(
                        "telefone",
                        formatPhoneLike(e.target.value)
                      )
                    }
                    placeholder="(84) 3333-3333"
                    maxLength={15}
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    WhatsApp
                  </label>

                  <input
                    type="text"
                    value={customerForm.whatsapp}
                    onChange={(e) =>
                      handleChangeCustomerForm(
                        "whatsapp",
                        formatPhoneLike(e.target.value)
                      )
                    }
                    placeholder="(84) 99999-9999"
                    maxLength={15}
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    E-mail
                  </label>

                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) =>
                      handleChangeCustomerForm(
                        "email",
                        e.target.value.toLowerCase()
                      )
                    }
                    placeholder="cliente@email.com"
                    maxLength={100}
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    Endereço
                  </label>

                  <input
                    type="text"
                    value={customerForm.endereco}
                    onChange={(e) =>
                      handleChangeCustomerForm("endereco", e.target.value)
                    }
                    placeholder="Rua, avenida, número"
                    maxLength={120}
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    Bairro
                  </label>

                  <input
                    type="text"
                    value={customerForm.bairro}
                    onChange={(e) =>
                      handleChangeCustomerForm("bairro", e.target.value)
                    }
                    placeholder="Ex: Centro"
                    maxLength={80}
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    Cidade
                  </label>

                  <input
                    type="text"
                    value={customerForm.cidade}
                    onChange={(e) =>
                      handleChangeCustomerForm("cidade", e.target.value)
                    }
                    placeholder="Ex: Natal"
                    maxLength={80}
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-800">
                    Estado
                  </label>

                  <input
                    type="text"
                    value={customerForm.estado}
                    onChange={(e) =>
                      handleChangeCustomerForm(
                        "estado",
                        e.target.value.toUpperCase().slice(0, 2)
                      )
                    }
                    placeholder="RN"
                    maxLength={2}
                    className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm uppercase outline-none focus:border-zinc-950"
                  />
                </div>

                <label className="flex h-11 items-center gap-2 self-end rounded-2xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700">
                  <input
                    type="checkbox"
                    checked={customerForm.ativo}
                    onChange={(e) =>
                      handleChangeCustomerForm("ativo", e.target.checked)
                    }
                    className="h-4 w-4"
                  />
                  Cliente ativo
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">
                  Observações
                </label>

                <textarea
                  value={customerForm.observacoes}
                  onChange={(e) =>
                    handleChangeCustomerForm("observacoes", e.target.value)
                  }
                  placeholder="Observações internas sobre o cliente."
                  maxLength={300}
                  className="min-h-28 w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCustomerModalOpen(false)}
                  disabled={savingCustomer}
                  className="h-11 rounded-2xl border border-zinc-200 px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="h-11 rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingCustomer ? "Salvando..." : "Salvar cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteCustomerModalOpen && selectedCustomerToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <h3 className="text-lg font-bold text-zinc-950">
              Excluir cliente?
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
              Você está prestes a excluir o cliente{" "}
              <strong className="text-zinc-900">
                {selectedCustomerToDelete.nome}
              </strong>
              . Essa ação deve ser usada somente se ele ainda não possuir
              veículos ou ordens de serviço vinculadas.
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setDeleteCustomerModalOpen(false);
                  setSelectedCustomerToDelete(null);
                }}
                disabled={savingCustomer}
                className="h-11 rounded-2xl border border-zinc-200 px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteCustomer}
                disabled={savingCustomer}
                className="h-11 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingCustomer ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <AdminClearDataCard
          isAdmin={isAdmin}
          target="clientes"
          title="Limpar clientes"
          description="Remove todos os clientes cadastrados. Se futuramente houver veículos ou ordens de serviço vinculadas, pode ser necessário limpar esses vínculos antes."
          confirmationText="LIMPAR CLIENTES"
          onCleared={loadCustomers}
        />
    </div>
  );
}

function ReportsPage({
  products,
  movements,
}: {
  products: Produto[];
  movements: Movimentacao[];
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [periodoInicial, setPeriodoInicial] = useState("");
  const [periodoFinal, setPeriodoFinal] = useState("");

  function premiumCardClass(extra?: string) {
    return cn(
      "rounded-3xl border border-zinc-200/80 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]",
      extra
    );
  }

  const lowStockProducts = useMemo(() => {
    return products.filter((item) => item.status === "baixo");
  }, [products]);

  const filteredMovementsByPeriod = useMemo(() => {
    return movements.filter((item) => {
      const movementDate = new Date(item.data);
      if (Number.isNaN(movementDate.getTime())) return false;

      const inicioValido = periodoInicial
        ? movementDate >= new Date(`${periodoInicial}T00:00:00`)
        : true;

      const fimValido = periodoFinal
        ? movementDate <= new Date(`${periodoFinal}T23:59:59`)
        : true;

      return inicioValido && fimValido;
    });
  }, [movements, periodoInicial, periodoFinal]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, item) => {
      return acc + Number(item.estoqueAtual ?? 0) * Number(item.preco ?? 0);
    }, 0);
  }, [products]);

  async function handleExportLowStock() {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const rows = lowStockProducts.map((item) => ({
        Codigo: item.codigo,
        Produto: item.nome,
        Categoria: item.categoria,
        Marca: item.marca,
        Fornecedor: item.fornecedor,
        Localizacao: item.localizacao,
        EstoqueAtual: item.estoqueAtual,
        PrecoUnitario: formatCurrencyForCsv(item.preco),
        ValorTotal: formatCurrencyForCsv(Number(item.estoqueAtual ?? 0) * Number(item.preco ?? 0)),
        Status: item.status,
      }));

      exportCsv({
        filename: `relatorio_estoque_baixo_${todayFileDate()}.csv`,
        rows,
        emptyMessage: "Não há produtos com estoque baixo para exportar.",
      });

      setSuccessMessage("Relatório de estoque baixo exportado com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível exportar o relatório de estoque baixo.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportInventory() {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const rows = products.map((item) => ({
        Codigo: item.codigo,
        Produto: item.nome,
        Categoria: item.categoria,
        Marca: item.marca,
        Fornecedor: item.fornecedor,
        Localizacao: item.localizacao,
        EstoqueAtual: item.estoqueAtual,
        PrecoUnitario: formatCurrencyForCsv(item.preco),
        ValorTotal: formatCurrencyForCsv(Number(item.estoqueAtual ?? 0) * Number(item.preco ?? 0)),
        Status: item.status,
      }));

      exportCsv({
        filename: `relatorio_inventario_atual_${todayFileDate()}.csv`,
        rows,
        emptyMessage: "Não há produtos disponíveis para exportar.",
      });

      setSuccessMessage("Relatório de inventário atual exportado com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível exportar o inventário atual.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportMovementsByPeriod() {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (periodoInicial && periodoFinal && periodoFinal < periodoInicial) {
        setErrorMessage("A data final não pode ser menor que a data inicial.");
        return;
      }

      const rows = filteredMovementsByPeriod.map((item) => ({
        Data: formatDateTimeForCsv(item.data),
        Produto: item.produto,
        Tipo: item.tipo,
        Natureza: item.natureza ?? "",
        Quantidade: item.quantidade,
        Usuario: item.usuario,
        Observacao: item.observacao ?? "",
        NotaFiscal: item.nota_fiscal_numero ?? "",
        LinkNotaFiscal: item.nota_fiscal_url ?? "",
      }));

      exportCsv({
        filename: `relatorio_movimentacoes_periodo_${todayFileDate()}.csv`,
        rows,
        emptyMessage: "Não há movimentações no período informado.",
      });

      setSuccessMessage("Relatório de movimentações por período exportado com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível exportar o relatório de movimentações.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Produtos em alerta"
          value={lowStockProducts.length}
          subtitle="Itens abaixo do estoque mínimo"
          icon={TriangleAlert}
        />
        <StatCard
          title="Produtos no inventário"
          value={products.length}
          subtitle="Base total disponível para exportação"
          icon={Package}
        />
        <StatCard
          title="Valor estimado em estoque"
          value={`R$ ${totalInventoryValue.toFixed(2)}`}
          subtitle="Cálculo com base em estoque x preço"
          icon={BarChart3}
        />
      </div>

      <Card className={premiumCardClass("overflow-hidden")}>
        <CardHeader className="border-b border-zinc-100 bg-gradient-to-r from-white via-zinc-50/60 to-white pb-4">
          <CardTitle className="text-zinc-950">Relatórios</CardTitle>
          <p className="text-sm text-zinc-500">
            Exporte relatórios operacionais do sistema com padrão único.
          </p>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-white to-zinc-50/60 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-950">Estoque baixo</h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      Lista dos itens abaixo do mínimo.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-red-100 bg-red-50 p-3">
                    <TriangleAlert className="h-5 w-5 text-red-600" />
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Itens em alerta</p>
                  <p className="mt-2 text-2xl font-bold text-zinc-950">
                    {lowStockProducts.length}
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="mt-5 w-full rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100"
                  onClick={handleExportLowStock}
                  disabled={loading}
                >
                  {loading ? "Exportando..." : "Exportar relatório"}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-white to-zinc-50/60 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-950">Inventário atual</h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      Resumo consolidado do estoque disponível.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
                    <Warehouse className="h-5 w-5 text-amber-600" />
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Produtos</p>
                  <p className="mt-2 text-2xl font-bold text-zinc-950">{products.length}</p>
                </div>

                <Button
                  variant="outline"
                  className="mt-5 w-full rounded-2xl border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100"
                  onClick={handleExportInventory}
                  disabled={loading}
                >
                  {loading ? "Exportando..." : "Exportar relatório"}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-white to-zinc-50/60 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-950">
                      Movimentações por período
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      Entradas, saídas e ajustes por data.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                    <ClipboardList className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="space-y-2">
                    <Label>Data inicial</Label>
                    <Input
                      type="date"
                      value={periodoInicial}
                      onChange={(e) => setPeriodoInicial(e.target.value)}
                      className="h-11 rounded-2xl border-zinc-300 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data final</Label>
                    <Input
                      type="date"
                      value={periodoFinal}
                      min={periodoInicial || undefined}
                      onChange={(e) => setPeriodoFinal(e.target.value)}
                      className="h-11 rounded-2xl border-zinc-300 bg-white"
                    />
                  </div>
                </div>

                <Button
                  className="mt-5 w-full rounded-2xl bg-zinc-950 font-semibold text-white hover:bg-zinc-800"
                  onClick={handleExportMovementsByPeriod}
                  disabled={loading}
                >
                  {loading ? "Exportando..." : "Exportar relatório"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const EMPTY_PRODUCT_FORM: CreateProductPayload = {
  codigo: "",
  nome: "",
  descricao: "",
  categoria_id: "",
  fornecedor_principal_id: "",
  unidade_medida_id: "",
  localizacao_id: "",
  marca: "",
  sku: "",
  ncm: "",
  custo_medio: 0,
  preco_venda: 0,
  estoque_atual: 0,
  estoque_minimo: 0,
  controla_estoque: true,
  ativo: true,
};

export default function EstoqueMecanicaFrontend() {
  const router = useRouter();
  const { signOut, profile } = useAuth();

  const [page, setPage] = useState<PageKey>("dashboard");
  const [products, setProducts] = useState<Produto[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const isAdmin = profile?.perfil === "admin";
  const visiblePage: PageKey = !isAdmin && page === "usuarios" ? "dashboard" : page;

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  const refreshAll = useCallback(async () => {
    try {
      setLoadingDashboard(true);
      setLoadingProducts(true);

      const [dashboardData, productsData] = await Promise.all([
        getDashboard(),
        getProducts(),
      ]);

      setDashboard(dashboardData);
      setProducts(productsData);
    } catch (error) {
      console.error("Erro ao atualizar dados do sistema:", error);
    } finally {
      setLoadingDashboard(false);
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await refreshAll();
    };

    run();
  }, [refreshAll]);

  const titleMap: Record<PageKey, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Dashboard",
      subtitle: "Visão geral do estoque e movimentações",
    },
    produtos: {
      title: "Produtos",
      subtitle: "Cadastro, consulta, filtros e ações do estoque",
    },
    entradas: {
      title: "Entradas",
      subtitle: "Registro de reposição e compras",
    },
    saidas: {
      title: "Saídas",
      subtitle: "Baixa de itens por venda, uso ou ajuste",
    },
    movimentacoes: {
      title: "Movimentações",
      subtitle: "Histórico completo de alterações no estoque",
    },
    usuario: {
      title: "Usuário",
      subtitle: "Informações da conta atualmente logada",
    },
    usuarios: {
      title: "Usuários",
      subtitle: "Gerenciamento de acesso e primeiro login",
    },
    fornecedores: {
      title: "Fornecedores",
      subtitle: "Empresas parceiras e contatos",
    },
    relatorios: {
      title: "Relatórios",
      subtitle: "Consultas rápidas para operação e reposição",
    },
    clientes: {
      title: "Clientes",
      subtitle: "Cadastro e gerenciamento dos clientes da oficina",
    },
  };

const renderPage = () => {
  switch (visiblePage) {
    case "produtos":
      return (
        <ProductsPage
          products={products}
          loading={loadingProducts}
          onCreated={refreshAll}
          isAdmin={isAdmin}
        />
      );

    case "entradas":
      return <EntriesPage onCreated={refreshAll} isAdmin={isAdmin} />;

    case "saidas":
      return <OutputsPage onCreated={refreshAll} isAdmin={isAdmin} />;

    case "movimentacoes":
      return <MovementsPage isAdmin={isAdmin} onCleared={refreshAll} />;

    case "usuario":
      return <UserPage onLogout={handleLogout} />;

    case "clientes":
      return <CustomersPage isAdmin={isAdmin} />;

    case "fornecedores":
      return <SuppliersPage isAdmin={isAdmin} />;

    case "relatorios":
      return (
        <ReportsPage
          products={products}
          movements={dashboard?.ultimasMovimentacoes ?? []}
        />
      );

    case "usuarios":
      return isAdmin ? (
        <UsersPage />
      ) : (
        <DashboardPage dashboard={dashboard} loading={loadingDashboard} />
      );

    default:
      return <DashboardPage dashboard={dashboard} loading={loadingDashboard} />;
  }
};

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-zinc-900">
      <div className="flex min-h-screen">
        <Sidebar page={visiblePage} setPage={setPage} isAdmin={isAdmin} />

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <AppHeader
            title={titleMap[visiblePage].title}
            subtitle={titleMap[visiblePage].subtitle}
            page={visiblePage}
            setPage={setPage}
            isAdmin={isAdmin}
          />

          {renderPage()}
        </main>
      </div>
    </div>
  );
}
