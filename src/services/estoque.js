import { supabase } from "./supabase";

export async function listarProdutosEstoque(empresaId) {
  const { data, error } = await supabase
    .from("produtos")
    .select(
      `
      id,
      nome,
      sku,
      codigo_barras,
      unidade,
      estoque_atual,
      estoque_minimo,
      ativo,
      imagem_path,
      categorias (
        id,
        nome
      )
    `,
    )
    .eq("empresa_id", empresaId)
    .order("nome");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function movimentarEstoque({
  empresaId,
  produtoId,
  tipo,
  quantidade,
  motivo,
}) {
  const { data, error } = await supabase.rpc("movimentar_estoque", {
    p_empresa_id: empresaId,
    p_produto_id: produtoId,
    p_tipo: tipo,
    p_quantidade: Number(quantidade),
    p_motivo: motivo?.trim() || null,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function listarMovimentacoesEstoque(empresaId, limite = 50) {
  const { data, error } = await supabase
    .from("estoque_movimentacoes")
    .select(
      `
      id,
      tipo,
      quantidade,
      estoque_anterior,
      estoque_posterior,
      motivo,
      created_at,
      produtos (
        id,
        nome,
        sku,
        unidade
      )
    `,
    )
    .eq("empresa_id", empresaId)
    .order("created_at", {
      ascending: false,
    })
    .limit(limite);

  if (error) {
    throw error;
  }

  return data ?? [];
}
