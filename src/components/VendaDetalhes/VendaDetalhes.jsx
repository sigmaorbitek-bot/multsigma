import {
  useEffect,
  useState,
} from "react";

import Modal from "../Modal/Modal";

import {
  cancelarVenda,
  obterVenda,
} from "../../services/vendas";

import {
  formatarDataComprovante,
  formatarMoedaComprovante,
  formatarPagamentoComprovante,
  gerarComprovanteVenda,
} from "../../utils/comprovanteVenda";

import "./VendaDetalhes.css";

function formatarStatus(status) {
  const nomes = {
    concluida: "Concluída",
    concluido: "Concluída",
    cancelada: "Cancelada",
    cancelado: "Cancelada",
  };

  return nomes[status] || status || "—";
}

function vendaPodeSerCancelada(status) {
  return ["concluida", "concluido"].includes(status);
}

function VendaDetalhes({
  aberto,
  empresaId,
  empresa,
  vendaId,
  onFechar,
  onVendaCancelada,
}) {
  const [venda, setVenda] = useState(null);
  const [vendaCarregadaId, setVendaCarregadaId] = useState(null);
  const [vendaConsultadaId, setVendaConsultadaId] = useState(null);
  const [erro, setErro] = useState("");

  const [confirmandoCancelamento, setConfirmandoCancelamento] =
    useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [erroCancelamento, setErroCancelamento] = useState("");

  useEffect(() => {
    if (!aberto || !empresaId || !vendaId) {
      return;
    }

    let cancelado = false;

    obterVenda({
      empresaId,
      vendaId,
    })
      .then((dados) => {
        if (cancelado) {
          return;
        }

        setVenda(dados);
        setVendaCarregadaId(vendaId);
        setErro("");
      })
      .catch((error) => {
        if (cancelado) {
          return;
        }

        console.error(
          "Erro ao carregar detalhes da venda:",
          error,
        );

        setErro(
          "Não foi possível carregar os detalhes da venda.",
        );
      })
      .finally(() => {
        if (cancelado) {
          return;
        }

        setVendaConsultadaId(vendaId);
      });

    return () => {
      cancelado = true;
    };
  }, [
    aberto,
    empresaId,
    vendaId,
  ]);

  const dadosSaoDaVendaAtual =
    Boolean(vendaId) &&
    vendaCarregadaId === vendaId;

  const vendaAtual =
    dadosSaoDaVendaAtual
      ? venda
      : null;

  const loading =
    Boolean(
      aberto &&
        vendaId &&
        vendaConsultadaId !== vendaId,
    );

  function fecharDetalhes() {
    if (cancelando) {
      return;
    }

    setConfirmandoCancelamento(false);
    setMotivoCancelamento("");
    setErroCancelamento("");

    onFechar?.();
  }

  function imprimirComprovante() {
    if (!vendaAtual) {
      return;
    }

    gerarComprovanteVenda({
      empresa,
      venda: vendaAtual,
    });
  }

  function iniciarCancelamento() {
    setConfirmandoCancelamento(true);
    setMotivoCancelamento("");
    setErroCancelamento("");
  }

  function desistirCancelamento() {
    if (cancelando) {
      return;
    }

    setConfirmandoCancelamento(false);
    setMotivoCancelamento("");
    setErroCancelamento("");
  }

  async function confirmarCancelamentoVenda() {
    if (!vendaAtual || cancelando) {
      return;
    }

    const motivo = motivoCancelamento.trim();

    if (motivo.length < 3) {
      setErroCancelamento(
        "Informe o motivo do cancelamento.",
      );

      return;
    }

    setCancelando(true);
    setErroCancelamento("");

    try {
      await cancelarVenda({
        empresaId,
        vendaId: vendaAtual.id,
        motivo,
      });

      const vendaAtualizada = await obterVenda({
        empresaId,
        vendaId: vendaAtual.id,
      });

      setVenda(vendaAtualizada);
      setVendaCarregadaId(vendaAtual.id);
      setVendaConsultadaId(vendaAtual.id);

      setConfirmandoCancelamento(false);
      setMotivoCancelamento("");

      await onVendaCancelada?.(vendaAtualizada);
    } catch (error) {
      console.error(
        "Erro ao cancelar venda:",
        error,
      );

      setErroCancelamento(
        error?.message ||
          "Não foi possível cancelar a venda.",
      );
    } finally {
      setCancelando(false);
    }
  }

  return (
    <Modal
      aberto={aberto}
      titulo="Detalhes da venda"
      onFechar={fecharDetalhes}
    >
      <div className="venda-detalhes">
        {loading && (
          <div className="venda-detalhes-estado">
            Carregando detalhes...
          </div>
        )}

        {!loading && erro && (
          <div
            className="venda-detalhes-erro"
            role="alert"
          >
            {erro}
          </div>
        )}

        {!loading &&
          !erro &&
          vendaAtual && (
            <>
              <div className="venda-detalhes-topo">
                <div>
                  <span>
                    Venda
                  </span>

                  <strong>
                    {formatarDataComprovante(
                      vendaAtual.created_at,
                    )}
                  </strong>

                  <small>
                    {vendaAtual.id}
                  </small>
                </div>

                <span
                  className={`venda-detalhes-status venda-detalhes-status-${vendaAtual.status}`}
                >
                  {formatarStatus(
                    vendaAtual.status,
                  )}
                </span>
              </div>

              {[
                "cancelada",
                "cancelado",
              ].includes(
                vendaAtual.status,
              ) && (
                <section className="venda-detalhes-cancelada">
                  <div>
                    <span>
                      Venda cancelada
                    </span>

                    {vendaAtual.cancelada_em && (
                      <strong>
                        {formatarDataComprovante(
                          vendaAtual.cancelada_em,
                        )}
                      </strong>
                    )}
                  </div>

                  {vendaAtual.motivo_cancelamento && (
                    <p>
                      <strong>
                        Motivo:
                      </strong>{" "}
                      {
                        vendaAtual.motivo_cancelamento
                      }
                    </p>
                  )}
                </section>
              )}

              <section className="venda-detalhes-secao">
                <div className="venda-detalhes-secao-header">
                  <h3>
                    Itens
                  </h3>

                  <span>
                    {vendaAtual.itens.length}{" "}
                    {vendaAtual.itens.length === 1
                      ? "item"
                      : "itens"}
                  </span>
                </div>

                <div className="venda-detalhes-itens">
                  {vendaAtual.itens.map(
                    (item) => (
                      <article
                        key={item.id}
                        className="venda-detalhes-item"
                      >
                        <div className="venda-detalhes-item-nome">
                          <strong>
                            {item.produto_nome}
                          </strong>
                        </div>

                        <div className="venda-detalhes-item-grid">
                          <div>
                            <span>
                              Quantidade
                            </span>

                            <strong>
                              {item.quantidade}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Preço
                            </span>

                            <strong>
                              {formatarMoedaComprovante(
                                item.preco_unitario,
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Desconto
                            </span>

                            <strong>
                              {formatarMoedaComprovante(
                                item.desconto,
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Total
                            </span>

                            <strong>
                              {formatarMoedaComprovante(
                                item.total,
                              )}
                            </strong>
                          </div>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              </section>

              <section className="venda-detalhes-secao">
                <div className="venda-detalhes-secao-header">
                  <h3>
                    Pagamento
                  </h3>

                  <span>
                    {vendaAtual.pagamentos.length}{" "}
                    {vendaAtual.pagamentos.length === 1
                      ? "forma"
                      : "formas"}
                  </span>
                </div>

                <div className="venda-detalhes-pagamentos">
                  {vendaAtual.pagamentos.map(
                    (pagamento) => (
                      <article
                        key={pagamento.id}
                        className="venda-detalhes-pagamento"
                      >
                        <div>
                          <span>
                            Forma
                          </span>

                          <strong>
                            {formatarPagamentoComprovante(
                              pagamento.tipo,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Valor
                          </span>

                          <strong>
                            {formatarMoedaComprovante(
                              pagamento.valor,
                            )}
                          </strong>
                        </div>

                        {pagamento.tipo === "credito" && (
                          <div>
                            <span>
                              Parcelas
                            </span>

                            <strong>
                              {pagamento.parcelas}x
                            </strong>
                          </div>
                        )}

                        {pagamento.tipo === "dinheiro" && (
                          <>
                            <div>
                              <span>
                                Recebido
                              </span>

                              <strong>
                                {formatarMoedaComprovante(
                                  pagamento.valor_recebido,
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Troco
                              </span>

                              <strong className="venda-detalhes-troco">
                                {formatarMoedaComprovante(
                                  pagamento.troco,
                                )}
                              </strong>
                            </div>
                          </>
                        )}
                      </article>
                    ),
                  )}
                </div>
              </section>

              <section className="venda-detalhes-resumo">
                <div>
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {formatarMoedaComprovante(
                      vendaAtual.subtotal,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Desconto
                  </span>

                  <strong>
                    -{" "}
                    {formatarMoedaComprovante(
                      vendaAtual.desconto,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Acréscimo
                  </span>

                  <strong>
                    +{" "}
                    {formatarMoedaComprovante(
                      vendaAtual.acrescimo,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Lucro
                  </span>

                  <strong>
                    {formatarMoedaComprovante(
                      vendaAtual.lucro,
                    )}
                  </strong>
                </div>

                <div className="venda-detalhes-total">
                  <span>
                    Total
                  </span>

                  <strong>
                    {formatarMoedaComprovante(
                      vendaAtual.total,
                    )}
                  </strong>
                </div>
              </section>

              {vendaAtual.observacoes && (
                <section className="venda-detalhes-observacoes">
                  <span>
                    Observações
                  </span>

                  <p>
                    {vendaAtual.observacoes}
                  </p>
                </section>
              )}

              {confirmandoCancelamento && (
                <section className="venda-detalhes-confirmar-cancelamento">
                  <div>
                    <h3>
                      Cancelar esta venda?
                    </h3>

                    <p>
                      O estoque dos itens será devolvido automaticamente e a venda deixará de contar nos relatórios de faturamento e lucro.
                    </p>
                  </div>

                  {erroCancelamento && (
                    <div
                      className="venda-detalhes-cancelamento-erro"
                      role="alert"
                    >
                      {erroCancelamento}
                    </div>
                  )}

                  <label>
                    <span>
                      Motivo do cancelamento
                    </span>

                    <textarea
                      value={motivoCancelamento}
                      onChange={(event) =>
                        setMotivoCancelamento(
                          event.target.value,
                        )
                      }
                      maxLength={500}
                      placeholder="Ex.: Cliente desistiu da compra."
                      disabled={cancelando}
                    />

                    <small>
                      {motivoCancelamento.length}/500
                    </small>
                  </label>

                  <div className="venda-detalhes-confirmar-acoes">
                    <button
                      type="button"
                      className="venda-detalhes-desistir"
                      onClick={desistirCancelamento}
                      disabled={cancelando}
                    >
                      Voltar
                    </button>

                    <button
                      type="button"
                      className="venda-detalhes-confirmar"
                      onClick={
                        confirmarCancelamentoVenda
                      }
                      disabled={
                        cancelando ||
                        motivoCancelamento.trim().length < 3
                      }
                    >
                      {cancelando
                        ? "Cancelando..."
                        : "Confirmar cancelamento"}
                    </button>
                  </div>
                </section>
              )}

              {!confirmandoCancelamento && (
                <div className="venda-detalhes-acoes">
                  {vendaPodeSerCancelada(
                    vendaAtual.status,
                  ) && (
                    <button
                      type="button"
                      className="venda-detalhes-cancelar-venda"
                      onClick={iniciarCancelamento}
                    >
                      Cancelar venda
                    </button>
                  )}

                  <button
                    type="button"
                    className="venda-detalhes-fechar"
                    onClick={fecharDetalhes}
                  >
                    Fechar
                  </button>

                  <button
                    type="button"
                    className="venda-detalhes-imprimir"
                    onClick={imprimirComprovante}
                  >
                    🧾 Imprimir comprovante
                  </button>
                </div>
              )}
            </>
          )}
      </div>
    </Modal>
  );
}

export default VendaDetalhes;
