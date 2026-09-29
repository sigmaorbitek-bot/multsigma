import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { obterRelatorioVendas } from "../../services/relatorios";

import { gerarRelatorioVendasImpressao } from "../../utils/relatorioVendasImpressao";

import "./Relatorios.css";

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

function formatarDataCurta(valor) {
  if (!valor) {
    return "—";
  }

  const partes = String(valor).split("-");

  if (partes.length !== 3) {
    return valor;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarPagamento(tipo) {
  const nomes = {
    dinheiro: "Dinheiro",
    pix: "Pix",
    debito: "Débito",
    credito: "Crédito",
    transferencia: "Transferência",
    outro: "Outro",
  };

  return nomes[tipo] || tipo || "—";
}

function inicioDoDia(data) {
  const resultado = new Date(data);

  resultado.setHours(0, 0, 0, 0);

  return resultado;
}

function inicioDoProximoDia(data) {
  const resultado = inicioDoDia(data);

  resultado.setDate(resultado.getDate() + 1);

  return resultado;
}

function formatarInputData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterPeriodo(tipo) {
  const agora = new Date();
  const hoje = inicioDoDia(agora);

  if (tipo === "hoje") {
    return {
      inicio: hoje,
      fim: inicioDoProximoDia(hoje),
    };
  }

  if (tipo === "7dias") {
    const inicio = new Date(hoje);

    inicio.setDate(inicio.getDate() - 6);

    return {
      inicio,
      fim: inicioDoProximoDia(hoje),
    };
  }

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const inicioProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);

  return {
    inicio: inicioMes,
    fim: inicioProximoMes,
  };
}

function Relatorios() {
  const { empresa } = useAuth();

  const empresaId = empresa?.id ?? null;

  const [periodo, setPeriodo] = useState("mes");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [relatorio, setRelatorio] = useState(null);
  const [chaveRelatorioCarregado, setChaveRelatorioCarregado] = useState(null);
  const [chaveRelatorioConsultado, setChaveRelatorioConsultado] =
    useState(null);
  const [erro, setErro] = useState("");

  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";

  let periodoResolvido = null;

  if (periodo !== "personalizado") {
    periodoResolvido = obterPeriodo(periodo);
  } else if (dataInicial && dataFinal) {
    const inicio = inicioDoDia(new Date(`${dataInicial}T00:00:00`));

    const fimInclusivo = inicioDoDia(new Date(`${dataFinal}T00:00:00`));

    periodoResolvido = {
      inicio,
      fim: inicioDoProximoDia(fimInclusivo),
    };
  }

  const dataInicioIso = periodoResolvido?.inicio.toISOString() ?? null;

  const dataFimIso = periodoResolvido?.fim.toISOString() ?? null;

  const chaveConsulta =
    empresaId && dataInicioIso && dataFimIso
      ? [empresaId, dataInicioIso, dataFimIso, timezone].join("|")
      : null;

  useEffect(() => {
    if (!empresaId || !dataInicioIso || !dataFimIso || !chaveConsulta) {
      return;
    }

    let cancelado = false;

    obterRelatorioVendas({
      empresaId,
      dataInicio: dataInicioIso,
      dataFim: dataFimIso,
      timezone,
    })
      .then((dados) => {
        if (cancelado) {
          return;
        }

        setRelatorio(dados);
        setChaveRelatorioCarregado(chaveConsulta);
        setErro("");
      })
      .catch((error) => {
        if (cancelado) {
          return;
        }

        console.error("Erro ao carregar relatório de vendas:", error);

        setRelatorio(null);
        setChaveRelatorioCarregado(null);

        setErro(error?.message || "Não foi possível carregar o relatório.");
      })
      .finally(() => {
        if (cancelado) {
          return;
        }

        setChaveRelatorioConsultado(chaveConsulta);
      });

    return () => {
      cancelado = true;
    };
  }, [empresaId, dataInicioIso, dataFimIso, timezone, chaveConsulta]);

  const loading =
    Boolean(chaveConsulta) && chaveRelatorioConsultado !== chaveConsulta;

  const relatorioAtual =
    chaveConsulta && chaveRelatorioCarregado === chaveConsulta
      ? relatorio
      : null;

  const resumo = relatorioAtual?.resumo ?? {
    faturamento: 0,
    vendas: 0,
    lucro: 0,
    ticket_medio: 0,
  };

  const pagamentos = relatorioAtual?.pagamentos ?? [];
  const produtos = relatorioAtual?.produtos ?? [];
  const diario = relatorioAtual?.diario ?? [];

  function selecionarPeriodo(novoPeriodo) {
    setPeriodo(novoPeriodo);

    if (novoPeriodo !== "personalizado") {
      return;
    }

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    setDataInicial((atual) => atual || formatarInputData(inicioMes));
    setDataFinal((atual) => atual || formatarInputData(hoje));
  }

  function imprimirRelatorio() {
    if (!relatorioAtual || !periodoResolvido) {
      return;
    }

    gerarRelatorioVendasImpressao({
      empresa,
      relatorio: relatorioAtual,
      periodo: {
        inicio: periodoResolvido.inicio,
        fim: new Date(periodoResolvido.fim.getTime() - 1),
      },
    });
  }

  return (
    <section className="relatorios-page">
      <div className="relatorios-page-header">
        <div>
          <span className="relatorios-eyebrow">ANÁLISE DO NEGÓCIO</span>

          <h1>Relatórios</h1>

          <p>
            Acompanhe faturamento, lucro, vendas, pagamentos e produtos por
            período.
          </p>
        </div>

        <button
          className="relatorios-imprimir"
          type="button"
          onClick={imprimirRelatorio}
          disabled={loading || !relatorioAtual}
        >
          🖨️ Imprimir relatório
        </button>
      </div>

      <section className="relatorios-filtros">
        <div className="relatorios-filtros-topo">
          <div>
            <h2>Período</h2>

            <p>Escolha o intervalo que deseja analisar.</p>
          </div>

          {periodoResolvido && (
            <span className="relatorios-periodo-atual">
              {formatarDataCurta(formatarInputData(periodoResolvido.inicio))}
              {" → "}
              {formatarDataCurta(
                formatarInputData(new Date(periodoResolvido.fim.getTime() - 1)),
              )}
            </span>
          )}
        </div>

        <div
          className="relatorios-periodos"
          role="group"
          aria-label="Período do relatório"
        >
          <button
            type="button"
            className={periodo === "hoje" ? "ativo" : ""}
            onClick={() => selecionarPeriodo("hoje")}
          >
            Hoje
          </button>

          <button
            type="button"
            className={periodo === "7dias" ? "ativo" : ""}
            onClick={() => selecionarPeriodo("7dias")}
          >
            7 dias
          </button>

          <button
            type="button"
            className={periodo === "mes" ? "ativo" : ""}
            onClick={() => selecionarPeriodo("mes")}
          >
            Este mês
          </button>

          <button
            type="button"
            className={periodo === "personalizado" ? "ativo" : ""}
            onClick={() => selecionarPeriodo("personalizado")}
          >
            Personalizado
          </button>
        </div>

        {periodo === "personalizado" && (
          <div className="relatorios-datas">
            <label>
              <span>Data inicial</span>

              <input
                type="date"
                value={dataInicial}
                max={dataFinal || undefined}
                onChange={(event) => setDataInicial(event.target.value)}
              />
            </label>

            <label>
              <span>Data final</span>

              <input
                type="date"
                value={dataFinal}
                min={dataInicial || undefined}
                onChange={(event) => setDataFinal(event.target.value)}
              />
            </label>
          </div>
        )}
      </section>

      {erro && (
        <div className="relatorios-erro" role="alert">
          {erro}
        </div>
      )}

      <div className="relatorios-metricas">
        <article>
          <span>Faturamento</span>

          <strong>{loading ? "..." : formatarMoeda(resumo.faturamento)}</strong>

          <small>Total vendido no período</small>
        </article>

        <article>
          <span>Vendas</span>

          <strong>{loading ? "..." : Number(resumo.vendas) || 0}</strong>

          <small>Vendas concluídas</small>
        </article>

        <article>
          <span>Lucro</span>

          <strong>{loading ? "..." : formatarMoeda(resumo.lucro)}</strong>

          <small>Lucro registrado nas vendas</small>
        </article>

        <article>
          <span>Ticket médio</span>

          <strong>
            {loading ? "..." : formatarMoeda(resumo.ticket_medio)}
          </strong>

          <small>Média por venda concluída</small>
        </article>
      </div>

      <div className="relatorios-grid">
        <section className="relatorios-card">
          <div className="relatorios-card-header">
            <div>
              <h2>Formas de pagamento</h2>

              <p>Valores recebidos por tipo.</p>
            </div>
          </div>

          {loading ? (
            <div className="relatorios-estado">Carregando...</div>
          ) : pagamentos.length === 0 ? (
            <div className="relatorios-vazio">Nenhum pagamento no período.</div>
          ) : (
            <div className="relatorios-lista">
              {pagamentos.map((pagamento) => (
                <div key={pagamento.tipo} className="relatorios-lista-item">
                  <div>
                    <strong>{formatarPagamento(pagamento.tipo)}</strong>

                    <span>
                      {Number(pagamento.quantidade) || 0}{" "}
                      {Number(pagamento.quantidade) === 1
                        ? "pagamento"
                        : "pagamentos"}
                    </span>
                  </div>

                  <strong>{formatarMoeda(pagamento.total)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="relatorios-card">
          <div className="relatorios-card-header">
            <div>
              <h2>Produtos mais vendidos</h2>

              <p>Ranking por quantidade vendida.</p>
            </div>
          </div>

          {loading ? (
            <div className="relatorios-estado">Carregando...</div>
          ) : produtos.length === 0 ? (
            <div className="relatorios-vazio">
              Nenhum produto vendido no período.
            </div>
          ) : (
            <div className="relatorios-ranking">
              {produtos.map((produto, index) => (
                <div
                  key={`${produto.produto_id}-${produto.produto_nome}`}
                  className="relatorios-ranking-item"
                >
                  <span className="relatorios-ranking-posicao">
                    {index + 1}
                  </span>

                  <div className="relatorios-ranking-info">
                    <strong>{produto.produto_nome}</strong>

                    <span>{Number(produto.quantidade) || 0} vendidos</span>
                  </div>

                  <strong>{formatarMoeda(produto.faturamento)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="relatorios-card relatorios-card-diario">
        <div className="relatorios-card-header">
          <div>
            <h2>Resumo diário</h2>

            <p>Desempenho das vendas em cada dia do período.</p>
          </div>
        </div>

        {loading ? (
          <div className="relatorios-estado">Carregando...</div>
        ) : diario.length === 0 ? (
          <div className="relatorios-vazio">
            Nenhuma venda concluída no período selecionado.
          </div>
        ) : (
          <div className="relatorios-tabela-wrapper">
            <table className="relatorios-tabela">
              <thead>
                <tr>
                  <th>Data</th>

                  <th>Vendas</th>

                  <th>Faturamento</th>

                  <th>Lucro</th>

                  <th>Ticket médio</th>
                </tr>
              </thead>

              <tbody>
                {diario.map((dia) => (
                  <tr key={dia.data}>
                    <td>{formatarDataCurta(dia.data)}</td>

                    <td>{Number(dia.vendas) || 0}</td>

                    <td>
                      <strong>{formatarMoeda(dia.faturamento)}</strong>
                    </td>

                    <td>{formatarMoeda(dia.lucro)}</td>

                    <td>{formatarMoeda(dia.ticket_medio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default Relatorios;
