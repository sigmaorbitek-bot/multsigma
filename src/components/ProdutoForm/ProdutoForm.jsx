import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { atualizarProduto, criarProduto } from "../../services/produtos";

import Modal from "../Modal/Modal";
import CategoriaForm from "../CategoriaForm/CategoriaForm";

import {
  obterUrlImagemProduto,
  validarImagemProduto,
} from "../../services/produtoImagens";

import LeitorCodigoBarras from "../LeitorCodigoBarras/LeitorCodigoBarras";

import "./ProdutoForm.css";

const FORM_INICIAL = {
  nome: "",
  categoriaId: "",
  sku: "",
  codigoBarras: "",
  descricao: "",

  unidade: "UN",

  precoCusto: "",
  percentualLucro: "",
  precoVenda: "",

  estoqueInicial: "0",
  estoqueMinimo: "0",

  exibirNaVitrine: false,
  exibirPreco: false,
  permitirPedido: false,
};

const INFORMACOES_UNIDADE = {
  UN: {
    nome: "unidades",
    estoque: "Estoque em unidades",
    minimo: "Estoque mínimo em unidades",
    exemplo: "Ex.: 10 unidades",
  },

  KG: {
    nome: "quilogramas",
    estoque: "Estoque em quilogramas",
    minimo: "Estoque mínimo em quilogramas",
    exemplo: "Ex.: 8,500 kg",
  },

  G: {
    nome: "gramas",
    estoque: "Estoque em gramas",
    minimo: "Estoque mínimo em gramas",
    exemplo: "Ex.: 2500 g",
  },

  L: {
    nome: "litros",
    estoque: "Estoque em litros",
    minimo: "Estoque mínimo em litros",
    exemplo: "Ex.: 20,500 L",
  },

  ML: {
    nome: "mililitros",
    estoque: "Estoque em mililitros",
    minimo: "Estoque mínimo em mililitros",
    exemplo: "Ex.: 5000 ml",
  },

  CX: {
    nome: "caixas",
    estoque: "Estoque em caixas",
    minimo: "Estoque mínimo em caixas",
    exemplo: "Ex.: 12 caixas",
  },

  PCT: {
    nome: "pacotes",
    estoque: "Estoque em pacotes",
    minimo: "Estoque mínimo em pacotes",
    exemplo: "Ex.: 20 pacotes",
  },

  M: {
    nome: "metros",
    estoque: "Estoque em metros",
    minimo: "Estoque mínimo em metros",
    exemplo: "Ex.: 30,500 m",
  },
};

