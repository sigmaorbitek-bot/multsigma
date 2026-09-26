import { supabase } from "./supabase";

function validarEmpresaId(empresaId) {
  if (!empresaId) {
    throw new Error("Empresa não informada.");
  }
}

export async function listarCategorias(empresaId) {
  validarEmpresaId(empresaId);

  const { data, error } = await supabase
    .from("categorias")
    .select("id, nome, ativo")
    .eq("empresa_id", empresaId)
    .eq("ativo", true)
    .order("nome");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function criarCategoria({ empresaId, nome }) {
  validarEmpresaId(empresaId);

  const nomeLimpo = nome?.trim();

  if (!nomeLimpo) {
    throw new Error("Informe o nome da categoria.");
  }

  if (nomeLimpo.length > 120) {
    throw new Error(
      "O nome da categoria deve possuir no máximo 120 caracteres.",
    );
  }

  const { data, error } = await supabase
    .from("categorias")
    .insert({
      empresa_id: empresaId,
      nome: nomeLimpo,
    })
    .select("id, nome, ativo")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Já existe uma categoria com esse nome.");
    }

    throw error;
  }

  return data;
}
