import { useEffect, useState } from "react";

import { useAuth } from "../../hooks/useAuth";

import { listarVendas } from "../../services/vendas";

import VendaForm from "../../components/VendaForm/VendaForm";

import VendaDetalhes from "../../components/VendaDetalhes/VendaDetalhes";

import { gerarComprovanteVenda } from "../../utils/comprovanteVenda";

import "./Vendas.css";

const VENDAS_POR_PAGINA = 6;

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

  const [vendaConcluida, setVendaConcluida] = useState(null);

  const [vendaDetalhesId, setVendaDetalhesId] = useState(null);

  const [vendas, setVendas] = useState([]);

  const [quantidadeVendasVisiveis, setQuantidadeVendasVisiveis] =

    useState(VENDAS_POR_PAGINA);

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

  async function handleVendaFinalizada(dadosVenda) {

    setVendaConcluida(dadosVenda);

    await carregarVendas();

  }

  function handleNovaVenda() {

    setVendaConcluida(null);

    setAbaAtiva("caixa");

  }

  function handleVerHistorico() {

    setVendaConcluida(null);

    setAbaAtiva("historico");

  }

  function mostrarMaisVendas() {

    setQuantidadeVendasVisiveis(

      (quantidadeAtual) => quantidadeAtual + VENDAS_POR_PAGINA,

    );

  }

  function handleGerarComprovante() {

    if (!vendaConcluida) {

      return;

    }

    gerarComprovanteVenda({

      empresa,

      venda: vendaConcluida,

    });

  }

  const dadosSaoDaEmpresaAtual =

    Boolean(empresa?.id) && empresaDadosId === empresa.id;

  const loading = Boolean(empresa?.id) && empresaConsultadaId !== empresa.id;

  const vendasAtuais = dadosSaoDaEmpresaAtual ? vendas : [];

  const vendasVisiveis = vendasAtuais.slice(0, quantidadeVendasVisiveis);

  const possuiMaisVendas = quantidadeVendasVisiveis < vendasAtuais.length;

  const hoje = new Date();

  const vendasHoje = vendasAtuais.filter((venda) => {

    const dataVenda = new Date(venda.created_at);

    return (

      dataVenda.getFullYear() === hoje.getFullYear() &&

      dataVenda.getMonth() === hoje.getMonth() &&

      dataVenda.getDate() === hoje.getDate() &&

      !["cancelada", "cancelado"].includes(venda.status)

    );

  });

  const faturamentoHoje = vendasHoje.reduce(

    (total, venda) => total + Number(venda.total || 0),

    0,

  );

  const ticketMedio =

    vendasHoje.length > 0 ? faturamentoHoje / vendasHoje.length : 0;

  return (

    <>

      <section className="vendas-page">

        <div className="vendas-page-header">

          <div>

            <span className="vendas-eyebrow">GESTÃO DE VENDAS</span>

            <h1>Vendas</h1>

            <p>

              Registre novas vendas e acompanhe todo o histórico da empresa.

            </p>

          </div>

        </div>

        {erro && (

          <div className="vendas-erro" role="alert">

            {erro}

          </div>

        )}

        <div

          className="vendas-abas"

          role="tablist"

          aria-label="Áreas de vendas"

        >

          <button

            className={`vendas-aba ${

              abaAtiva === "caixa" ? "vendas-aba-ativa" : ""

            }`}

            type="button"

            role="tab"

            aria-selected={abaAtiva === "caixa"}

            onClick={() => {

              setVendaConcluida(null);

              setAbaAtiva("caixa");

            }}

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

            onClick={() => {

              setVendaConcluida(null);

              setAbaAtiva("historico");

            }}

          >

            <span aria-hidden="true">📋</span>

            Histórico

          </button>

        </div>

        {abaAtiva === "caixa" && !vendaConcluida && (

          <div className="vendas-caixa">

            <VendaForm

              modo="embutido"

              aberto

              empresaId={empresa?.id}

              onVendaFinalizada={handleVendaFinalizada}

            />

          </div>

        )}

        {abaAtiva === "caixa" && vendaConcluida && (

          <div className="vendas-sucesso">

            <div className="vendas-sucesso-icone">✓</div>

            <span className="vendas-sucesso-etiqueta">VENDA CONCLUÍDA</span>

            <h2>Venda finalizada com sucesso</h2>

            <p>

              O estoque e os dados financeiros da venda já foram atualizados.

            </p>

            <div className="vendas-sucesso-resumo">

              <div>

                <span>Total</span>

                <strong>{formatarMoeda(vendaConcluida.total)}</strong>

              </div>

              <div>

                <span>Pagamento</span>

                <strong>

                  {formatarFormaPagamento(vendaConcluida.pagamento?.tipo)}

                </strong>

              </div>

              {vendaConcluida.pagamento?.tipo === "dinheiro" && (

                <>

                  <div>

                    <span>Recebido</span>

                    <strong>

                      {formatarMoeda(vendaConcluida.pagamento.valorRecebido)}

                    </strong>

                  </div>

                  <div>

                    <span>Troco</span>

                    <strong className="vendas-sucesso-troco">

                      {formatarMoeda(vendaConcluida.pagamento.troco)}

                    </strong>

                  </div>

                </>

              )}

            </div>

            <div className="vendas-sucesso-acoes">

              <button

                type="button"

                className="vendas-sucesso-comprovante"

                onClick={handleGerarComprovante}

              >

                🧾 Gerar comprovante

              </button>

              <button

                type="button"

                className="vendas-sucesso-nova"

                onClick={handleNovaVenda}

              >

                + Nova venda

              </button>

              <button

                type="button"

                className="vendas-sucesso-historico"

                onClick={handleVerHistorico}

              >

                Ver histórico

              </button>

            </div>

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
                <>
                  <div className="vendas-historico-lista">

                  {vendasVisiveis.map((venda) => {

                    const vendaCancelada = ["cancelada", "cancelado"].includes(

                      venda.status,

                    );

                    return (

                      <article

                        key={venda.id}

                        className={`vendas-historico-card ${

                          vendaCancelada

                            ? "vendas-historico-card-cancelada"

                            : ""

                        }`}

                      >

                        <div className="vendas-historico-card-topo">

                          <div className="vendas-historico-card-data">

                            <span>Venda realizada</span>

                            <strong>{formatarData(venda.created_at)}</strong>

                          </div>

                          <span

                            className={`vendas-status vendas-status-${venda.status}`}

                          >

                            {formatarStatus(venda.status)}

                          </span>

                        </div>

                        <div className="vendas-historico-card-dados">

                          <div className="vendas-historico-card-dado">

                            <span>Pagamento</span>

                            <strong>

                              {formatarFormaPagamento(venda.forma_pagamento)}

                            </strong>

                          </div>

                          <div className="vendas-historico-card-dado">

                            <span>Total</span>

                            <strong className="vendas-historico-card-total">

                              {formatarMoeda(venda.total)}

                            </strong>

                          </div>

                          <div className="vendas-historico-card-dado">

                            <span>Lucro</span>

                            <strong>{formatarMoeda(venda.lucro)}</strong>

                          </div>

                        </div>

                        {vendaCancelada && venda.motivo_cancelamento && (

                          <div className="vendas-historico-cancelamento">

                            <span>Motivo do cancelamento</span>

                            <p>{venda.motivo_cancelamento}</p>

                          </div>

                        )}

                        <div className="vendas-historico-card-rodape">

                          <span

                            className="vendas-historico-card-id"

                            title={venda.id}

                          >

                            ID: {venda.id}

                          </span>

                          <button

                            className="vendas-detalhes"

                            type="button"

                            onClick={() => setVendaDetalhesId(venda.id)}

                          >

                            Ver detalhes

                          </button>

                        </div>

                      </article>

                    );

                  })}

                </div>

                {possuiMaisVendas && (

                  <div className="vendas-historico-acoes">

                    <button

                      type="button"

                      className="vendas-historico-ver-mais"

                      onClick={mostrarMaisVendas}

                    >

                      Ver mais 6 registros

                    </button>

                  </div>

                )}
                </>
              )}

            </div>

          </>

        )}

      </section>

      <VendaDetalhes

        aberto={Boolean(vendaDetalhesId)}

        empresaId={empresa?.id}

        empresa={empresa}

        vendaId={vendaDetalhesId}

        onFechar={() => setVendaDetalhesId(null)}

        onVendaCancelada={carregarVendas}

      />

    </>

  );

}

export default Vendas;
