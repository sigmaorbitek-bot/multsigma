import { supabase } from "./supabase";

function validarEmpresaId(empresaId) {
  if (!empresaId) {
    throw new Error("Empresa não informada.");
  }
}

function validarProdutoId(produtoId) {
  if (!produtoId) {
    throw new Error("Produto não informado.");
  }
}

export async function listarProdutosEstoque(empresaId) {
  validarEmpresaId(empresaId);

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
  validarEmpresaId(empresaId);

  validarProdutoId(produtoId);

  const tiposPermitidos = ["entrada", "saida", "ajuste", "perda", "devolucao"];

  if (!tiposPermitidos.includes(tipo)) {
    throw new Error("Tipo de movimentação inválido.");
  }

  const quantidadeNumero = Number(quantidade);

  if (!Number.isFinite(quantidadeNumero)) {
    throw new Error("Informe uma quantidade válida.");
  }

  if (tipo === "ajuste") {
    if (quantidadeNumero < 0) {
      throw new Error("O estoque ajustado não pode ser negativo.");
    }
  } else if (quantidadeNumero <= 0) {
    throw new Error("A quantidade deve ser maior que zero.");
  }

  const motivoLimpo = motivo?.trim() || null;

  const { data, error } = await supabase.rpc("movimentar_estoque", {
    p_empresa_id: empresaId,

    p_produto_id: produtoId,

    p_tipo: tipo,

    p_quantidade: quantidadeNumero,

    p_motivo: motivoLimpo,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function listarMovimentacoesEstoque(empresaId, limite = 50) {
  validarEmpresaId(empresaId);

  const limiteNumero = Number(limite);

  const limiteSeguro =
    Number.isInteger(limiteNumero) && limiteNumero > 0
      ? Math.min(limiteNumero, 200)
      : 50;

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
    .limit(limiteSeguro);

  if (error) {
    throw error;
  }

  return data ?? [];
}
