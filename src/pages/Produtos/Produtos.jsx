import { useMemo, useState } from "react";

import { useAuth } from "../../hooks/useAuth";
import { useProdutos } from "../../hooks/useProdutos";

import Modal from "../../components/Modal/Modal";
import ProdutoForm from "../../components/ProdutoForm/ProdutoForm";

import { obterUrlImagemProduto } from "../../services/produtoImagens";

import {
  alterarStatusProduto,
  excluirProdutoDefinitivamente,
} from "../../services/produtos";

import "./Produtos.css";

function Produtos() {
  const { empresa } = useAuth();

  const { produtos, categorias, loading, erro, carregarDados } = useProdutos(
    empresa?.id,
  );

  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("ativos");

  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);

  const [produtoEditando, setProdutoEditando] = useState(null);

  const [produtoAlterandoStatus, setProdutoAlterandoStatus] = useState(null);

  const [alterandoStatus, setAlterandoStatus] = useState(false);

  const [erroStatus, setErroStatus] = useState("");

  const [produtoExcluindo, setProdutoExcluindo] = useState(null);

  const [excluindo, setExcluindo] = useState(false);

  const [erroExclusao, setErroExclusao] = useState("");

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

      const correspondeCategoria =
        !categoriaFiltro || produto.categorias?.id === categoriaFiltro;

      const correspondeStatus =
        statusFiltro === "todos" ||
        (statusFiltro === "ativos" && produto.ativo) ||
        (statusFiltro === "inativos" && !produto.ativo);

      return correspondeBusca && correspondeCategoria && correspondeStatus;
    });
  }, [produtos, busca, categoriaFiltro, statusFiltro]);

  async function produtoCriado() {
    await carregarDados();

    setModalProdutoAberto(false);
  }

  async function produtoAtualizado() {
    await carregarDados();

    setProdutoEditando(null);
  }

  async function confirmarAlteracaoStatus() {
    if (!produtoAlterandoStatus || !empresa?.id || alterandoStatus) {
      return;
    }

    setErroStatus("");
    setAlterandoStatus(true);

    try {
      await alterarStatusProduto({
        produtoId: produtoAlterandoStatus.id,

        empresaId: empresa.id,

        ativo: !produtoAlterandoStatus.ativo,
      });

      await carregarDados();

      setProdutoAlterandoStatus(null);
    } catch (error) {
      console.error("Erro ao alterar status do produto:", error);

      setErroStatus(
        error.message || "Não foi possível alterar o status do produto.",
      );
    } finally {
      setAlterandoStatus(false);
    }
  }

  async function confirmarExclusao() {
    if (!produtoExcluindo || !empresa?.id || excluindo) {
      return;
    }

    setErroExclusao("");
    setExcluindo(true);

    try {
      await excluirProdutoDefinitivamente({
        produtoId: produtoExcluindo.id,

        empresaId: empresa.id,
      });

      await carregarDados();

      setProdutoExcluindo(null);
    } catch (error) {
      console.error("Erro ao excluir produto:", error);

      setErroExclusao(error.message || "Não foi possível excluir o produto.");
    } finally {
      setExcluindo(false);
    }
  }

  function formatarPreco(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return "R$ 0,00";
    }

    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarEstoque(produto) {
    const quantidade = produto.estoque_atual ?? 0;

    const unidade = produto.unidade ?? "";

    return `${quantidade}${unidade ? ` ${unidade}` : ""}`;
  }

  function abrirEdicao(produto) {
    setProdutoEditando(produto);
  }

  function abrirAlteracaoStatus(produto) {
    setErroStatus("");

    setProdutoAlterandoStatus(produto);
  }

  function abrirExclusao(produto) {
    setErroExclusao("");

    setProdutoExcluindo(produto);
  }

  const nenhumProdutoCadastrado = produtos.length === 0;

  return (
    <section className="produtos-page">
      <div className="produtos-header">
        <div>
          <h1>Produtos</h1>

          <p>Gerencie catálogo, preços, estoque e disponibilidade.</p>
        </div>

        <button
          type="button"
          className="button-primary"
          onClick={() => setModalProdutoAberto(true)}
        >
          + Novo produto
        </button>
      </div>

      <div className="produtos-filtros">
        <input
          id="buscaProdutos"
          name="buscaProdutos"
          type="search"
          aria-label="Buscar produtos"
          placeholder="Buscar por nome, SKU ou código..."
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
        />

        <select
          id="categoriaProdutos"
          name="categoriaProdutos"
          aria-label="Filtrar por categoria"
          value={categoriaFiltro}
          onChange={(event) => setCategoriaFiltro(event.target.value)}
        >
          <option value="">Todas as categorias</option>

          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>

        <select
          id="statusProdutos"
          name="statusProdutos"
          aria-label="Filtrar por status"
          value={statusFiltro}
          onChange={(event) => setStatusFiltro(event.target.value)}
        >
          <option value="todos">Todos os produtos</option>

          <option value="ativos">Produtos ativos</option>

          <option value="inativos">Produtos inativos</option>
        </select>
      </div>

      {loading && (
        <div className="produtos-status" role="status" aria-live="polite">
          Carregando produtos...
        </div>
      )}

      {!loading && erro && (
        <div className="produtos-status produtos-status-erro" role="alert">
          {erro}
        </div>
      )}

      {!loading && !erro && produtosFiltrados.length === 0 && (
        <div className="produtos-vazio">
          <div className="produtos-vazio-icone" aria-hidden="true">
            📦
          </div>

          <h2>
            {nenhumProdutoCadastrado
              ? "Nenhum produto cadastrado"
              : "Nenhum produto encontrado"}
          </h2>

          <p>
            {nenhumProdutoCadastrado
              ? "Cadastre seu primeiro produto para começar a controlar catálogo e estoque."
              : "Nenhum produto corresponde aos filtros selecionados."}
          </p>

          {nenhumProdutoCadastrado && (
            <button
              type="button"
              className="button-primary produtos-vazio-botao"
              onClick={() => setModalProdutoAberto(true)}
            >
              + Cadastrar produto
            </button>
          )}
        </div>
      )}

      {!loading && !erro && produtosFiltrados.length > 0 && (
        <div className="produtos-mobile-list">
          {produtosFiltrados.map((produto) => (
            <article key={produto.id} className="produto-mobile-card">
              <div className="produto-mobile-topo">
                {produto.imagem_path ? (
                  <img
                    className="produto-lista-imagem"
                    src={obterUrlImagemProduto(produto.imagem_path)}
                    alt={`Imagem de ${produto.nome}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="produto-lista-sem-imagem" aria-hidden="true">
                    📦
                  </div>
                )}

                <div className="produto-lista-info">
                  <strong>{produto.nome}</strong>

                  {produto.sku && <small>SKU: {produto.sku}</small>}
                </div>
              </div>

              <div className="produto-mobile-dados">
                <div className="produto-mobile-dado">
                  <span>Categoria</span>

                  <strong>{produto.categorias?.nome ?? "Sem categoria"}</strong>
                </div>

                <div className="produto-mobile-dado">
                  <span>Unidade</span>

                  <strong>{produto.unidade ?? "-"}</strong>
                </div>

                <div className="produto-mobile-dado">
                  <span>Estoque</span>

                  <strong>{formatarEstoque(produto)}</strong>
                </div>

                <div className="produto-mobile-dado">
                  <span>Preço</span>

                  <strong>{formatarPreco(produto.preco_venda)}</strong>
                </div>

                <div className="produto-mobile-dado">
                  <span>Vitrine</span>

                  <span
                    className={
                      produto.exibir_na_vitrine
                        ? "produto-vitrine produto-vitrine-sim"
                        : "produto-vitrine produto-vitrine-nao"
                    }
                  >
                    {produto.exibir_na_vitrine ? "Visível" : "Oculto"}
                  </span>
                </div>

                <div className="produto-mobile-dado">
                  <span>Status</span>

                  <span
                    className={
                      produto.ativo
                        ? "produto-status produto-status-ativo"
                        : "produto-status produto-status-inativo"
                    }
                  >
                    {produto.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>

              <div className="produto-mobile-acoes">
                <button
                  type="button"
                  className="produto-editar-button"
                  onClick={() => abrirEdicao(produto)}
                >
                  Editar
                </button>

                <button
                  type="button"
                  className="produto-status-button"
                  onClick={() => abrirAlteracaoStatus(produto)}
                >
                  {produto.ativo ? "Desativar" : "Reativar"}
                </button>

                <button
                  type="button"
                  className="produto-excluir-button"
                  onClick={() => abrirExclusao(produto)}
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        aberto={modalProdutoAberto}
        titulo="Novo produto"
        onFechar={() => setModalProdutoAberto(false)}
      >
        <ProdutoForm
          empresaId={empresa?.id}
          categorias={categorias}
          onSucesso={produtoCriado}
          onCategoriaCriada={carregarDados}
          onCancelar={() => setModalProdutoAberto(false)}
        />
      </Modal>

      <Modal
        aberto={Boolean(produtoEditando)}
        titulo="Editar produto"
        onFechar={() => setProdutoEditando(null)}
      >
        {produtoEditando && (
          <ProdutoForm
            empresaId={empresa?.id}
            categorias={categorias}
            produto={produtoEditando}
            onSucesso={produtoAtualizado}
            onCategoriaCriada={carregarDados}
            onCancelar={() => setProdutoEditando(null)}
          />
        )}
      </Modal>

      <Modal
        aberto={Boolean(produtoAlterandoStatus)}
        titulo={
          produtoAlterandoStatus?.ativo
            ? "Desativar produto"
            : "Reativar produto"
        }
        onFechar={() => {
          if (!alterandoStatus) {
            setProdutoAlterandoStatus(null);

            setErroStatus("");
          }
        }}
      >
        {produtoAlterandoStatus && (
          <div className="produto-confirmacao">
            <p>
              {produtoAlterandoStatus.ativo
                ? "Deseja desativar"
                : "Deseja reativar"}{" "}
              <strong>{produtoAlterandoStatus.nome}</strong>?
            </p>

            <p className="produto-confirmacao-aviso">
              {produtoAlterandoStatus.ativo
                ? "O produto deixará de aparecer nas operações normais e poderá ser reativado depois."
                : "O produto voltará a aparecer nas operações normais da loja."}
            </p>

            {erroStatus && <div className="form-error">{erroStatus}</div>}

            <div className="produto-confirmacao-acoes">
              <button
                type="button"
                className="button-secondary"
                disabled={alterandoStatus}
                onClick={() => {
                  setProdutoAlterandoStatus(null);

                  setErroStatus("");
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="button-primary"
                disabled={alterandoStatus}
                onClick={confirmarAlteracaoStatus}
              >
                {alterandoStatus
                  ? "Salvando..."
                  : produtoAlterandoStatus.ativo
                    ? "Desativar produto"
                    : "Reativar produto"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        aberto={Boolean(produtoExcluindo)}
        titulo="Excluir produto definitivamente"
        onFechar={() => {
          if (!excluindo) {
            setProdutoExcluindo(null);

            setErroExclusao("");
          }
        }}
      >
        {produtoExcluindo && (
          <div className="produto-exclusao">
            <p>
              Tem certeza que deseja excluir{" "}
              <strong>{produtoExcluindo.nome}</strong>?
            </p>

            <p className="produto-exclusao-aviso">
              Esta ação é permanente. Se o produto já possuir vendas ou
              movimentações vinculadas, o sistema bloqueará a exclusão e você
              deverá apenas desativá-lo.
            </p>

            {erroExclusao && <div className="form-error">{erroExclusao}</div>}

            <div className="produto-exclusao-acoes">
              <button
                type="button"
                className="button-secondary"
                disabled={excluindo}
                onClick={() => {
                  setProdutoExcluindo(null);

                  setErroExclusao("");
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="produto-confirmar-exclusao"
                disabled={excluindo}
                onClick={confirmarExclusao}
              >
                {excluindo ? "Excluindo..." : "Excluir definitivamente"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

export default Produtos;
