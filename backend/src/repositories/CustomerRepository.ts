import { supabase } from "../utils/supabase";

export type CustomerCreateInput = {
  nome: string;
  cpf_cnpj?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  observacoes?: string | null;
  ativo?: boolean;
};

export type CustomerUpdateInput = Partial<CustomerCreateInput>;

export class CustomerRepository {
  async list() {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  async findById(id: number) {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async create(data: CustomerCreateInput) {
    const { data: createdCustomer, error } = await supabase
      .from("clientes")
      .insert({
        nome: data.nome,
        cpf_cnpj: data.cpf_cnpj ?? null,
        telefone: data.telefone ?? null,
        whatsapp: data.whatsapp ?? null,
        email: data.email ?? null,
        endereco: data.endereco ?? null,
        bairro: data.bairro ?? null,
        cidade: data.cidade ?? null,
        estado: data.estado ?? null,
        observacoes: data.observacoes ?? null,
        ativo: data.ativo ?? true,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return createdCustomer;
  }

  async update(id: number, data: CustomerUpdateInput) {
    const { data: updatedCustomer, error } = await supabase
      .from("clientes")
      .update({
        ...data,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return updatedCustomer;
  }

  async delete(id: number) {
    const { error } = await supabase.from("clientes").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return {
      message: "Cliente excluído com sucesso.",
    };
  }
}