function ProdutoForm({
  empresaId,
  categorias = [],
  produto = null,
  onSucesso,
  onCancelar,
  onCategoriaCriada,
}) {
  const [form, setForm] = useState(() => {
    if (!produto) {
      return FORM_INICIAL;
    }

    return {
      nome: produto.nome ?? "",

      categoriaId: produto.categorias?.id ?? "",

      sku: produto.sku ?? "",

      codigoBarras: produto.codigo_barras ?? "",

      descricao: produto.descricao ?? "",

      unidade: produto.unidade ?? "UN",

      precoCusto: produto.preco_custo ?? "",

      percentualLucro: produto.percentual_lucro ?? "",

      precoVenda: produto.preco_venda ?? "",

      estoqueInicial: produto.estoque_atual ?? "0",

      estoqueMinimo: produto.estoque_minimo ?? "0",

      exibirNaVitrine: produto.exibir_na_vitrine ?? false,

      exibirPreco: produto.exibir_preco ?? false,

      permitirPedido: produto.permitir_pedido ?? false,
    };
  });

  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");

  const [modalLeitorAberto, setModalLeitorAberto] = useState(false);

  const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false);

  const [categoriasAdicionadas, setCategoriasAdicionadas] = useState([]);

  const [imagem, setImagem] = useState(null);

  const [removerImagemAtual, setRemoverImagemAtual] = useState(false);

  const [precoVendaManual, setPrecoVendaManual] = useState(() => {
    if (!produto) {
      return false;
    }

    if (
      produto.percentual_lucro === null ||
      produto.percentual_lucro === undefined
    ) {
      return true;
    }

    const custo = Number(produto.preco_custo);

    const percentual = Number(produto.percentual_lucro);

    const venda = Number(produto.preco_venda);

    const sugerido = custo * (1 + percentual / 100);

    return Math.abs(venda - sugerido) > 0.009;
  });

  const imagemInputRef = useRef(null);

  const previewTemporarioRef = useRef(null);

  const [previewImagem, setPreviewImagem] = useState(() => {
    if (!produto?.imagem_path) {
      return null;
    }

    return obterUrlImagemProduto(produto.imagem_path);
  });

  useEffect(() => {
    return () => {
      if (previewTemporarioRef.current) {
        URL.revokeObjectURL(previewTemporarioRef.current);

        previewTemporarioRef.current = null;
      }
    };
  }, []);

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

  const unidadeInfo =
    INFORMACOES_UNIDADE[form.unidade] ?? INFORMACOES_UNIDADE.UN;

  const precoSugerido = useMemo(() => {
    if (form.precoCusto === "" || form.percentualLucro === "") {
      return null;
    }

    const custo = Number(form.precoCusto);

    const percentual = Number(form.percentualLucro);

    if (
      !Number.isFinite(custo) ||
      !Number.isFinite(percentual) ||
      custo < 0 ||
      percentual < 0
    ) {
      return null;
    }

    return Number((custo * (1 + percentual / 100)).toFixed(2));
  }, [form.precoCusto, form.percentualLucro]);

  const lucroReal = useMemo(() => {
    if (form.precoCusto === "" || form.precoVenda === "") {
      return null;
    }

    const custo = Number(form.precoCusto);

    const venda = Number(form.precoVenda);

    if (!Number.isFinite(custo) || !Number.isFinite(venda)) {
      return null;
    }

    const lucro = venda - custo;

    const percentual = custo > 0 ? (lucro / custo) * 100 : null;

    return {
      lucro,
      percentual,
    };
  }, [form.precoCusto, form.precoVenda]);

  const codigoDetectado = useCallback((codigo) => {
    setForm((estadoAtual) => ({
      ...estadoAtual,

      codigoBarras: codigo,
    }));

    setModalLeitorAberto(false);
  }, []);

  function selecionarImagem(event) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    try {
      validarImagemProduto(arquivo);

      setErro("");

      if (previewTemporarioRef.current) {
        URL.revokeObjectURL(previewTemporarioRef.current);

        previewTemporarioRef.current = null;
      }

      const preview = URL.createObjectURL(arquivo);

      previewTemporarioRef.current = preview;

      setImagem(arquivo);

      setRemoverImagemAtual(false);

      setPreviewImagem(preview);
    } catch (error) {
      event.target.value = "";

      setErro(error.message || "Imagem inválida.");
    }
  }

  function removerImagem() {
    if (previewTemporarioRef.current) {
      URL.revokeObjectURL(previewTemporarioRef.current);

      previewTemporarioRef.current = null;
    }

    setImagem(null);

    setPreviewImagem(null);

    setRemoverImagemAtual(Boolean(produto?.imagem_path));

    if (imagemInputRef.current) {
      imagemInputRef.current.value = "";
    }

    setErro("");
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

    const novoValor = type === "checkbox" ? checked : value;

    if (name === "precoVenda") {
      setPrecoVendaManual(true);

      setForm((estadoAtual) => ({
        ...estadoAtual,

        precoVenda: value,
      }));

      return;
    }

    if (name === "precoCusto" || name === "percentualLucro") {
      setForm((estadoAtual) => {
        const proximoEstado = {
          ...estadoAtual,

          [name]: value,
        };

        if (!precoVendaManual) {
          const custo = Number(
            name === "precoCusto" ? value : proximoEstado.precoCusto,
          );

          const percentual = Number(
            name === "percentualLucro" ? value : proximoEstado.percentualLucro,
          );

          if (
            Number.isFinite(custo) &&
            Number.isFinite(percentual) &&
            custo >= 0 &&
            percentual >= 0
          ) {
            proximoEstado.precoVenda = (custo * (1 + percentual / 100)).toFixed(
              2,
            );
          }
        }

        return proximoEstado;
      });

      return;
    }

    setForm((estadoAtual) => ({
      ...estadoAtual,

      [name]: novoValor,
    }));
  }

  function usarPrecoSugerido() {
    if (precoSugerido === null) {
      return;
    }

    setForm((estadoAtual) => ({
      ...estadoAtual,

      precoVenda: precoSugerido.toFixed(2),
    }));

    setPrecoVendaManual(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (salvando) {
      return;
    }

    if (!empresaId) {
      setErro("Não foi possível identificar a empresa.");

      return;
    }

    if (!form.nome.trim()) {
      setErro("Informe o nome do produto.");

      return;
    }

    if (form.precoCusto === "" || Number(form.precoCusto) < 0) {
      setErro("Informe um preço de custo válido.");

      return;
    }

    if (form.precoVenda === "" || Number(form.precoVenda) < 0) {
      setErro("Informe um preço de venda válido.");

      return;
    }

    if (form.percentualLucro !== "" && Number(form.percentualLucro) < 0) {
      setErro("O percentual de lucro não pode ser negativo.");

      return;
    }

    setErro("");
    setSalvando(true);

    try {
      const dadosProduto = {
        empresaId,

        categoriaId: form.categoriaId || null,

        nome: form.nome,

        sku: form.sku,

        codigoBarras: form.codigoBarras,

        descricao: form.descricao,

        unidade: form.unidade,

        precoCusto: form.precoCusto || 0,

        percentualLucro:
          form.percentualLucro === "" ? null : form.percentualLucro,

        precoVenda: form.precoVenda || 0,

        estoqueMinimo: form.estoqueMinimo || 0,

        exibirNaVitrine: form.exibirNaVitrine,

        exibirPreco: form.exibirPreco,

        permitirPedido: form.permitirPedido,
      };

      if (produto) {
        await atualizarProduto({
          produtoId: produto.id,

          ...dadosProduto,

          imagem,

          imagemAtualPath: produto.imagem_path ?? null,

          removerImagemAtual,
        });
      } else {
        await criarProduto({
          ...dadosProduto,

          estoqueInicial: form.estoqueInicial || 0,

          imagem,
        });
      }

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
      <form
        className="produto-form"
        onSubmit={handleSubmit}
        aria-busy={salvando}
      >
        {erro && (
          <div className="form-error" role="alert">
            {erro}
          </div>
        )}

        <fieldset className="produto-form-fieldset" disabled={salvando}>
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

              <small className="produto-unidade-ajuda">
                O estoque e as vendas usarão {unidadeInfo.nome}.
              </small>
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

              <div className="codigo-barras-field">
                <input
                  id="codigoBarras"
                  name="codigoBarras"
                  type="text"
                  value={form.codigoBarras}
                  onChange={atualizarCampo}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={100}
                  placeholder="Digite ou leia o código"
                />

                <button
                  type="button"
                  className="codigo-barras-camera"
                  onClick={() => setModalLeitorAberto(true)}
                  aria-label="Ler código de barras com a câmera"
                  title="Ler com câmera"
                >
                  📷
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="precoCusto">Preço de custo *</label>

              <input
                id="precoCusto"
                name="precoCusto"
                type="number"
                inputMode="decimal"
                value={form.precoCusto}
                onChange={atualizarCampo}
                min="0"
                step="0.01"
                required
                placeholder="0,00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="percentualLucro">
                Lucro desejado sobre o custo (%)
              </label>

              <input
                id="percentualLucro"
                name="percentualLucro"
                type="number"
                inputMode="decimal"
                value={form.percentualLucro}
                onChange={atualizarCampo}
                min="0"
                step="0.01"
                placeholder="Ex.: 40"
              />

              <small className="produto-lucro-ajuda">
                Custo de R$ 50 com 40% gera preço sugerido de R$ 70.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="precoVenda">Preço de venda *</label>

              <input
                id="precoVenda"
                name="precoVenda"
                type="number"
                inputMode="decimal"
                value={form.precoVenda}
                onChange={atualizarCampo}
                min="0"
                step="0.01"
                required
                placeholder="0,00"
              />

              {precoSugerido !== null && (
                <div className="produto-preco-sugestao">
                  <div>
                    <span>Preço sugerido</span>

                    <strong>
                      {precoSugerido.toLocaleString("pt-BR", {
                        style: "currency",

                        currency: "BRL",
                      })}
                    </strong>
                  </div>

                  {precoVendaManual && (
                    <button
                      type="button"
                      className="produto-usar-sugestao"
                      onClick={usarPrecoSugerido}
                    >
                      Usar sugestão
                    </button>
                  )}
                </div>
              )}

              {lucroReal && (
                <div className="produto-lucro-real">
                  <div>
                    <span>Lucro por unidade</span>

                    <strong>
                      {lucroReal.lucro.toLocaleString("pt-BR", {
                        style: "currency",

                        currency: "BRL",
                      })}
                    </strong>
                  </div>

                  {lucroReal.percentual !== null && (
                    <small>
                      {lucroReal.percentual.toFixed(2)}% sobre o custo
                    </small>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="estoqueInicial">
                {produto
                  ? `Estoque atual em ${unidadeInfo.nome}`
                  : unidadeInfo.estoque}
              </label>

              <input
                id="estoqueInicial"
                name="estoqueInicial"
                type="number"
                inputMode="decimal"
                value={form.estoqueInicial}
                onChange={atualizarCampo}
                min="0"
                step="0.001"
                disabled={Boolean(produto)}
                placeholder={unidadeInfo.exemplo}
              />

              {produto && (
                <small className="produto-unidade-ajuda">
                  Para alterar o estoque atual, use o módulo Estoque.
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="estoqueMinimo">{unidadeInfo.minimo}</label>

              <input
                id="estoqueMinimo"
                name="estoqueMinimo"
                type="number"
                inputMode="decimal"
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
                    ref={imagemInputRef}
                    id="imagem"
                    name="imagem"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={selecionarImagem}
                    disabled={salvando}
                  />

                  <small>JPG, PNG ou WEBP. Máximo 5 MB.</small>

                  {previewImagem && (
                    <button
                      type="button"
                      className="produto-remover-imagem"
                      onClick={removerImagem}
                      disabled={salvando}
                    >
                      Remover imagem
                    </button>
                  )}

                  {removerImagemAtual && produto?.imagem_path && (
                    <small className="produto-imagem-remocao-aviso">
                      A imagem atual será removida ao salvar.
                    </small>
                  )}
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
                placeholder="Descreva o produto, características, tamanho, aroma, composição ou outras informações importantes."
              />
            </div>
          </div>

          <div className="produto-publicacao">
            <div className="produto-publicacao-header">
              <div>
                <strong>Vitrine e pedidos</strong>

                <p>
                  Essas opções serão liberadas quando a área pública de clientes
                  estiver disponível.
                </p>
              </div>

              <span className="produto-publicacao-badge">Em breve</span>
            </div>

            <div className="produto-form-opcoes produto-form-opcoes-bloqueadas">
              <label>
                <input
                  id="exibirNaVitrine"
                  name="exibirNaVitrine"
                  type="checkbox"
                  checked={form.exibirNaVitrine}
                  onChange={atualizarCampo}
                  disabled
                />

                <span>Mostrar na vitrine</span>
              </label>

              <label>
                <input
                  id="exibirPreco"
                  name="exibirPreco"
                  type="checkbox"
                  checked={form.exibirPreco}
                  onChange={atualizarCampo}
                  disabled
                />

                <span>Mostrar preço</span>
              </label>

              <label>
                <input
                  id="permitirPedido"
                  name="permitirPedido"
                  type="checkbox"
                  checked={form.permitirPedido}
                  onChange={atualizarCampo}
                  disabled
                />

                <span>Permitir pedido</span>
              </label>
            </div>
          </div>
        </fieldset>

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
            {salvando
              ? produto
                ? "Salvando alterações..."
                : "Salvando..."
              : produto
                ? "Salvar alterações"
                : "Salvar produto"}
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

      <Modal
        aberto={modalLeitorAberto}
        titulo="Ler código de barras"
        onFechar={() => setModalLeitorAberto(false)}
      >
        {modalLeitorAberto && (
          <LeitorCodigoBarras
            onDetectado={codigoDetectado}
            onCancelar={() => setModalLeitorAberto(false)}
          />
        )}
      </Modal>
    </>
  );
}

export default ProdutoForm;
