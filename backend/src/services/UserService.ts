import { UserRepository } from "../repositories/UserRepository";

type CreateUserInput = {
  nome: string;
  email: string;
  perfil: string;
  senha_temporaria: string;
  ativo?: boolean;
};

type UpdateUserInput = {
  nome?: string;
  perfil?: string;
  ativo?: boolean;
  precisa_trocar_senha?: boolean;
  nova_senha_temporaria?: string;
};

function normalizarPerfil(perfil?: string) {
  const valor = (perfil ?? "").trim().toLowerCase();

  if (valor === "admin") return "admin";
  if (valor === "usuario") return "usuario";

  throw new Error("Perfil inválido. Use apenas 'admin' ou 'usuario'.");
}

export class UserService {
  private repository = new UserRepository();

  async list() {
    return this.repository.findAll();
  }

  async me(authUserId?: string, email?: string) {
    if (!authUserId && !email) {
      throw new Error("Usuário autenticado não identificado.");
    }

    return this.repository.findMe(authUserId, email);
  }

  async create(data: CreateUserInput) {
    if (!data.nome?.trim()) throw new Error("Nome é obrigatório.");
    if (!data.email?.trim()) throw new Error("E-mail é obrigatório.");
    if (!data.perfil?.trim()) throw new Error("Perfil é obrigatório.");
    if (!data.senha_temporaria?.trim()) throw new Error("Senha temporária é obrigatória.");
    if (data.senha_temporaria.trim().length < 6) {
      throw new Error("A senha temporária deve ter pelo menos 6 caracteres.");
    }

    return this.repository.create({
      ...data,
      nome: data.nome.trim(),
      email: data.email.trim().toLowerCase(),
      perfil: normalizarPerfil(data.perfil),
      senha_temporaria: data.senha_temporaria.trim(),
      ativo: data.ativo ?? true,
    });
  }

  async update(userId: string, data: UpdateUserInput) {
    if (!userId) throw new Error("ID do usuário é obrigatório.");

    if (typeof data.nome === "string" && !data.nome.trim()) {
      throw new Error("Nome inválido.");
    }

    if (typeof data.perfil === "string" && !data.perfil.trim()) {
      throw new Error("Perfil inválido.");
    }

    if (data.nova_senha_temporaria && data.nova_senha_temporaria.trim().length < 6) {
      throw new Error("A nova senha temporária deve ter pelo menos 6 caracteres.");
    }

    return this.repository.update(userId, {
      ...data,
      nome: typeof data.nome === "string" ? data.nome.trim() : data.nome,
      perfil: typeof data.perfil === "string" ? normalizarPerfil(data.perfil) : data.perfil,
      nova_senha_temporaria: data.nova_senha_temporaria?.trim(),
    });
  }

  async finalizeFirstAccess(authUserId?: string, email?: string) {
    if (!authUserId && !email) {
      throw new Error("Usuário autenticado não identificado.");
    }

    return this.repository.finalizeFirstAccess(authUserId || "", email);
  }
}