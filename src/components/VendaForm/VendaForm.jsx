import { useEffect, useMemo, useState } from "react";

import Modal from "../Modal/Modal";
import { listarProdutos } from "../../services/produtos";
import {
  finalizarVenda,
  TIPOS_PAGAMENTO,
} from "../../services/vendas";

import "./VendaForm.css";

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

function obterNomePagamento(tipo) {
  const nomes = {
    dinheiro: "Dinheiro",
    pix: "Pix",
    debito: "Débito",
    credito: "Crédito",
    transferencia: "Transferência",
    outro: "Outro",
  };

  return nomes[tipo] || tipo;
}

function unidadeExigeQuantidadeInteira(unidade) {
  return ["UN", "CX", "PCT"].includes(
    String(unidade ?? "").trim().toUpperCase(),
  );
}

function obterPassoQuantidade(unidade) {
  return unidadeExigeQuantidadeInteira(unidade) ? 1 : 0.001;
}

function VendaForm({
  aberto = false,
  modo = "modal",
  onFechar,
  empresaId,
  onVendaFinalizada,
}) {
  const embutido = modo === "embutido";
  const ativo = embutido || aberto;

  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [itens, setItens] = useState([]);
  const [desconto, setDesconto] = useState("0");
  const [acrescimo, setAcrescimo] = useState("0");
  const [tipoPagamento, setTipoPagamento] = useState("pix");
  const [valorRecebido, setValorRecebido] = useState("");
  const [parcelas, setParcelas] = useState("1");
  const [observacoes, setObservacoes] = useState("");
  const [empresaProdutosId, setEmpresaProdutosId] = useState(null);
  const [empresaConsultadaId, setEmpresaConsultadaId] = useState(null);
  const [finalizando, setFinalizando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!ativo || !empresaId) {
      return;
    }

    let cancelado = false;

    listarProdutos(empresaId)
      .then((dados) => {
        if (cancelado) return;

        const ativos = (dados ?? []).filter(
          (produto) => produto.ativo === true,
        );

        setProdutos(ativos);
        setEmpresaProdutosId(empresaId);
        setErro("");
      })
      .catch((error) => {
        if (cancelado) return;

        console.error("Erro ao carregar produtos para venda:", error);
        setErro("Não foi possível carregar os produtos.");
      })
      .finally(() => {
        if (cancelado) return;
        setEmpresaConsultadaId(empresaId);
      });

    return () => {
      cancelado = true;
    };
  }, [ativo, empresaId]);

  const produtosSaoDaEmpresaAtual =
    Boolean(empresaId) && empresaProdutosId === empresaId;

  const produtosDisponiveis = produtosSaoDaEmpresaAtual ? produtos : [];

  const loadingProdutos = Boolean(
    ativo && empresaId && empresaConsultadaId !== empresaId,
  );

  const subtotal = useMemo(() => {
    return itens.reduce(
      (totalAtual, item) =>
        totalAtual +
        Number(item.precoVenda) * Number(item.quantidade) -
        Number(item.desconto || 0),
      0,
    );
  }, [itens]);

  const total = useMemo(() => {
    return Math.max(
      0,
      subtotal - Number(desconto || 0) + Number(acrescimo || 0),
    );
  }, [subtotal, desconto, acrescimo]);

  const resumoDinheiro = useMemo(() => {
    if (tipoPagamento !== "dinheiro" || valorRecebido === "") {
      return {
        recebido: 0,
        faltante: total,
        troco: 0,
        suficiente: false,
        informado: false,
      };
    }

    const recebido = Number(valorRecebido);

    if (!Number.isFinite(recebido) || recebido < 0) {
      return {
        recebido: 0,
        faltante: total,
        troco: 0,
        suficiente: false,
        informado: false,
      };
    }

    const diferenca = recebido - total;

    return {
      recebido,
      faltante: diferenca < 0 ? Math.abs(diferenca) : 0,
      troco: diferenca > 0 ? diferenca : 0,
      suficiente: recebido >= total,
      informado: true,
    };
  }, [tipoPagamento, valorRecebido, total]);

  function adicionarProduto() {
    setErro("");

    if (!produtoSelecionadoId) {
      setErro("Selecione um produto.");
      return;
    }

    const produto = produtosDisponiveis.find(
      (item) => item.id === produtoSelecionadoId,
    );

    if (!produto) {
      setErro("Produto não encontrado.");
      return;
    }

    if (itens.some((item) => item.produtoId === produto.id)) {
      setErro("Esse produto já foi adicionado à venda.");
      return;
    }

    if (Number(produto.estoque_atual) <= 0) {
      setErro("Esse produto está sem estoque.");
      return;
    }

    setItens((atuais) => [
      ...atuais,
      {
        produtoId: produto.id,
        nome: produto.nome,
        unidade: produto.unidade,
        quantidade: 1,
        precoVenda: Number(produto.preco_venda),
        desconto: 0,
        estoqueAtual: Number(produto.estoque_atual),
      },
    ]);

    setProdutoSelecionadoId("");
  }

  function atualizarQuantidade(produtoId, valor) {
    const quantidade = Number(valor);

    setItens((atuais) =>
      atuais.map((item) =>
        item.produtoId === produtoId
          ? { ...item, quantidade }
          : item,
      ),
    );
  }

  function diminuirQuantidade(produtoId) {
    setItens((atuais) =>
      atuais.map((item) => {
        if (item.produtoId !== produtoId) {
          return item;
        }

        const passo = obterPassoQuantidade(item.unidade);
        const quantidadeAtual = Number(item.quantidade) || passo;

        return {
          ...item,
          quantidade: Math.max(
            passo,
            Number((quantidadeAtual - passo).toFixed(3)),
          ),
        };
      }),
    );
  }

  function aumentarQuantidade(produtoId) {
    setItens((atuais) =>
      atuais.map((item) => {
        if (item.produtoId !== produtoId) {
          return item;
        }

        const passo = obterPassoQuantidade(item.unidade);
        const quantidadeAtual = Number(item.quantidade) || 0;

        return {
          ...item,
          quantidade: Math.min(
            Number(item.estoqueAtual),
            Number((quantidadeAtual + passo).toFixed(3)),
          ),
        };
      }),
    );
  }

  function atualizarDescontoItem(produtoId, valor) {
    const descontoItem = Number(valor);

    setItens((atuais) =>
      atuais.map((item) =>
        item.produtoId === produtoId
          ? { ...item, desconto: descontoItem }
          : item,
      ),
    );
  }

  function removerItem(produtoId) {
    setItens((atuais) =>
      atuais.filter((item) => item.produtoId !== produtoId),
    );
  }

  function limparFormulario() {
    setProdutoSelecionadoId("");
    setItens([]);
    setDesconto("0");
    setAcrescimo("0");
    setTipoPagamento("pix");
    setValorRecebido("");
    setParcelas("1");
    setObservacoes("");
    setErro("");
  }

  function handleCancelar() {
    if (finalizando) return;

    limparFormulario();

    if (!embutido) {
      onFechar?.();
    }
  }

  async function handleFinalizarVenda() {
    if (finalizando) return;

    setErro("");

    if (itens.length === 0) {
      setErro("Adicione pelo menos um produto à venda.");
      return;
    }

    for (const item of itens) {
      const quantidade = Number(item.quantidade);

      if (!Number.isFinite(quantidade) || quantidade <= 0) {
        setErro(`Informe uma quantidade válida para ${item.nome}.`);
        return;
      }

      if (
        unidadeExigeQuantidadeInteira(item.unidade) &&
        !Number.isInteger(quantidade)
      ) {
        setErro(
          `${item.nome} usa ${item.unidade} e precisa de quantidade inteira.`,
        );
        return;
      }

      if (quantidade > Number(item.estoqueAtual)) {
        setErro(`Estoque insuficiente para ${item.nome}.`);
        return;
      }

      const valorBruto = Number(item.precoVenda) * quantidade;
      const descontoItem = Number(item.desconto || 0);

      if (!Number.isFinite(descontoItem) || descontoItem < 0) {
        setErro(`Informe um desconto válido para ${item.nome}.`);
        return;
      }

      if (descontoItem > valorBruto) {
        setErro(
          `O desconto de ${item.nome} não pode ser maior que o valor do item.`,
        );
        return;
      }
    }

    const descontoGeral = Number(desconto || 0);
    const acrescimoGeral = Number(acrescimo || 0);

    if (!Number.isFinite(descontoGeral) || descontoGeral < 0) {
      setErro("Informe um desconto geral válido.");
      return;
    }

    if (!Number.isFinite(acrescimoGeral) || acrescimoGeral < 0) {
      setErro("Informe um acréscimo válido.");
      return;
    }

    if (descontoGeral > subtotal + acrescimoGeral) {
      setErro("O desconto geral não pode deixar o total da venda negativo.");
      return;
    }

    if (total <= 0) {
      setErro("O total da venda deve ser maior que zero.");
      return;
    }

    if (tipoPagamento === "credito") {
      const parcelasNumero = Number(parcelas);

      if (!Number.isInteger(parcelasNumero) || parcelasNumero < 1) {
        setErro("Informe uma quantidade de parcelas válida.");
        return;
      }
    }

    if (tipoPagamento === "dinheiro") {
      const recebido = Number(valorRecebido);

      if (
        valorRecebido === "" ||
        !Number.isFinite(recebido) ||
        recebido < 0
      ) {
        setErro("Informe o valor recebido.");
        return;
      }

      if (recebido < total) {
        setErro(
          `Ainda faltam ${formatarMoeda(total - recebido)} para concluir a venda.`,
        );
        return;
      }
    }

    const pagamento = {
      tipo: tipoPagamento,
      valor: total,
      parcelas: tipoPagamento === "credito" ? Number(parcelas) : 1,
    };

    if (tipoPagamento === "dinheiro") {
      pagamento.valorRecebido = Number(valorRecebido);
    }

    setFinalizando(true);

    try {
      const resultado = await finalizarVenda({
        empresaId,
        itens: itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: Number(item.quantidade),
          desconto: Number(item.desconto || 0),
        })),
        pagamentos: [pagamento],
        desconto: descontoGeral,
        acrescimo: acrescimoGeral,
        observacoes,
      });

      const vendaFinalizada = {
        resultado,
        itens: itens.map((item) => ({ ...item })),
        subtotal,
        desconto: descontoGeral,
        acrescimo: acrescimoGeral,
        total,
        pagamento: {
          ...pagamento,
          valorRecebido:
            tipoPagamento === "dinheiro"
              ? Number(valorRecebido)
              : null,
          troco:
            tipoPagamento === "dinheiro"
              ? resumoDinheiro.troco
              : 0,
        },
        observacoes,
        finalizadaEm: new Date().toISOString(),
      };

      limparFormulario();

      await onVendaFinalizada?.(vendaFinalizada);

      if (!embutido) {
        onFechar?.();
      }
    } catch (error) {
      console.error("Erro ao finalizar venda:", error);

      setErro(
        error?.message ||
          "Não foi possível finalizar a venda.",
      );
    } finally {
      setFinalizando(false);
    }
  }

  const conteudo = (
    <div
      className={`venda-form ${
        embutido ? "venda-form-embutido" : ""
      }`}
    >
      {erro && (
        <div className="venda-form-erro" role="alert">
          {erro}
        </div>
      )}

      {embutido && (
        <div className="venda-form-caixa-header">
          <div>
            <span>CAIXA</span>
            <h2>Nova venda</h2>
            <p>Adicione os produtos e finalize o pagamento.</p>
          </div>

          <div className="venda-form-caixa-status">
            <span>Itens</span>
            <strong>{itens.length}</strong>
          </div>
        </div>
      )}

      <div className={embutido ? "venda-form-caixa-layout" : ""}>
        <div className="venda-form-caixa-principal">
          <section className="venda-form-secao">
            <div className="venda-form-secao-header">
              <div>
                <h3>Produtos</h3>
                <p>Adicione os produtos que fazem parte da venda.</p>
              </div>
            </div>

            <div className="venda-form-adicionar">
              <select
                value={produtoSelecionadoId}
                onChange={(event) =>
                  setProdutoSelecionadoId(event.target.value)
                }
                disabled={loadingProdutos || finalizando}
              >
                <option value="">
                  {loadingProdutos
                    ? "Carregando produtos..."
                    : "Selecione um produto"}
                </option>

                {produtosDisponiveis.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome} — {formatarMoeda(produto.preco_venda)} —
                    Estoque: {produto.estoque_atual} {produto.unidade}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={adicionarProduto}
                disabled={loadingProdutos || finalizando}
              >
                Adicionar
              </button>
            </div>

            {itens.length === 0 ? (
              <div className="venda-form-vazio">
                Nenhum produto adicionado.
              </div>
            ) : (
              <div className="venda-form-itens">
                {itens.map((item) => {
                  const totalItem =
                    Number(item.precoVenda) * Number(item.quantidade) -
                    Number(item.desconto || 0);

                  const passoQuantidade = obterPassoQuantidade(item.unidade);

                  return (
                    <article
                      key={item.produtoId}
                      className="venda-form-item"
                    >
                      <div className="venda-form-item-topo">
                        <div>
                          <strong>{item.nome}</strong>
                          <span>
                            Estoque disponível: {item.estoqueAtual}{" "}
                            {item.unidade}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removerItem(item.produtoId)}
                          disabled={finalizando}
                        >
                          Remover
                        </button>
                      </div>

                      <div className="venda-form-item-grid">
                        <label>
                          <span>Quantidade</span>

                          <div className="venda-form-quantidade">
                            <button
                              type="button"
                              onClick={() =>
                                diminuirQuantidade(item.produtoId)
                              }
                              disabled={
                                finalizando ||
                                Number(item.quantidade) <= passoQuantidade
                              }
                              aria-label={`Diminuir quantidade de ${item.nome}`}
                            >
                              −
                            </button>

                            <input
                              type="number"
                              min={passoQuantidade}
                              step={passoQuantidade}
                              value={item.quantidade}
                              onChange={(event) =>
                                atualizarQuantidade(
                                  item.produtoId,
                                  event.target.value,
                                )
                              }
                              disabled={finalizando}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                aumentarQuantidade(item.produtoId)
                              }
                              disabled={
                                finalizando ||
                                Number(item.quantidade) >=
                                  Number(item.estoqueAtual)
                              }
                              aria-label={`Aumentar quantidade de ${item.nome}`}
                            >
                              +
                            </button>
                          </div>
                        </label>

                        <label>
                          <span>Preço</span>
                          <input
                            type="text"
                            value={formatarMoeda(item.precoVenda)}
                            readOnly
                          />
                        </label>

                        <label>
                          <span>Desconto</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.desconto}
                            onChange={(event) =>
                              atualizarDescontoItem(
                                item.produtoId,
                                event.target.value,
                              )
                            }
                            disabled={finalizando}
                          />
                        </label>

                        <div className="venda-form-item-total">
                          <span>Total</span>
                          <strong>{formatarMoeda(totalItem)}</strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="venda-form-secao">
            <h3>Ajustes da venda</h3>

            <div className="venda-form-grid">
              <label>
                <span>Desconto geral</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={desconto}
                  onChange={(event) =>
                    setDesconto(event.target.value)
                  }
                  disabled={finalizando}
                />
              </label>

              <label>
                <span>Acréscimo</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={acrescimo}
                  onChange={(event) =>
                    setAcrescimo(event.target.value)
                  }
                  disabled={finalizando}
                />
              </label>
            </div>
          </section>

          <section className="venda-form-secao">
            <label className="venda-form-observacoes">
              <span>Observações</span>
              <textarea
                value={observacoes}
                onChange={(event) =>
                  setObservacoes(event.target.value)
                }
                maxLength={1000}
                placeholder="Informações adicionais sobre a venda."
                disabled={finalizando}
              />
              <small>{observacoes.length}/1000</small>
            </label>
          </section>
        </div>

        <aside className="venda-form-caixa-resumo">
          <section className="venda-form-secao">
            <h3>Pagamento</h3>

            <div className="venda-form-grid venda-form-grid-pagamento">
              <label>
                <span>Forma de pagamento</span>

                <select
                  value={tipoPagamento}
                  onChange={(event) => {
                    setTipoPagamento(event.target.value);
                    setValorRecebido("");
                    setParcelas("1");
                  }}
                  disabled={finalizando}
                >
                  {TIPOS_PAGAMENTO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {obterNomePagamento(tipo)}
                    </option>
                  ))}
                </select>
              </label>

              {tipoPagamento === "credito" && (
                <label>
                  <span>Parcelas</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={parcelas}
                    onChange={(event) =>
                      setParcelas(event.target.value)
                    }
                    disabled={finalizando}
                  />
                </label>
              )}

              {tipoPagamento === "dinheiro" && (
                <>
                  <label>
                    <span>Valor recebido</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={valorRecebido}
                      onChange={(event) =>
                        setValorRecebido(event.target.value)
                      }
                      placeholder="Ex.: 100,00"
                      disabled={finalizando}
                    />
                  </label>

                  <div
                    className={`venda-form-troco ${
                      resumoDinheiro.informado &&
                      !resumoDinheiro.suficiente
                        ? "venda-form-troco-faltando"
                        : ""
                    }`}
                  >
                    <span>
                      {!resumoDinheiro.informado ||
                      resumoDinheiro.suficiente
                        ? "Troco"
                        : "Faltam"}
                    </span>

                    <strong>
                      {formatarMoeda(
                        resumoDinheiro.informado
                          ? resumoDinheiro.suficiente
                            ? resumoDinheiro.troco
                            : resumoDinheiro.faltante
                          : 0,
                      )}
                    </strong>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="venda-form-resumo">
            <div>
              <span>Subtotal</span>
              <strong>{formatarMoeda(subtotal)}</strong>
            </div>

            <div>
              <span>Desconto</span>
              <strong>- {formatarMoeda(desconto)}</strong>
            </div>

            <div>
              <span>Acréscimo</span>
              <strong>+ {formatarMoeda(acrescimo)}</strong>
            </div>

            <div className="venda-form-total">
              <span>Total</span>
              <strong>{formatarMoeda(total)}</strong>
            </div>
          </section>

          <div className="venda-form-acoes">
            <button
              type="button"
              className="venda-form-cancelar"
              onClick={handleCancelar}
              disabled={finalizando}
            >
              Limpar venda
            </button>

            <button
              type="button"
              className="venda-form-finalizar"
              onClick={handleFinalizarVenda}
              disabled={finalizando || itens.length === 0}
            >
              {finalizando
                ? "Finalizando..."
                : `Finalizar venda — ${formatarMoeda(total)}`}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );

  if (embutido) {
    return conteudo;
  }

  return (
    <Modal
      aberto={aberto}
      titulo="Nova venda"
      onFechar={handleCancelar}
    >
      {conteudo}
    </Modal>
  );
}

export default VendaForm;
