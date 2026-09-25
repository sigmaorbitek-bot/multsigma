import { supabase } from "./supabase";

import { enviarImagemProduto, removerImagemProduto } from "./produtoImagens";

export async function listarProdutos(empresaId) {
  const { data, error } = await supabase
    .from("produtos")
    .select(
      `
      id,
      nome,
      sku,
      codigo_barras,
      descricao,
      unidade,
      preco_custo,
      percentual_lucro,
      preco_venda,
      estoque_atual,
      estoque_minimo,
      imagem_path,
      ativo,
      exibir_na_vitrine,
      exibir_preco,
      permitir_pedido,
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

export async function criarProduto({
  empresaId,
  categoriaId,
  nome,
  sku,
  codigoBarras,
  descricao,
  unidade,

  precoCusto,
  percentualLucro,
  precoVenda,

  estoqueInicial,
  estoqueMinimo,

  exibirNaVitrine,
  exibirPreco,
  permitirPedido,

  imagem,
}) {
  let imagemPath = null;

  try {
    if (imagem) {
      imagemPath = await enviarImagemProduto({
        empresaId,
        arquivo: imagem,
      });
    }

    const { data, error } = await supabase.rpc("criar_produto_v2", {
      p_empresa_id: empresaId,

      p_categoria_id: categoriaId || null,

      p_nome: nome.trim(),

      p_sku: sku?.trim() || null,

      p_codigo_barras: codigoBarras?.trim() || null,

      p_descricao: descricao?.trim() || null,

      p_unidade: unidade,

      p_preco_custo: Number(precoCusto),

      p_percentual_lucro:
        percentualLucro === "" || percentualLucro === null
          ? null
          : Number(percentualLucro),

      p_preco_venda: Number(precoVenda),

      p_estoque_inicial: Number(estoqueInicial),

      p_estoque_minimo: Number(estoqueMinimo),

      p_exibir_na_vitrine: exibirNaVitrine,

      p_exibir_preco: exibirPreco,

      p_permitir_pedido: permitirPedido,

      p_imagem_path: imagemPath,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    if (imagemPath) {
      try {
        await removerImagemProduto(imagemPath);
      } catch (cleanupError) {
        console.error("Erro ao remover imagem após falha:", cleanupError);
      }
    }

    throw error;
  }
}

export async function atualizarProduto({
  produtoId,
  empresaId,
  categoriaId,
  nome,
  sku,
  codigoBarras,
  descricao,
  unidade,

  precoCusto,
  percentualLucro,
  precoVenda,

  estoqueMinimo,

  exibirNaVitrine,
  exibirPreco,
  permitirPedido,

  imagem,
  imagemAtualPath,
  removerImagemAtual = false,
}) {
  let novaImagemPath = null;

  try {
    if (imagem) {
      novaImagemPath = await enviarImagemProduto({
        empresaId,
        arquivo: imagem,
      });
    }

    let imagemFinal = imagemAtualPath || null;

    if (imagem) {
      imagemFinal = novaImagemPath;
    } else if (removerImagemAtual) {
      imagemFinal = null;
    }

    const { data, error } = await supabase
      .from("produtos")
      .update({
        categoria_id: categoriaId || null,

        nome: nome.trim(),

        sku: sku?.trim() || null,

        codigo_barras: codigoBarras?.trim() || null,

        descricao: descricao?.trim() || null,

        unidade,

        preco_custo: Number(precoCusto),

        percentual_lucro:
          percentualLucro === "" || percentualLucro === null
            ? null
            : Number(percentualLucro),

        preco_venda: Number(precoVenda),

        estoque_minimo: Number(estoqueMinimo),

        exibir_na_vitrine: exibirNaVitrine,

        exibir_preco: exibirPreco,

        permitir_pedido: permitirPedido,

        imagem_path: imagemFinal,
      })
      .eq("id", produtoId)
      .eq("empresa_id", empresaId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (imagemAtualPath && imagemAtualPath !== imagemFinal) {
      try {
        await removerImagemProduto(imagemAtualPath);
      } catch (cleanupError) {
        console.error(
          "Produto atualizado, mas não foi possível remover a imagem antiga:",
          cleanupError,
        );
      }
    }

    return data;
  } catch (error) {
    if (novaImagemPath) {
      try {
        await removerImagemProduto(novaImagemPath);
      } catch (cleanupError) {
        console.error("Erro ao remover nova imagem após falha:", cleanupError);
      }
    }

    throw error;
  }
}

export async function alterarStatusProduto({ produtoId, empresaId, ativo }) {
  const { error } = await supabase
    .from("produtos")
    .update({
      ativo,
    })
    .eq("id", produtoId)
    .eq("empresa_id", empresaId);

  if (error) {
    throw error;
  }
}

export async function excluirProdutoDefinitivamente({ produtoId, empresaId }) {
  const { data, error } = await supabase.rpc("excluir_produto_seguro", {
    p_produto_id: produtoId,

    p_empresa_id: empresaId,
  });

  if (error) {
    throw error;
  }

  if (data?.imagem_path) {
    try {
      await removerImagemProduto(data.imagem_path);
    } catch (cleanupError) {
      console.error(
        "Produto excluído, mas não foi possível remover a imagem:",
        cleanupError,
      );
    }
  }

  return data;
}
