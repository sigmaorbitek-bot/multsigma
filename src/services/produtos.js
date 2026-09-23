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
    .eq("ativo", true)
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

    const { data, error } = await supabase.rpc(
      "criar_produto",
      {
        p_empresa_id: empresaId,
        p_categoria_id: categoriaId || null,

        p_nome: nome,
        p_sku: sku || null,
        p_codigo_barras: codigoBarras || null,
        p_descricao: descricao || null,

        p_unidade: unidade,

        p_preco_custo: Number(precoCusto),
        p_preco_venda: Number(precoVenda),

        p_estoque_inicial: Number(estoqueInicial),
        p_estoque_minimo: Number(estoqueMinimo),

        p_exibir_na_vitrine: exibirNaVitrine,
        p_exibir_preco: exibirPreco,
        p_permitir_pedido: permitirPedido,

        p_imagem_path: imagemPath,
      },
    );

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    if (imagemPath) {
      try {
        await removerImagemProduto(imagemPath);
      } catch (cleanupError) {
        console.error(
          "Erro ao remover imagem órfã:",
          cleanupError,
        );
      }
    }

    throw error;
  }
}