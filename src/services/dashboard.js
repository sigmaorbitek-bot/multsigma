import { supabase } from "./supabase";

export async function obterResumoDashboard(
  empresaId,
) {
  if (!empresaId) {
    return {
      produtosCadastrados: 0,
      produtosAtivos: 0,
    };
  }

  const [
    produtosCadastradosResultado,
    produtosAtivosResultado,
  ] = await Promise.all([
    supabase
      .from("produtos")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("empresa_id", empresaId),

    supabase
      .from("produtos")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("empresa_id", empresaId)
      .eq("ativo", true),
  ]);

  if (produtosCadastradosResultado.error) {
    throw produtosCadastradosResultado.error;
  }

  if (produtosAtivosResultado.error) {
    throw produtosAtivosResultado.error;
  }

  return {
    produtosCadastrados:
      produtosCadastradosResultado.count ?? 0,

    produtosAtivos:
      produtosAtivosResultado.count ?? 0,
  };
}