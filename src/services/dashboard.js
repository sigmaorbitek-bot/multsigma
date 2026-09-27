import { supabase } from "./supabase";

function inicioDoDiaLocalIso() {
  const agora = new Date();

  const inicio = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
    0,
    0,
    0,
    0,
  );

  return inicio.toISOString();
}

function inicioDoMesLocalIso() {
  const agora = new Date();

  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0, 0);

  return inicio.toISOString();
}

function normalizarStatusVenda(status) {
  return String(status ?? "")
    .trim()
    .toLowerCase();
}

function vendaEstaConcluida(venda) {
  const status = normalizarStatusVenda(venda?.status);

  return status === "concluida" || status === "concluido";
}

export async function obterResumoDashboard(empresaId) {
  if (!empresaId) {
    return {
      produtosCadastrados: 0,
      produtosAtivos: 0,
      estoqueBaixo: 0,

      vendasHoje: 0,
      faturamentoHoje: 0,
      lucroMes: 0,
    };
  }

  const inicioDia = inicioDoDiaLocalIso();

  const inicioMes = inicioDoMesLocalIso();

  const [
    produtosCadastradosResult,
    produtosAtivosResult,
    produtosEstoqueResult,
    vendasHojeResult,
    vendasMesResult,
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

    supabase
      .from("vendas")
      .select(
        `
          id,
          total,
          lucro,
          status,
          created_at
        `,
      )
      .eq("empresa_id", empresaId)
      .gte("created_at", inicioDia),

    supabase
      .from("vendas")
      .select(
        `
          id,
          lucro,
          status,
          created_at
        `,
      )
      .eq("empresa_id", empresaId)
      .gte("created_at", inicioMes),
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

  if (vendasHojeResult.error) {
    throw vendasHojeResult.error;
  }

  if (vendasMesResult.error) {
    throw vendasMesResult.error;
  }

  const estoqueBaixo = (produtosEstoqueResult.data ?? []).filter((produto) => {
    const estoqueAtual = Number(produto.estoque_atual) || 0;

    const estoqueMinimo = Number(produto.estoque_minimo) || 0;

    return estoqueAtual <= estoqueMinimo;
  }).length;

  const vendasHojeConcluidas = (vendasHojeResult.data ?? []).filter(
    vendaEstaConcluida,
  );

  const vendasMesConcluidas = (vendasMesResult.data ?? []).filter(
    vendaEstaConcluida,
  );

  const faturamentoHoje = vendasHojeConcluidas.reduce(
    (total, venda) => total + Number(venda.total || 0),
    0,
  );

  const lucroMes = vendasMesConcluidas.reduce(
    (total, venda) => total + Number(venda.lucro || 0),
    0,
  );

  return {
    produtosCadastrados: produtosCadastradosResult.count ?? 0,
    produtosAtivos: produtosAtivosResult.count ?? 0,
    estoqueBaixo,
    vendasHoje: vendasHojeConcluidas.length,
    faturamentoHoje,
    lucroMes,
  };
}
