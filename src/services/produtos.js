import { supabase } from "./supabase";

import { enviarImagemProduto, removerImagemProduto } from "./produtoImagens";

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

function normalizarTexto(valor) {
  const texto = valor?.trim();

  return texto || null;
}

function converterNumero(valor, campo) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    throw new Error(`${campo} inválido.`);
  }

  return numero;
}

function converterNumeroNaoNegativo(valor, campo) {
  const numero = converterNumero(valor, campo);

  if (numero < 0) {
    throw new Error(`${campo} não pode ser negativo.`);
  }

  return numero;
}

function validarNomeProduto(nome) {
  const nomeLimpo = nome?.trim();

  if (!nomeLimpo) {
    throw new Error("Informe o nome do produto.");
  }

  return nomeLimpo;
}

const UNIDADES_PERMITIDAS = ["UN", "KG", "G", "L", "ML", "CX", "PCT", "M"];

function validarUnidade(unidade) {
  if (!UNIDADES_PERMITIDAS.includes(unidade)) {
    throw new Error("Unidade de medida inválida.");
  }

  return unidade;
}

export async function listarProdutos(empresaId) {
  validarEmpresaId(empresaId);

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
  validarEmpresaId(empresaId);

  const nomeLimpo = validarNomeProduto(nome);

  const unidadeValida = validarUnidade(unidade);

  const precoCustoNumero = converterNumeroNaoNegativo(
    precoCusto,
    "Preço de custo",
  );

  const precoVendaNumero = converterNumeroNaoNegativo(
    precoVenda,
    "Preço de venda",
  );

  const estoqueInicialNumero = converterNumeroNaoNegativo(
    estoqueInicial,
    "Estoque inicial",
  );

  const estoqueMinimoNumero = converterNumeroNaoNegativo(
    estoqueMinimo,
    "Estoque mínimo",
  );

  const percentualLucroNumero =
    percentualLucro === "" ||
    percentualLucro === null ||
    percentualLucro === undefined
      ? null
      : converterNumeroNaoNegativo(percentualLucro, "Percentual de lucro");

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

      p_nome: nomeLimpo,

      p_sku: normalizarTexto(sku),

      p_codigo_barras: normalizarTexto(codigoBarras),

      p_descricao: normalizarTexto(descricao),

      p_unidade: unidadeValida,

      p_preco_custo: precoCustoNumero,

      p_percentual_lucro: percentualLucroNumero,

      p_preco_venda: precoVendaNumero,

      p_estoque_inicial: estoqueInicialNumero,

      p_estoque_minimo: estoqueMinimoNumero,

      p_exibir_na_vitrine: Boolean(exibirNaVitrine),

      p_exibir_preco: Boolean(exibirPreco),

      p_permitir_pedido: Boolean(permitirPedido),

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
  validarEmpresaId(empresaId);

  validarProdutoId(produtoId);

  const nomeLimpo = validarNomeProduto(nome);

  const unidadeValida = validarUnidade(unidade);

  const precoCustoNumero = converterNumeroNaoNegativo(
    precoCusto,
    "Preço de custo",
  );

  const precoVendaNumero = converterNumeroNaoNegativo(
    precoVenda,
    "Preço de venda",
  );

  const estoqueMinimoNumero = converterNumeroNaoNegativo(
    estoqueMinimo,
    "Estoque mínimo",
  );

  const percentualLucroNumero =
    percentualLucro === "" ||
    percentualLucro === null ||
    percentualLucro === undefined
      ? null
      : converterNumeroNaoNegativo(percentualLucro, "Percentual de lucro");

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

        nome: nomeLimpo,

        sku: normalizarTexto(sku),

        codigo_barras: normalizarTexto(codigoBarras),

        descricao: normalizarTexto(descricao),

        unidade: unidadeValida,

        preco_custo: precoCustoNumero,

        percentual_lucro: percentualLucroNumero,

        preco_venda: precoVendaNumero,

        estoque_minimo: estoqueMinimoNumero,

        exibir_na_vitrine: Boolean(exibirNaVitrine),

        exibir_preco: Boolean(exibirPreco),

        permitir_pedido: Boolean(permitirPedido),

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
  validarEmpresaId(empresaId);

  validarProdutoId(produtoId);

  if (typeof ativo !== "boolean") {
    throw new Error("Status do produto inválido.");
  }

  const { data, error } = await supabase
    .from("produtos")
    .update({
      ativo,
    })
    .eq("id", produtoId)
    .eq("empresa_id", empresaId)
    .select("id, ativo")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function excluirProdutoDefinitivamente({ produtoId, empresaId }) {
  validarEmpresaId(empresaId);

  validarProdutoId(produtoId);

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
