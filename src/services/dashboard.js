import { supabase } from "./supabase";

export async function obterResumoDashboard(empresaId) {
  if (!empresaId) {
    return {
      produtosCadastrados: 0,
      produtosAtivos: 0,
      estoqueBaixo: 0,
    };
  }

  const [
    produtosCadastradosResult,
    produtosAtivosResult,
    produtosEstoqueResult,
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

    supabase
      .from("produtos")
      .select(
        `
          id,
          estoque_atual,
          estoque_minimo,
          ativo
        `,
      )
      .eq("empresa_id", empresaId)
      .eq("ativo", true),
  ]);

  if (produtosCadastradosResult.error) {
    throw produtosCadastradosResult.error;
  }

  if (produtosAtivosResult.error) {
    throw produtosAtivosResult.error;
  }

  if (produtosEstoqueResult.error) {
    throw produtosEstoqueResult.error;
  }

  const estoqueBaixo = (produtosEstoqueResult.data ?? []).filter((produto) => {
    const estoqueAtual = Number(produto.estoque_atual) || 0;

    const estoqueMinimo = Number(produto.estoque_minimo) || 0;

    return estoqueAtual <= estoqueMinimo;
  }).length;

  return {
    produtosCadastrados: produtosCadastradosResult.count ?? 0,

    produtosAtivos: produtosAtivosResult.count ?? 0,

    estoqueBaixo,
  };
}
