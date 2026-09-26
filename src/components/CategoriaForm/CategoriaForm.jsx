import { useState } from "react";

import { criarCategoria } from "../../services/categorias";

import "./CategoriaForm.css";

function CategoriaForm({ empresaId, onSucesso, onCancelar }) {
  const [nome, setNome] = useState("");

  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (salvando) {
      return;
    }

    const nomeLimpo = nome.trim();

    if (!empresaId) {
      setErro("Não foi possível identificar a empresa.");

      return;
    }

    if (!nomeLimpo) {
      setErro("Informe o nome da categoria.");

      return;
    }

    setErro("");
    setSalvando(true);

    try {
      const categoria = await criarCategoria({
        empresaId,
        nome: nomeLimpo,
      });

      if (onSucesso) {
        await onSucesso(categoria);
      }
    } catch (error) {
      console.error("Erro ao criar categoria:", error);

      setErro(error.message || "Não foi possível criar a categoria.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form
      className="categoria-form"
      onSubmit={handleSubmit}
      aria-busy={salvando}
    >
      {erro && (
        <div className="categoria-form-error" role="alert">
          {erro}
        </div>
      )}

      <div className="categoria-form-group">
        <label htmlFor="categoria-nome">Nome da categoria *</label>

        <input
          id="categoria-nome"
          name="categoriaNome"
          type="text"
          value={nome}
          onChange={(event) => {
            setNome(event.target.value);

            if (erro) {
              setErro("");
            }
          }}
          maxLength={100}
          required
          autoFocus
          autoComplete="off"
          disabled={salvando}
          placeholder="Ex.: Perfumes"
        />

        <small>Use um nome curto e fácil de identificar.</small>
      </div>

      <div className="categoria-form-actions">
        <button
          type="button"
          className="categoria-form-cancelar"
          onClick={onCancelar}
          disabled={salvando}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="categoria-form-salvar"
          disabled={salvando}
        >
          {salvando ? "Criando..." : "Criar categoria"}
        </button>
      </div>
    </form>
  );
}

export default CategoriaForm;
