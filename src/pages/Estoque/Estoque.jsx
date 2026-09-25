import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../hooks/useAuth";

import Modal from "../../components/Modal/Modal";

import {
  listarProdutosEstoque,
  listarMovimentacoesEstoque,
  movimentarEstoque,
} from "../../services/estoque";

import { obterUrlImagemProduto } from "../../services/produtoImagens";

import "./Estoque.css";

async function buscarDadosEstoque(empresaId) {
  const [produtosDados, movimentacoesDados] = await Promise.all([
    listarProdutosEstoque(empresaId),

    listarMovimentacoesEstoque(empresaId),
  ]);

  return {
    produtos: produtosDados,
    movimentacoes: movimentacoesDados,
  };
}

function Estoque() {
  const { empresa } = useAuth();

  const [produtos, setProdutos] = useState([]);

  const [movimentacoes, setMovimentacoes] = useState([]);

  const [loading, setLoading] = useState(true);

  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");

  const [statusFiltro, setStatusFiltro] = useState("todos");

  const [produtoMovimentando, setProdutoMovimentando] = useState(null);

  const [tipoMovimentacao, setTipoMovimentacao] = useState("entrada");

  const [quantidade, setQuantidade] = useState("");

  const [motivo, setMotivo] = useState("");

  const [salvando, setSalvando] = useState(false);

  const [erroMovimentacao, setErroMovimentacao] = useState("");

  async function carregarDados() {
    if (!empresa?.id) {
      return;
    }

    setLoading(true);
    setErro("");

    try {
      const dados = await buscarDadosEstoque(empresa.id);

      setProdutos(dados.produtos);

      setMovimentacoes(dados.movimentacoes);
    } catch (error) {
      console.error("Erro ao carregar estoque:", error);

      setErro(error.message || "Não foi possível carregar o estoque.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!empresa?.id) {
      return;
    }

    let cancelado = false;

    async function carregarInicial() {
      try {
        const dados = await buscarDadosEstoque(empresa.id);

        if (cancelado) {
          return;
        }

        setProdutos(dados.produtos);

        setMovimentacoes(dados.movimentacoes);

        setErro("");
      } catch (error) {
        console.error("Erro ao carregar estoque:", error);

        if (!cancelado) {
          setErro(error.message || "Não foi possível carregar o estoque.");
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    }

    carregarInicial();

    return () => {
      cancelado = true;
    };
  }, [empresa?.id]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtos.filter((produto) => {
      const correspondeBusca =
        !termo ||
        produto.nome?.toLowerCase().includes(termo) ||
        produto.sku?.toLowerCase().includes(termo) ||
        produto.codigo_barras?.toLowerCase().includes(termo);

      const estoqueAtual = Number(produto.estoque_atual);

      const estoqueMinimo = Number(produto.estoque_minimo);

      const estoqueBaixo = estoqueAtual <= estoqueMinimo;

      const semEstoque = estoqueAtual <= 0;

      const correspondeStatus =
        statusFiltro === "todos" ||
        (statusFiltro === "normal" && !estoqueBaixo) ||
        (statusFiltro === "baixo" && estoqueBaixo && !semEstoque) ||
        (statusFiltro === "zerado" && semEstoque);

      return correspondeBusca && correspondeStatus;
    });
  }, [produtos, busca, statusFiltro]);

  function abrirMovimentacao(produto) {
    setProdutoMovimentando(produto);

    setTipoMovimentacao("entrada");

    setQuantidade("");

    setMotivo("");

    setErroMovimentacao("");
  }

  function fecharMovimentacao() {
    if (salvando) {
      return;
    }

    setProdutoMovimentando(null);

    setQuantidade("");

    setMotivo("");

    setErroMovimentacao("");
  }

  async function confirmarMovimentacao(event) {
    event.preventDefault();

    if (!produtoMovimentando || !empresa?.id || salvando) {
      return;
    }

    if (quantidade === "" || quantidade === null) {
      setErroMovimentacao(
        tipoMovimentacao === "ajuste"
          ? "Informe o novo estoque contado."
          : "Informe a quantidade.",
      );

      return;
    }

    const quantidadeNumero = Number(quantidade);

    if (!Number.isFinite(quantidadeNumero)) {
      setErroMovimentacao("Informe uma quantidade válida.");

      return;
    }

    if (tipoMovimentacao === "ajuste") {
      if (quantidadeNumero < 0) {
        setErroMovimentacao("O estoque ajustado não pode ser negativo.");

        return;
      }
    } else if (quantidadeNumero <= 0) {
      setErroMovimentacao("A quantidade deve ser maior que zero.");

      return;
    }

    setErroMovimentacao("");
    setSalvando(true);

    try {
      await movimentarEstoque({
        empresaId: empresa.id,

        produtoId: produtoMovimentando.id,

        tipo: tipoMovimentacao,

        quantidade: quantidadeNumero,

        motivo,
      });

      await carregarDados();

      setProdutoMovimentando(null);

      setQuantidade("");

      setMotivo("");
    } catch (error) {
      console.error("Erro ao movimentar estoque:", error);

      setErroMovimentacao(
        error.message || "Não foi possível movimentar o estoque.",
      );
    } finally {
      setSalvando(false);
    }
  }

  function obterSituacao(produto) {
    const atual = Number(produto.estoque_atual);

    const minimo = Number(produto.estoque_minimo);

    if (atual <= 0) {
      return {
        texto: "Sem estoque",

        classe: "estoque-status estoque-status-zerado",
      };
    }

    if (atual <= minimo) {
      return {
        texto: "Estoque baixo",

        classe: "estoque-status estoque-status-baixo",
      };
    }

    return {
      texto: "Normal",

      classe: "estoque-status estoque-status-normal",
    };
  }

  function formatarTipo(tipo) {
    const tipos = {
      entrada: "Entrada",
      saida: "Saída",
      ajuste: "Ajuste",
      perda: "Perda",
      devolucao: "Devolução",
    };

    return tipos[tipo] ?? tipo;
  }

  function formatarData(data) {
    return new Date(data).toLocaleString("pt-BR");
  }

  return (
    <section className="estoque-page">
      <div className="estoque-header">
        <div>
          <h1>Estoque</h1>

          <p>Acompanhe quantidades, entradas, saídas e ajustes.</p>
        </div>
      </div>

      <div className="estoque-filtros">
        <input
          id="buscaEstoque"
          name="buscaEstoque"
          type="search"
          placeholder="Buscar por nome, SKU ou código..."
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
        />

        <select
          id="statusEstoque"
          name="statusEstoque"
          value={statusFiltro}
          onChange={(event) => setStatusFiltro(event.target.value)}
        >
          <option value="todos">Todos</option>

          <option value="normal">Estoque normal</option>

          <option value="baixo">Estoque baixo</option>

          <option value="zerado">Sem estoque</option>
        </select>
      </div>

      {loading && (
        <div className="estoque-status-geral">Carregando estoque...</div>
      )}

      {!loading && erro && (
        <div className="estoque-status-geral estoque-status-erro">{erro}</div>
      )}

      {!loading && !erro && produtosFiltrados.length === 0 && (
        <div className="estoque-vazio">
          <h2>Nenhum produto encontrado</h2>

          <p>Nenhum produto corresponde aos filtros selecionados.</p>
        </div>
      )}

      {!loading && !erro && produtosFiltrados.length > 0 && (
        <div className="estoque-mobile-list">
          {produtosFiltrados.map((produto) => {
            const situacao = obterSituacao(produto);

            return (
              <article key={produto.id} className="estoque-mobile-card">
                <div className="estoque-mobile-topo">
                  {produto.imagem_path ? (
                    <img
                      src={obterUrlImagemProduto(produto.imagem_path)}
                      alt={produto.nome}
                      className="estoque-produto-imagem"
                      loading="lazy"
                    />
                  ) : (
                    <div className="estoque-produto-sem-imagem">📦</div>
                  )}

                  <div className="estoque-produto-info">
                    <strong>{produto.nome}</strong>

                    {produto.sku && <small>SKU: {produto.sku}</small>}
                  </div>
                </div>

                <div className="estoque-mobile-dados">
                  <div className="estoque-mobile-dado">
                    <span>Unidade</span>

                    <strong>{produto.unidade}</strong>
                  </div>

                  <div className="estoque-mobile-dado">
                    <span>Estoque atual</span>

                    <strong>{produto.estoque_atual}</strong>
                  </div>

                  <div className="estoque-mobile-dado">
                    <span>Estoque mínimo</span>

                    <strong>{produto.estoque_minimo}</strong>
                  </div>

                  <div className="estoque-mobile-dado">
                    <span>Situação</span>

                    <span className={situacao.classe}>{situacao.texto}</span>
                  </div>
                </div>

                <div className="estoque-mobile-acoes">
                  <button
                    type="button"
                    className="estoque-movimentar-button"
                    onClick={() => abrirMovimentacao(produto)}
                  >
                    Movimentar estoque
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="estoque-historico">
        <div className="estoque-historico-header">
          <h2>Últimas movimentações</h2>

          <span>
            {movimentacoes.length}{" "}
            {movimentacoes.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        {movimentacoes.length === 0 ? (
          <div className="estoque-historico-vazio">
            Nenhuma movimentação registrada.
          </div>
        ) : (
          <>
            <div className="estoque-historico-wrapper">
              <table className="estoque-historico-table">
                <thead>
                  <tr>
                    <th>Produto</th>

                    <th>Tipo</th>

                    <th>Quantidade</th>

                    <th>Antes</th>

                    <th>Depois</th>

                    <th>Motivo</th>

                    <th>Data</th>
                  </tr>
                </thead>

                <tbody>
                  {movimentacoes.map((movimentacao) => (
                    <tr key={movimentacao.id}>
                      <td>{movimentacao.produtos?.nome ?? "Produto"}</td>

                      <td>{formatarTipo(movimentacao.tipo)}</td>

                      <td>{movimentacao.quantidade}</td>

                      <td>{movimentacao.estoque_anterior}</td>

                      <td>{movimentacao.estoque_posterior}</td>

                      <td>{movimentacao.motivo || "-"}</td>

                      <td>{formatarData(movimentacao.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="estoque-historico-mobile-list">
              {movimentacoes.map((movimentacao) => (
                <article
                  key={movimentacao.id}
                  className="estoque-historico-mobile-card"
                >
                  <div className="estoque-historico-mobile-topo">
                    <strong>{movimentacao.produtos?.nome ?? "Produto"}</strong>

                    <span className="estoque-tipo">
                      {formatarTipo(movimentacao.tipo)}
                    </span>
                  </div>

                  <div className="estoque-historico-mobile-dados">
                    <div className="estoque-historico-mobile-dado">
                      <span>Quantidade</span>

                      <strong>{movimentacao.quantidade}</strong>
                    </div>

                    <div className="estoque-historico-mobile-dado">
                      <span>Antes</span>

                      <strong>{movimentacao.estoque_anterior}</strong>
                    </div>

                    <div className="estoque-historico-mobile-dado">
                      <span>Depois</span>

                      <strong>{movimentacao.estoque_posterior}</strong>
                    </div>

                    <div className="estoque-historico-mobile-dado">
                      <span>Data</span>

                      <strong>{formatarData(movimentacao.created_at)}</strong>
                    </div>

                    <div className="estoque-historico-mobile-dado estoque-historico-mobile-dado-full">
                      <span>Motivo</span>

                      <strong>{movimentacao.motivo || "-"}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        aberto={Boolean(produtoMovimentando)}
        titulo="Movimentar estoque"
        onFechar={fecharMovimentacao}
      >
        {produtoMovimentando && (
          <form
            className="estoque-movimentacao-form"
            onSubmit={confirmarMovimentacao}
          >
            <div className="estoque-movimentacao-produto">
              <strong>{produtoMovimentando.nome}</strong>

              <span>
                Estoque atual: {produtoMovimentando.estoque_atual}{" "}
                {produtoMovimentando.unidade}
              </span>
            </div>

            {erroMovimentacao && (
              <div className="form-error">{erroMovimentacao}</div>
            )}

            <div className="form-group">
              <label htmlFor="tipoMovimentacao">Tipo da movimentação</label>

              <select
                id="tipoMovimentacao"
                name="tipoMovimentacao"
                value={tipoMovimentacao}
                onChange={(event) => {
                  setTipoMovimentacao(event.target.value);

                  setQuantidade("");

                  setErroMovimentacao("");
                }}
                disabled={salvando}
              >
                <option value="entrada">Entrada</option>

                <option value="saida">Saída</option>

                <option value="ajuste">Ajuste</option>

                <option value="perda">Perda</option>

                <option value="devolucao">Devolução</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="quantidadeMovimentacao">
                {tipoMovimentacao === "ajuste"
                  ? "Novo estoque contado"
                  : "Quantidade"}
              </label>

              <input
                id="quantidadeMovimentacao"
                name="quantidadeMovimentacao"
                type="number"
                value={quantidade}
                onChange={(event) => setQuantidade(event.target.value)}
                min={tipoMovimentacao === "ajuste" ? "0" : "0.001"}
                step="0.001"
                required
                disabled={salvando}
                placeholder={
                  tipoMovimentacao === "ajuste"
                    ? "Informe o estoque real"
                    : "Informe a quantidade"
                }
              />

              {tipoMovimentacao === "ajuste" && (
                <small className="estoque-ajuste-ajuda">
                  No ajuste, informe a quantidade real que você contou no
                  estoque.
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="motivoMovimentacao">Motivo / observação</label>

              <textarea
                id="motivoMovimentacao"
                name="motivoMovimentacao"
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                rows={3}
                maxLength={500}
                disabled={salvando}
                placeholder="Ex.: Compra do fornecedor, produto danificado..."
              />
            </div>

            <div className="estoque-movimentacao-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={fecharMovimentacao}
                disabled={salvando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="button-primary"
                disabled={salvando}
              >
                {salvando ? "Salvando..." : "Confirmar movimentação"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}

export default Estoque;
