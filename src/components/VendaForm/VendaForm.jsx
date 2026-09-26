import { useEffect, useMemo, useState } from "react";

import Modal from "../Modal/Modal";

import { listarProdutos } from "../../services/produtos";

import { finalizarVenda, TIPOS_PAGAMENTO } from "../../services/vendas";

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

function VendaForm({ aberto, onFechar, empresaId, onVendaFinalizada }) {
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
    if (!aberto || !empresaId) {
      return;
    }

    let cancelado = false;

    listarProdutos(empresaId)
      .then((dados) => {
        if (cancelado) {
          return;
        }

        const ativos = (dados ?? []).filter(
          (produto) => produto.ativo === true,
        );

        setProdutos(ativos);

        setEmpresaProdutosId(empresaId);

        setErro("");
      })
      .catch((error) => {
        if (cancelado) {
          return;
        }

        console.error("Erro ao carregar produtos para venda:", error);

        setErro("Não foi possível carregar os produtos.");
      })
      .finally(() => {
        if (cancelado) {
          return;
        }

        setEmpresaConsultadaId(empresaId);
      });

    return () => {
      cancelado = true;
    };
  }, [aberto, empresaId]);

  const produtosSaoDaEmpresaAtual =
    Boolean(empresaId) && empresaProdutosId === empresaId;

  const produtosDisponiveis = produtosSaoDaEmpresaAtual ? produtos : [];

  const loadingProdutos = Boolean(
    aberto && empresaId && empresaConsultadaId !== empresaId,
  );

  const subtotal = useMemo(() => {
    return itens.reduce(
      (total, item) =>
        total +
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
          ? {
              ...item,
              quantidade: quantidade,
            }
          : item,
      ),
    );
  }

  function atualizarDescontoItem(produtoId, valor) {
    const descontoItem = Number(valor);

    setItens((atuais) =>
      atuais.map((item) =>
        item.produtoId === produtoId
          ? {
              ...item,
              desconto: descontoItem,
            }
          : item,
      ),
    );
  }

  function removerItem(produtoId) {
    setItens((atuais) => atuais.filter((item) => item.produtoId !== produtoId));
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

  function handleFechar() {
    if (finalizando) {
      return;
    }

    limparFormulario();

    onFechar?.();
  }

  async function handleFinalizarVenda() {
    if (finalizando) {
      return;
    }

    setErro("");

    if (itens.length === 0) {
      setErro("Adicione pelo menos um produto à venda.");

      return;
    }

    for (const item of itens) {
      if (
        !Number.isFinite(Number(item.quantidade)) ||
        Number(item.quantidade) <= 0
      ) {
        setErro(`Informe uma quantidade válida para ${item.nome}.`);

        return;
      }

      if (Number(item.quantidade) > Number(item.estoqueAtual)) {
        setErro(`Estoque insuficiente para ${item.nome}.`);

        return;
      }

      const valorBruto = Number(item.precoVenda) * Number(item.quantidade);

      if (Number(item.desconto || 0) > valorBruto) {
        setErro(
          `O desconto de ${item.nome} não pode ser maior que o valor do item.`,
        );

        return;
      }
    }

    if (total <= 0) {
      setErro("O total da venda deve ser maior que zero.");

      return;
    }

    const pagamento = {
      tipo: tipoPagamento,
      valor: total,
      parcelas: tipoPagamento === "credito" ? Number(parcelas) || 1 : 1,
    };

    if (tipoPagamento === "dinheiro") {
      pagamento.valorRecebido = valorRecebido;
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

        desconto: Number(desconto || 0),

        acrescimo: Number(acrescimo || 0),

        observacoes,
      });

      limparFormulario();

      await onVendaFinalizada?.(resultado);

      onFechar?.();
    } catch (error) {
      console.error("Erro ao finalizar venda:", error);

      setErro(error?.message || "Não foi possível finalizar a venda.");
    } finally {
      setFinalizando(false);
    }
  }

  return (
    <Modal aberto={aberto} titulo="Nova venda" onFechar={handleFechar}>
      <div className="venda-form">
        {erro && (
          <div className="venda-form-erro" role="alert">
            {erro}
          </div>
        )}

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
              onChange={(event) => setProdutoSelecionadoId(event.target.value)}
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
            <div className="venda-form-vazio">Nenhum produto adicionado.</div>
          ) : (
            <div className="venda-form-itens">
              {itens.map((item) => {
                const totalItem =
                  Number(item.precoVenda) * Number(item.quantidade) -
                  Number(item.desconto || 0);

                return (
                  <article key={item.produtoId} className="venda-form-item">
                    <div className="venda-form-item-topo">
                      <div>
                        <strong>{item.nome}</strong>

                        <span>
                          Estoque disponível: {item.estoqueAtual} {item.unidade}
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

                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={item.quantidade}
                          onChange={(event) =>
                            atualizarQuantidade(
                              item.produtoId,
                              event.target.value,
                            )
                          }
                          disabled={finalizando}
                        />
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
                onChange={(event) => setDesconto(event.target.value)}
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
                onChange={(event) => setAcrescimo(event.target.value)}
                disabled={finalizando}
              />
            </label>
          </div>
        </section>

        <section className="venda-form-secao">
          <h3>Pagamento</h3>

          <div className="venda-form-grid">
            <label>
              <span>Forma de pagamento</span>

              <select
                value={tipoPagamento}
                onChange={(event) => {
                  const novoTipo = event.target.value;

                  setTipoPagamento(novoTipo);

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
                  onChange={(event) => setParcelas(event.target.value)}
                  disabled={finalizando}
                />
              </label>
            )}

            {tipoPagamento === "dinheiro" && (
              <label>
                <span>Valor recebido</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorRecebido}
                  onChange={(event) => setValorRecebido(event.target.value)}
                  placeholder={formatarMoeda(total)}
                  disabled={finalizando}
                />
              </label>
            )}
          </div>
        </section>

        <section className="venda-form-secao">
          <label className="venda-form-observacoes">
            <span>Observações</span>

            <textarea
              value={observacoes}
              onChange={(event) => setObservacoes(event.target.value)}
              maxLength={1000}
              placeholder="Informações adicionais sobre a venda."
              disabled={finalizando}
            />

            <small>
              {observacoes.length}
              /1000
            </small>
          </label>
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
            onClick={handleFechar}
            disabled={finalizando}
          >
            Cancelar
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
      </div>
    </Modal>
  );
}

export default VendaForm;
