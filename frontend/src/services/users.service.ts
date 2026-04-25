import { api } from "../lib/api";
import type { CreateUserPayload, UpdateUserPayload, UsuarioSistema } from "../types";

export async function getUsers() {
  const response = await api.get<UsuarioSistema[]>("/usuarios");
  return response.data;
}

export async function getMe() {
  const response = await api.get<UsuarioSistema | null>("/usuarios/me");
  return response.data;
}

export async function createUser(payload: CreateUserPayload) {
  const response = await api.post<UsuarioSistema>("/usuarios", payload);
  return response.data;
}

export async function updateUser(userId: string, payload: UpdateUserPayload) {
  const response = await api.patch<UsuarioSistema>(`/usuarios/${userId}`, payload);
  return response.data;
}

export async function finalizeFirstAccessWithToken(token: string) {
  const response = await api.post<UsuarioSistema>(
    "/usuarios/finalizar-primeiro-acesso",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}