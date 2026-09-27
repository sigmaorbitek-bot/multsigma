import { useEffect, useState } from "react";

import { useAuth } from "../../hooks/useAuth";

import { listarVendas } from "../../services/vendas";

import VendaForm from "../../components/VendaForm/VendaForm";

import "./Vendas.css";

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

function formatarData(data) {
  if (!data) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function formatarFormaPagamento(formaPagamento) {
  const formas = {
    dinheiro: "Dinheiro",
    pix: "Pix",
    debito: "Débito",
    credito: "Crédito",
    transferencia: "Transferência",
    outro: "Outro",
    misto: "Misto",
  };

  return formas[formaPagamento] || formaPagamento || "—";
}

function formatarStatus(status) {
  const statusFormatados = {
    concluida: "Concluída",
    concluido: "Concluída",
    cancelada: "Cancelada",
    cancelado: "Cancelada",
  };

  return statusFormatados[status] || status || "—";
}

function Vendas() {
  const { empresa } = useAuth();

  const [abaAtiva, setAbaAtiva] = useState("caixa");

  const [vendas, setVendas] = useState([]);

  const [empresaDadosId, setEmpresaDadosId] = useState(null);

  const [empresaConsultadaId, setEmpresaConsultadaId] = useState(null);

  const [recarregando, setRecarregando] = useState(false);

  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!empresa?.id) {
      return;
    }

    let cancelado = false;

    listarVendas(empresa.id)
      .then((dados) => {
        if (cancelado) {
          return;
        }

        setVendas(dados);

        setEmpresaDadosId(empresa.id);

        setErro("");
      })
      .catch((error) => {
        if (cancelado) {
          return;
        }

        console.error("Erro ao carregar vendas:", error);

        setErro("Não foi possível carregar as vendas.");
      })
      .finally(() => {
        if (cancelado) {
          return;
        }

        setEmpresaConsultadaId(empresa.id);
      });

    return () => {
      cancelado = true;
    };
  }, [empresa?.id]);

  async function carregarVendas() {
    if (!empresa?.id) {
      return;
    }

    setRecarregando(true);
    setErro("");

    try {
      const dados = await listarVendas(empresa.id);

      setVendas(dados);

      setEmpresaDadosId(empresa.id);

      setEmpresaConsultadaId(empresa.id);
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);

      setErro("Não foi possível carregar as vendas.");

      setEmpresaConsultadaId(empresa.id);
    } finally {
      setRecarregando(false);
    }
  }

  async function handleVendaFinalizada() {
    await carregarVendas();

    setAbaAtiva("historico");
  }

  const dadosSaoDaEmpresaAtual =
    Boolean(empresa?.id) && empresaDadosId === empresa.id;

  const loading = Boolean(empresa?.id) && empresaConsultadaId !== empresa.id;

  const vendasAtuais = dadosSaoDaEmpresaAtual ? vendas : [];

  const hoje = new Date();

  const vendasHoje = vendasAtuais.filter((venda) => {
    const dataVenda = new Date(venda.created_at);

    return (
      dataVenda.getFullYear() === hoje.getFullYear() &&
      dataVenda.getMonth() === hoje.getMonth() &&
      dataVenda.getDate() === hoje.getDate()
    );
  });

  const faturamentoHoje = vendasHoje.reduce(
    (total, venda) => total + Number(venda.total || 0),
    0,
  );

  const ticketMedio =
    vendasHoje.length > 0 ? faturamentoHoje / vendasHoje.length : 0;

  return (
    <section className="vendas-page">
      <div className="vendas-page-header">
        <div>
          <span className="vendas-eyebrow">GESTÃO DE VENDAS</span>

          <h1>Vendas</h1>

          <p>Registre novas vendas e acompanhe todo o histórico da empresa.</p>
        </div>
      </div>

      {erro && (
        <div className="vendas-erro" role="alert">
          {erro}
        </div>
      )}

      <div className="vendas-abas" role="tablist" aria-label="Áreas de vendas">
        <button
          className={`vendas-aba ${
            abaAtiva === "caixa" ? "vendas-aba-ativa" : ""
          }`}
          type="button"
          role="tab"
          aria-selected={abaAtiva === "caixa"}
          onClick={() => setAbaAtiva("caixa")}
        >
          <span aria-hidden="true">🛒</span>
          Caixa
        </button>

        <button
          className={`vendas-aba ${
            abaAtiva === "historico" ? "vendas-aba-ativa" : ""
          }`}
          type="button"
          role="tab"
          aria-selected={abaAtiva === "historico"}
          onClick={() => setAbaAtiva("historico")}
        >
          <span aria-hidden="true">📋</span>
          Histórico
        </button>
      </div>

      {abaAtiva === "caixa" && (
        <div className="vendas-caixa">
          <VendaForm
            modo="embutido"
            aberto
            empresaId={empresa?.id}
            onVendaFinalizada={handleVendaFinalizada}
          />
        </div>
      )}

      {abaAtiva === "historico" && (
        <>
          <div className="vendas-resumo">
            <article className="vendas-resumo-card">
              <span>Vendas hoje</span>

              <strong>
                {loading || recarregando ? "..." : vendasHoje.length}
              </strong>

              <small>Vendas concluídas hoje</small>
            </article>

            <article className="vendas-resumo-card">
              <span>Faturamento hoje</span>

              <strong>
                {loading || recarregando
                  ? "..."
                  : formatarMoeda(faturamentoHoje)}
              </strong>

              <small>Total vendido hoje</small>
            </article>

            <article className="vendas-resumo-card">
              <span>Ticket médio</span>

              <strong>
                {loading || recarregando ? "..." : formatarMoeda(ticketMedio)}
              </strong>

              <small>Média por venda hoje</small>
            </article>
          </div>

          <div className="vendas-historico">
            <div className="vendas-historico-header">
              <div>
                <h2>Histórico de vendas</h2>

                <p>Consulte as vendas registradas recentemente.</p>
              </div>

              {!loading && !recarregando && (
                <span className="vendas-contador">
                  {vendasAtuais.length}{" "}
                  {vendasAtuais.length === 1 ? "registro" : "registros"}
                </span>
              )}
            </div>

            {loading || recarregando ? (
              <div className="vendas-estado">Carregando vendas...</div>
            ) : vendasAtuais.length === 0 ? (
              <div className="vendas-vazio">
                <div className="vendas-vazio-icone">🛒</div>

                <strong>Nenhuma venda registrada</strong>

                <p>
                  Use a aba Caixa para registrar a primeira venda da empresa.
                </p>
              </div>
            ) : (
              <div className="vendas-tabela-wrapper">
                <table className="vendas-tabela">
                  <thead>
                    <tr>
                      <th>Data</th>

                      <th>Pagamento</th>

                      <th>Status</th>

                      <th>Total</th>

                      <th>Lucro</th>

                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {vendasAtuais.map((venda) => (
                      <tr key={venda.id}>
                        <td>{formatarData(venda.created_at)}</td>

                        <td>{formatarFormaPagamento(venda.forma_pagamento)}</td>

                        <td>
                          <span
                            className={`vendas-status vendas-status-${venda.status}`}
                          >
                            {formatarStatus(venda.status)}
                          </span>
                        </td>

                        <td>
                          <strong>{formatarMoeda(venda.total)}</strong>
                        </td>

                        <td>{formatarMoeda(venda.lucro)}</td>

                        <td>
                          <button
                            className="vendas-detalhes"
                            type="button"
                            disabled
                            title="Detalhes da venda será o próximo passo"
                          >
                            Ver detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default Vendas;
