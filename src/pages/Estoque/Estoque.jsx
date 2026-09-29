import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

import Modal from "../../components/Modal/Modal";

import {
  listarProdutosEstoque,
  listarMovimentacoesEstoque,
  movimentarEstoque,
} from "../../services/estoque";

import { obterUrlImagemProduto } from "../../services/produtoImagens";

import "./Estoque.css";

const MOVIMENTACOES_POR_PAGINA = 6;

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

  const [quantidadeMovimentacoesVisiveis, setQuantidadeMovimentacoesVisiveis] =
    useState(MOVIMENTACOES_POR_PAGINA);

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
      return undefined;
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
      const nome = produto.nome?.toLowerCase() ?? "";

      const sku = produto.sku?.toLowerCase() ?? "";

      const codigoBarras = produto.codigo_barras?.toLowerCase() ?? "";

      const correspondeBusca =
        !termo ||
        nome.includes(termo) ||
        sku.includes(termo) ||
        codigoBarras.includes(termo);

      const estoqueAtual = Number(produto.estoque_atual ?? 0);

      const estoqueMinimo = Number(produto.estoque_minimo ?? 0);

      const semEstoque = estoqueAtual <= 0;

      const estoqueBaixo = estoqueAtual <= estoqueMinimo;

      const correspondeStatus =
        statusFiltro === "todos" ||
        (statusFiltro === "normal" && !estoqueBaixo) ||
        (statusFiltro === "baixo" && estoqueBaixo && !semEstoque) ||
        (statusFiltro === "zerado" && semEstoque);

      return correspondeBusca && correspondeStatus;
    });
  }, [produtos, busca, statusFiltro]);

  const movimentacoesVisiveis = movimentacoes.slice(
    0,
    quantidadeMovimentacoesVisiveis,
  );

  const possuiMaisMovimentacoes =
    quantidadeMovimentacoesVisiveis < movimentacoes.length;

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

        motivo: motivo.trim(),
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
    const atual = Number(produto.estoque_atual ?? 0);

    const minimo = Number(produto.estoque_minimo ?? 0);

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

  function obterClasseTipo(tipo) {
    const classes = {
      entrada: "estoque-tipo-entrada",

      saida: "estoque-tipo-saida",

      ajuste: "estoque-tipo-ajuste",

      perda: "estoque-tipo-perda",

      devolucao: "estoque-tipo-devolucao",
    };

    return classes[tipo] ?? "";
  }

  function formatarData(data) {
    if (!data) {
      return "-";
    }

    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) {
      return "-";
    }

    return dataConvertida.toLocaleString("pt-BR");
  }

  function formatarQuantidade(valor, unidade = "") {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return `0${unidade ? ` ${unidade}` : ""}`;
    }

    const quantidadeFormatada = numero.toLocaleString("pt-BR", {
      maximumFractionDigits: 3,
    });

    return `${quantidadeFormatada}${unidade ? ` ${unidade}` : ""}`;
  }

  function mostrarMaisMovimentacoes() {
    setQuantidadeMovimentacoesVisiveis(
      (quantidadeAtual) => quantidadeAtual + MOVIMENTACOES_POR_PAGINA,
    );
  }

  const nenhumProdutoCadastrado = produtos.length === 0;

  return (
    <section className="estoque-page">
      <div className="estoque-header">
        <div>
          <h1>Estoque</h1>

          <p>Acompanhe quantidades, entradas, saídas, perdas e ajustes.</p>
        </div>
      </div>

      <div className="estoque-filtros">
        <input
          id="buscaEstoque"
          name="buscaEstoque"
          type="search"
          aria-label="Buscar produtos no estoque"
          placeholder="Buscar por nome, SKU ou código..."
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
        />

        <select
          id="statusEstoque"
          name="statusEstoque"
          aria-label="Filtrar situação do estoque"
          value={statusFiltro}
          onChange={(event) => setStatusFiltro(event.target.value)}
        >
          <option value="todos">Todas as situações</option>

          <option value="normal">Estoque normal</option>

          <option value="baixo">Estoque baixo</option>

          <option value="zerado">Sem estoque</option>
        </select>
      </div>

      {loading && (
        <div className="estoque-status-geral" role="status" aria-live="polite">
          Carregando estoque...
        </div>
      )}

      {!loading && erro && (
        <div className="estoque-status-geral estoque-status-erro" role="alert">
          {erro}
        </div>
      )}

      {!loading && !erro && produtosFiltrados.length === 0 && (
        <div className="estoque-vazio">
          <div className="estoque-vazio-icone" aria-hidden="true">
            📦
          </div>

          <h2>
            {nenhumProdutoCadastrado
              ? "Nenhum produto no estoque"
              : "Nenhum produto encontrado"}
          </h2>

          <p>
            {nenhumProdutoCadastrado
              ? "Cadastre seu primeiro produto para começar a controlar o estoque."
              : "Nenhum produto corresponde aos filtros selecionados."}
          </p>

          {nenhumProdutoCadastrado && (
            <Link
              className="button-primary estoque-vazio-botao"
              to="/painel/produtos"
            >
              Ir para Produtos
            </Link>
          )}
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
                      alt={`Imagem de ${produto.nome}`}
                      className="estoque-produto-imagem"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="estoque-produto-sem-imagem"
                      aria-hidden="true"
                    >
                      📦
                    </div>
                  )}

                  <div className="estoque-produto-info">
                    <strong>{produto.nome}</strong>

                    {produto.sku && <small>SKU: {produto.sku}</small>}
                  </div>
                </div>

                <div className="estoque-mobile-dados">
                  <div className="estoque-mobile-dado">
                    <span>Unidade</span>

                    <strong>{produto.unidade ?? "-"}</strong>
                  </div>

                  <div className="estoque-mobile-dado">
                    <span>Estoque atual</span>

                    <strong>
                      {formatarQuantidade(
                        produto.estoque_atual,
                        produto.unidade,
                      )}
                    </strong>
                  </div>

                  <div className="estoque-mobile-dado">
                    <span>Estoque mínimo</span>

                    <strong>
                      {formatarQuantidade(
                        produto.estoque_minimo,
                        produto.unidade,
                      )}
                    </strong>
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
          <div>
            <h2>Últimas movimentações</h2>

            <p>Histórico das alterações realizadas no estoque.</p>
          </div>

          <span className="estoque-historico-contador">
            {movimentacoes.length}{" "}
            {movimentacoes.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        {movimentacoes.length === 0 ? (
          <div className="estoque-historico-vazio">
            <span aria-hidden="true">🧾</span>

            <div>
              <strong>Nenhuma movimentação registrada</strong>

              <p>As entradas, saídas e ajustes aparecerão aqui.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="estoque-historico-lista">
              {movimentacoesVisiveis.map((movimentacao) => {
                const unidade = movimentacao.produtos?.unidade ?? "";

                return (
                  <article
                    key={movimentacao.id}
                    className="estoque-historico-card"
                  >
                    <div className="estoque-historico-card-topo">
                      <div className="estoque-historico-card-produto">
                        <span>Produto</span>

                        <strong>
                          {movimentacao.produtos?.nome ?? "Produto"}
                        </strong>
                      </div>

                      <span
                        className={`estoque-tipo ${obterClasseTipo(
                          movimentacao.tipo,
                        )}`}
                      >
                        {formatarTipo(movimentacao.tipo)}
                      </span>
                    </div>

                    <div className="estoque-historico-card-dados">
                      <div className="estoque-historico-card-dado">
                        <span>Quantidade</span>

                        <strong>
                          {formatarQuantidade(movimentacao.quantidade, unidade)}
                        </strong>
                      </div>

                      <div className="estoque-historico-card-dado">
                        <span>Antes</span>

                        <strong>
                          {formatarQuantidade(
                            movimentacao.estoque_anterior,
                            unidade,
                          )}
                        </strong>
                      </div>

                      <div className="estoque-historico-card-dado">
                        <span>Depois</span>

                        <strong>
                          {formatarQuantidade(
                            movimentacao.estoque_posterior,
                            unidade,
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="estoque-historico-card-motivo">
                      <span>Motivo / observação</span>

                      <p>{movimentacao.motivo || "Sem observação."}</p>
                    </div>

                    <div className="estoque-historico-card-rodape">
                      <span>Movimentação realizada em</span>

                      <strong>{formatarData(movimentacao.created_at)}</strong>
                    </div>
                  </article>
                );
              })}
            </div>

            {possuiMaisMovimentacoes && (
              <div className="estoque-historico-acoes">
                <button
                  type="button"
                  className="estoque-historico-ver-mais"
                  onClick={mostrarMaisMovimentacoes}
                >
                  Ver mais 6 registros
                </button>
              </div>
            )}
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
            aria-busy={salvando}
          >
            <div className="estoque-movimentacao-produto">
              <span className="estoque-movimentacao-label">Produto</span>

              <strong>{produtoMovimentando.nome}</strong>

              <span>
                Estoque atual:{" "}
                {formatarQuantidade(
                  produtoMovimentando.estoque_atual,
                  produtoMovimentando.unidade,
                )}
              </span>
            </div>

            {erroMovimentacao && (
              <div className="form-error" role="alert">
                {erroMovimentacao}
              </div>
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
                inputMode="decimal"
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

              <small className="estoque-ajuste-ajuda">
                {tipoMovimentacao === "ajuste"
                  ? "Informe a quantidade real encontrada na contagem física."
                  : `Unidade do produto: ${produtoMovimentando.unidade ?? "-"}`}
              </small>
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

              <small className="estoque-ajuste-ajuda">
                Até 500 caracteres.
              </small>
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
