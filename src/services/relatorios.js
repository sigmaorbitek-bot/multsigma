import { supabase } from "./supabase";

function validarEmpresaId(empresaId) {
  if (!empresaId) {
    throw new Error("Empresa não informada.");
  }
}

function validarData(valor, campo) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    throw new Error(`${campo} inválida.`);
  }

  return data.toISOString();
}

export async function obterRelatorioVendas({
  empresaId,
  dataInicio,
  dataFim,
  timezone,
}) {
  validarEmpresaId(empresaId);

  const inicio = validarData(dataInicio, "Data inicial");
  const fim = validarData(dataFim, "Data final");

  if (new Date(inicio) >= new Date(fim)) {
    throw new Error("A data final precisa ser maior que a data inicial.");
  }

  const timezoneSeguro =
    typeof timezone === "string" && timezone.trim()
      ? timezone.trim()
      : "America/Sao_Paulo";

  const { data, error } = await supabase.rpc("relatorio_vendas", {
    p_empresa_id: empresaId,
    p_data_inicio: inicio,
    p_data_fim: fim,
    p_timezone: timezoneSeguro,
  });

  if (error) {
    throw error;
  }

  return (
    data ?? {
      resumo: {
        faturamento: 0,
        vendas: 0,
        lucro: 0,
        ticket_medio: 0,
      },
      pagamentos: [],
      produtos: [],
      diario: [],
    }
  );
}
