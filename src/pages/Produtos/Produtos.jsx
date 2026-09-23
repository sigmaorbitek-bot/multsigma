import { useMemo, useState } from "react";

import { useAuth } from "../../hooks/useAuth";
import { useProdutos } from "../../hooks/useProdutos";

import Modal from "../../components/Modal/Modal";
import ProdutoForm from "../../components/ProdutoForm/ProdutoForm";

import "./Produtos.css";

function Produtos() {
  const { empresa } = useAuth();

  const { produtos, categorias, loading, erro, carregarDados } = useProdutos(
    empresa?.id,
  );

  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");

  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtos.filter((produto) => {
      const correspondeBusca =
        !termo ||
        produto.nome?.toLowerCase().includes(termo) ||
        produto.sku?.toLowerCase().includes(termo) ||
        produto.codigo_barras?.toLowerCase().includes(termo);

      const correspondeCategoria =
        !categoriaFiltro || produto.categorias?.id === categoriaFiltro;

      return correspondeBusca && correspondeCategoria;
    });
  }, [produtos, busca, categoriaFiltro]);

  async function produtoCriado() {
    await carregarDados();

    setModalProdutoAberto(false);
  }

  return (
    <section className="produtos-page">
      <div className="produtos-header">
        <div>
          <h1>Produtos</h1>

          <p>Gerencie catálogo, preços e estoque.</p>
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
          type="search"
          placeholder="Buscar por nome, SKU ou código..."
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
        />

        <select
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
      </div>

      {loading && <div className="produtos-status">Carregando produtos...</div>}

      {!loading && erro && (
        <div className="produtos-status produtos-status-erro">{erro}</div>
      )}

      {!loading && !erro && produtosFiltrados.length === 0 && (
        <div className="produtos-vazio">
          <h2>Nenhum produto encontrado</h2>

          <p>Cadastre o primeiro produto da loja.</p>
        </div>
      )}

      {!loading && !erro && produtosFiltrados.length > 0 && (
        <div className="produtos-table-wrapper">
          <table className="produtos-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Unidade</th>
                <th>Estoque</th>
                <th>Preço</th>
                <th>Vitrine</th>
              </tr>
            </thead>

            <tbody>
              {produtosFiltrados.map((produto) => (
                <tr key={produto.id}>
                  <td>
                    <strong>{produto.nome}</strong>

                    {produto.sku && <small>SKU: {produto.sku}</small>}
                  </td>

                  <td>{produto.categorias?.nome ?? "Sem categoria"}</td>

                  <td>{produto.unidade}</td>

                  <td>{produto.estoque_atual}</td>

                  <td>
                    {Number(produto.preco_venda).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>

                  <td>{produto.exibir_na_vitrine ? "Sim" : "Não"}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
          onCancelar={() => setModalProdutoAberto(false)}
        />
      </Modal>
    </section>
  );
}

export default Produtos;
