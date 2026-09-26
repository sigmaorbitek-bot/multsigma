import { supabase } from "./supabase";

const TIPOS_PAGAMENTO = [
  "dinheiro",
  "pix",
  "debito",
  "credito",
  "transferencia",
  "outro",
];

function validarEmpresaId(empresaId) {
  if (!empresaId) {
    throw new Error("Empresa não informada.");
  }
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

function prepararItens(itens) {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new Error("A venda precisa possuir pelo menos um item.");
  }

  const produtosUsados = new Set();

  return itens.map((item) => {
    if (!item?.produtoId) {
      throw new Error("Existe um produto inválido na venda.");
    }

    if (produtosUsados.has(item.produtoId)) {
      throw new Error("Existem produtos duplicados na venda.");
    }

    produtosUsados.add(item.produtoId);

    const quantidade = converterNumero(item.quantidade, "Quantidade");

    if (quantidade <= 0) {
      throw new Error("A quantidade deve ser maior que zero.");
    }

    const desconto =
      item.desconto === undefined ||
      item.desconto === null ||
      item.desconto === ""
        ? 0
        : converterNumeroNaoNegativo(item.desconto, "Desconto do item");

    return {
      produto_id: item.produtoId,

      quantidade,

      desconto,
    };
  });
}

function prepararPagamentos(pagamentos) {
  if (pagamentos === null || pagamentos === undefined) {
    return [];
  }

  if (!Array.isArray(pagamentos)) {
    throw new Error("Os pagamentos enviados são inválidos.");
  }

  return pagamentos.map((pagamento) => {
    const tipo = pagamento?.tipo?.trim().toLowerCase();

    if (!TIPOS_PAGAMENTO.includes(tipo)) {
      throw new Error("Forma de pagamento inválida.");
    }

    const valor = converterNumero(pagamento.valor, "Valor do pagamento");

    if (valor <= 0) {
      throw new Error("O valor do pagamento deve ser maior que zero.");
    }

    const parcelas =
      pagamento.parcelas === undefined ||
      pagamento.parcelas === null ||
      pagamento.parcelas === ""
        ? 1
        : Number(pagamento.parcelas);

    if (!Number.isInteger(parcelas) || parcelas < 1) {
      throw new Error("Quantidade de parcelas inválida.");
    }

    if (tipo !== "credito" && parcelas !== 1) {
      throw new Error(
        "Apenas pagamentos no crédito podem possuir mais de uma parcela.",
      );
    }

    let valorRecebido = null;

    if (tipo === "dinheiro") {
      if (
        pagamento.valorRecebido !== undefined &&
        pagamento.valorRecebido !== null &&
        pagamento.valorRecebido !== ""
      ) {
        valorRecebido = converterNumero(
          pagamento.valorRecebido,
          "Valor recebido",
        );

        if (valorRecebido < valor) {
          throw new Error(
            "O valor recebido em dinheiro é menor que o valor do pagamento.",
          );
        }
      }
    } else if (
      pagamento.valorRecebido !== undefined &&
      pagamento.valorRecebido !== null &&
      pagamento.valorRecebido !== ""
    ) {
      throw new Error(
        "Valor recebido só deve ser informado para pagamento em dinheiro.",
      );
    }

    return {
      tipo,
      valor,
      parcelas,
      valor_recebido: valorRecebido,
    };
  });
}

export async function finalizarVenda({
  empresaId,
  itens,
  pagamentos,
  desconto = 0,
  acrescimo = 0,
  observacoes = "",
}) {
  validarEmpresaId(empresaId);

  const itensPreparados = prepararItens(itens);

  const pagamentosPreparados = prepararPagamentos(pagamentos);

  const descontoNumero = converterNumeroNaoNegativo(desconto, "Desconto");

  const acrescimoNumero = converterNumeroNaoNegativo(acrescimo, "Acréscimo");

  const observacoesLimpas = observacoes?.trim() || null;

  if (observacoesLimpas && observacoesLimpas.length > 1000) {
    throw new Error("As observações podem possuir no máximo 1000 caracteres.");
  }

  const { data, error } = await supabase.rpc("finalizar_venda", {
    p_empresa_id: empresaId,

    p_itens: itensPreparados,

    p_pagamentos: pagamentosPreparados,

    p_desconto: descontoNumero,

    p_acrescimo: acrescimoNumero,

    p_observacoes: observacoesLimpas,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function listarVendas(empresaId) {
  validarEmpresaId(empresaId);

  const { data, error } = await supabase
    .from("vendas")
    .select(
      `
          id,
          usuario_id,
          subtotal,
          desconto,
          acrescimo,
          total,
          custo_total,
          lucro,
          forma_pagamento,
          status,
          observacoes,
          created_at,
          updated_at
        `,
    )
    .eq("empresa_id", empresaId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function obterVenda({ empresaId, vendaId }) {
  validarEmpresaId(empresaId);

  if (!vendaId) {
    throw new Error("Venda não informada.");
  }

  const { data: venda, error: vendaError } = await supabase
    .from("vendas")
    .select(
      `
          id,
          usuario_id,
          subtotal,
          desconto,
          acrescimo,
          total,
          custo_total,
          lucro,
          forma_pagamento,
          status,
          observacoes,
          created_at,
          updated_at
        `,
    )
    .eq("id", vendaId)
    .eq("empresa_id", empresaId)
    .single();

  if (vendaError) {
    throw vendaError;
  }

  const { data: itens, error: itensError } = await supabase
    .from("venda_itens")
    .select(
      `
          id,
          produto_id,
          produto_nome,
          quantidade,
          preco_unitario,
          custo_unitario,
          desconto,
          total
        `,
    )
    .eq("venda_id", vendaId)
    .eq("empresa_id", empresaId);

  if (itensError) {
    throw itensError;
  }

  const { data: pagamentos, error: pagamentosError } = await supabase
    .from("venda_pagamentos")
    .select(
      `
          id,
          tipo,
          valor,
          parcelas,
          valor_recebido,
          troco
        `,
    )
    .eq("venda_id", vendaId)
    .eq("empresa_id", empresaId);

  if (pagamentosError) {
    throw pagamentosError;
  }

  return {
    ...venda,
    itens: itens ?? [],
    pagamentos: pagamentos ?? [],
  };
}
