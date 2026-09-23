import { useMemo, useState } from "react";

import { criarProduto } from "../../services/produtos";

import Modal from "../Modal/Modal";
import CategoriaForm from "../CategoriaForm/CategoriaForm";
import { validarImagemProduto } from "../../services/produtoImagens";

import "./ProdutoForm.css";

const FORM_INICIAL = {
  nome: "",
  categoriaId: "",
  sku: "",
  codigoBarras: "",
  descricao: "",

  unidade: "UN",

  precoCusto: "",
  precoVenda: "",

  estoqueInicial: "0",
  estoqueMinimo: "0",

  exibirNaVitrine: true,
  exibirPreco: true,
  permitirPedido: true,
};

function ProdutoForm({
  empresaId,
  categorias = [],
  onSucesso,
  onCancelar,
  onCategoriaCriada,
}) {
  const [form, setForm] = useState(FORM_INICIAL);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false);

  const [categoriasAdicionadas, setCategoriasAdicionadas] = useState([]);
  const [imagem, setImagem] = useState(null);
  const [previewImagem, setPreviewImagem] = useState(null);

  const categoriasDisponiveis = useMemo(() => {
    const mapa = new Map();

    categorias.forEach((categoria) => {
      mapa.set(categoria.id, categoria);
    });

    categoriasAdicionadas.forEach((categoria) => {
      mapa.set(categoria.id, categoria);
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [categorias, categoriasAdicionadas]);

  function selecionarImagem(event) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      setImagem(null);
      setPreviewImagem(null);
      return;
    }

    try {
      validarImagemProduto(arquivo);

      setErro("");

      setImagem(arquivo);

      const preview = URL.createObjectURL(arquivo);

      setPreviewImagem((previewAnterior) => {
        if (previewAnterior) {
          URL.revokeObjectURL(previewAnterior);
        }

        return preview;
      });
    } catch (error) {
      event.target.value = "";

      setImagem(null);
      setPreviewImagem(null);

      setErro(error.message);
    }
  }

  async function categoriaCriada(categoria) {
    setCategoriasAdicionadas((categoriasAtuais) => [
      ...categoriasAtuais,
      categoria,
    ]);

    setForm((estadoAtual) => ({
      ...estadoAtual,
      categoriaId: categoria.id,
    }));

    if (onCategoriaCriada) {
      await onCategoriaCriada();
    }

    setModalCategoriaAberto(false);
  }

  function atualizarCampo(event) {
    const { name, value, type, checked } = event.target;

    setForm((estadoAtual) => ({
      ...estadoAtual,

      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (salvando) {
      return;
    }

    setErro("");
    setSalvando(true);

    try {
      await criarProduto({
        empresaId,
        categoriaId: form.categoriaId || null,
        nome: form.nome,
        sku: form.sku,
        codigoBarras: form.codigoBarras,
        descricao: form.descricao,
        unidade: form.unidade,
        precoCusto: form.precoCusto || 0,
        precoVenda: form.precoVenda || 0,
        estoqueInicial: form.estoqueInicial || 0,
        estoqueMinimo: form.estoqueMinimo || 0,
        exibirNaVitrine: form.exibirNaVitrine,
        exibirPreco: form.exibirPreco,
        permitirPedido: form.permitirPedido,
        imagem,
      });

      if (onSucesso) {
        await onSucesso();
      }
    } catch (error) {
      console.error("Erro ao salvar produto:", error);

      setErro(error.message || "Não foi possível salvar o produto.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <form className="produto-form" onSubmit={handleSubmit}>
        {erro && <div className="form-error">{erro}</div>}

        <div className="produto-form-grid">
          <div className="form-group form-group-full">
            <label htmlFor="nome">Nome do produto *</label>

            <input
              id="nome"
              name="nome"
              type="text"
              value={form.nome}
              onChange={atualizarCampo}
              maxLength={150}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="categoriaId">Categoria</label>

            <div className="categoria-field">
              <select
                id="categoriaId"
                name="categoriaId"
                value={form.categoriaId}
                onChange={atualizarCampo}
              >
                <option value="">Sem categoria</option>

                {categoriasDisponiveis.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="categoria-add-button"
                onClick={() => setModalCategoriaAberto(true)}
              >
                + Nova
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="unidade">Unidade de medida *</label>

            <select
              id="unidade"
              name="unidade"
              value={form.unidade}
              onChange={atualizarCampo}
              required
            >
              <option value="UN">Unidade</option>

              <option value="KG">Quilograma</option>

              <option value="G">Grama</option>

              <option value="L">Litro</option>

              <option value="ML">Mililitro</option>

              <option value="CX">Caixa</option>

              <option value="PCT">Pacote</option>

              <option value="M">Metro</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="sku">SKU</label>

            <input
              id="sku"
              name="sku"
              type="text"
              value={form.sku}
              onChange={atualizarCampo}
              maxLength={100}
              placeholder="Ex.: PERF-MAL-100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="codigoBarras">Código de barras</label>

            <input
              id="codigoBarras"
              name="codigoBarras"
              type="text"
              value={form.codigoBarras}
              onChange={atualizarCampo}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="precoCusto">Preço de custo *</label>

            <input
              id="precoCusto"
              name="precoCusto"
              type="number"
              value={form.precoCusto}
              onChange={atualizarCampo}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="precoVenda">Preço de venda *</label>

            <input
              id="precoVenda"
              name="precoVenda"
              type="number"
              value={form.precoVenda}
              onChange={atualizarCampo}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="estoqueInicial">Estoque inicial</label>

            <input
              id="estoqueInicial"
              name="estoqueInicial"
              type="number"
              value={form.estoqueInicial}
              onChange={atualizarCampo}
              min="0"
              step="0.001"
            />
          </div>

          <div className="form-group">
            <label htmlFor="estoqueMinimo">Estoque mínimo</label>

            <input
              id="estoqueMinimo"
              name="estoqueMinimo"
              type="number"
              value={form.estoqueMinimo}
              onChange={atualizarCampo}
              min="0"
              step="0.001"
            />
          </div>

          <div className="form-group form-group-full">
            <label htmlFor="imagem">Imagem do produto</label>

            <div className="produto-imagem-area">
              {previewImagem ? (
                <img
                  className="produto-imagem-preview"
                  src={previewImagem}
                  alt="Pré-visualização do produto"
                />
              ) : (
                <div className="produto-imagem-placeholder">Sem imagem</div>
              )}

              <div className="produto-imagem-controles">
                <input
                  id="imagem"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={selecionarImagem}
                />

                <small>JPG, PNG ou WEBP. Máximo 5 MB.</small>
              </div>
            </div>
          </div>

          <div className="form-group form-group-full">
            <label htmlFor="descricao">Descrição</label>

            <textarea
              id="descricao"
              name="descricao"
              value={form.descricao}
              onChange={atualizarCampo}
              rows={4}
              maxLength={1000}
            />
          </div>
        </div>

        <div className="produto-form-opcoes">
          <label>
            <input
              name="exibirNaVitrine"
              type="checkbox"
              checked={form.exibirNaVitrine}
              onChange={atualizarCampo}
            />
            Mostrar na vitrine
          </label>

          <label>
            <input
              name="exibirPreco"
              type="checkbox"
              checked={form.exibirPreco}
              onChange={atualizarCampo}
            />
            Mostrar preço
          </label>

          <label>
            <input
              name="permitirPedido"
              type="checkbox"
              checked={form.permitirPedido}
              onChange={atualizarCampo}
            />
            Permitir pedido
          </label>
        </div>

        <div className="produto-form-actions">
          <button
            type="button"
            className="button-secondary"
            onClick={onCancelar}
            disabled={salvando}
          >
            Cancelar
          </button>

          <button type="submit" className="button-primary" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar produto"}
          </button>
        </div>
      </form>

      <Modal
        aberto={modalCategoriaAberto}
        titulo="Nova categoria"
        onFechar={() => setModalCategoriaAberto(false)}
      >
        <CategoriaForm
          empresaId={empresaId}
          onSucesso={categoriaCriada}
          onCancelar={() => setModalCategoriaAberto(false)}
        />
      </Modal>
    </>
  );
}

export default ProdutoForm;
