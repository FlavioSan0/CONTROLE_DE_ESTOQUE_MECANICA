import { supabase } from "../utils/supabase";

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

export class UserRepository {
  async findAll() {
    const { data, error } = await supabase
      .from("usuarios")
      .select(`
        id,
        auth_user_id,
        nome,
        email,
        perfil,
        ativo,
        precisa_trocar_senha,
        created_at,
        updated_at
      `)
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar usuários: ${error.message}`);
    }

    return (data ?? []).map((item) => ({
      id: String(item.id),
      auth_user_id: item.auth_user_id ? String(item.auth_user_id) : null,
      nome: String(item.nome ?? ""),
      email: String(item.email ?? ""),
      perfil: String(item.perfil ?? "usuario"),
      ativo: Boolean(item.ativo),
      precisa_trocar_senha: Boolean(item.precisa_trocar_senha),
      created_at: item.created_at ?? null,
      updated_at: item.updated_at ?? null,
    }));
  }

  async findMe(authUserId?: string, email?: string) {
    if (!authUserId && !email) {
      throw new Error("Usuário não identificado.");
    }

    const normalizedEmail = email?.trim().toLowerCase();

    if (authUserId) {
      const authRes = await supabase
        .from("usuarios")
        .select(`
          id,
          auth_user_id,
          nome,
          email,
          perfil,
          ativo,
          precisa_trocar_senha,
          created_at,
          updated_at
        `)
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (authRes.error) {
        throw new Error(`Erro ao buscar usuário por auth_user_id: ${authRes.error.message}`);
      }

      if (authRes.data) {
        return authRes.data;
      }
    }

    if (normalizedEmail) {
      const emailRes = await supabase
        .from("usuarios")
        .select(`
          id,
          auth_user_id,
          nome,
          email,
          perfil,
          ativo,
          precisa_trocar_senha,
          created_at,
          updated_at
        `)
        .ilike("email", normalizedEmail)
        .maybeSingle();

      if (emailRes.error) {
        throw new Error(`Erro ao buscar usuário por email: ${emailRes.error.message}`);
      }

      if (!emailRes.data) {
        return null;
      }

      if ((!emailRes.data.auth_user_id || emailRes.data.auth_user_id !== authUserId) && authUserId) {
        const linkRes = await supabase
          .from("usuarios")
          .update({
            auth_user_id: authUserId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", emailRes.data.id)
          .select(`
            id,
            auth_user_id,
            nome,
            email,
            perfil,
            ativo,
            precisa_trocar_senha,
            created_at,
            updated_at
          `)
          .single();

        if (linkRes.error) {
          throw new Error(`Erro ao vincular auth_user_id: ${linkRes.error.message}`);
        }

        return linkRes.data;
      }

      return emailRes.data;
    }

    return null;
  }

  async create(input: CreateUserInput) {
    const email = input.email.trim().toLowerCase();

    const existingUser = await supabase
      .from("usuarios")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (existingUser.data) {
      throw new Error("Já existe um usuário cadastrado com esse e-mail.");
    }

    const authCreate = await supabase.auth.admin.createUser({
      email,
      password: input.senha_temporaria,
      email_confirm: true,
      user_metadata: {
        nome: input.nome,
      },
    });

    if (authCreate.error || !authCreate.data.user) {
      throw new Error(authCreate.error?.message || "Não foi possível criar o usuário no Auth.");
    }

    const authUserId = authCreate.data.user.id;

    const insertResponse = await supabase
      .from("usuarios")
      .insert({
        auth_user_id: authUserId,
        nome: input.nome,
        email,
        perfil: input.perfil,
        ativo: input.ativo ?? true,
        precisa_trocar_senha: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertResponse.error) {
      await supabase.auth.admin.deleteUser(authUserId);
      throw new Error(`Erro ao salvar usuário na tabela usuarios: ${insertResponse.error.message}`);
    }

    return insertResponse.data;
  }

  async update(userId: string, input: UpdateUserInput) {
    const currentResponse = await supabase
      .from("usuarios")
      .select("id, auth_user_id, nome, email, perfil, ativo, precisa_trocar_senha")
      .eq("id", userId)
      .single();

    if (currentResponse.error || !currentResponse.data) {
      throw new Error("Usuário não encontrado.");
    }

    const currentUser = currentResponse.data;

    if (input.nova_senha_temporaria) {
      if (!currentUser.auth_user_id) {
        throw new Error("Usuário sem vínculo com o Auth do Supabase.");
      }

      const authUpdate = await supabase.auth.admin.updateUserById(currentUser.auth_user_id, {
        password: input.nova_senha_temporaria,
      });

      if (authUpdate.error) {
        throw new Error(`Erro ao redefinir senha do usuário: ${authUpdate.error.message}`);
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof input.nome === "string") updatePayload.nome = input.nome;
    if (typeof input.perfil === "string") updatePayload.perfil = input.perfil;
    if (typeof input.ativo === "boolean") updatePayload.ativo = input.ativo;
    if (typeof input.precisa_trocar_senha === "boolean") {
      updatePayload.precisa_trocar_senha = input.precisa_trocar_senha;
    }

    if (input.nova_senha_temporaria) {
      updatePayload.precisa_trocar_senha = true;
    }

    const updateResponse = await supabase
      .from("usuarios")
      .update(updatePayload)
      .eq("id", userId)
      .select()
      .single();

    if (updateResponse.error) {
      throw new Error(`Erro ao atualizar usuário: ${updateResponse.error.message}`);
    }

    return updateResponse.data;
  }

  async finalizeFirstAccess(authUserId: string, email?: string) {
    if (!authUserId && !email) {
      throw new Error("Usuário não identificado para finalizar o primeiro acesso.");
    }

    let query = supabase
      .from("usuarios")
      .update({
        precisa_trocar_senha: false,
        auth_user_id: authUserId || undefined,
        updated_at: new Date().toISOString(),
      })
      .select("id, auth_user_id, email, precisa_trocar_senha");

    if (authUserId) {
      query = query.eq("auth_user_id", authUserId);
    } else if (email) {
      query = query.ilike("email", email.toLowerCase());
    }

    const { data, error } = await query.maybeSingle();

    if (!data && email) {
      const fallback = await supabase
        .from("usuarios")
        .update({
          precisa_trocar_senha: false,
          auth_user_id: authUserId || undefined,
          updated_at: new Date().toISOString(),
        })
        .ilike("email", email.toLowerCase())
        .select("id, auth_user_id, email, precisa_trocar_senha")
        .maybeSingle();

      if (fallback.error) {
        throw new Error(`Erro ao finalizar primeiro acesso: ${fallback.error.message}`);
      }

      if (!fallback.data) {
        throw new Error("Usuário não encontrado para finalizar o primeiro acesso.");
      }

      return fallback.data;
    }

    if (error) {
      throw new Error(`Erro ao finalizar primeiro acesso: ${error.message}`);
    }

    if (!data) {
      throw new Error("Usuário não encontrado para finalizar o primeiro acesso.");
    }

    return data;
  }
}