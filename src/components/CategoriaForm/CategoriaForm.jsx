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

    setErro("");
    setSalvando(true);

    try {
      const categoria = await criarCategoria({
        empresaId,
        nome,
      });

      await onSucesso(categoria);
    } catch (error) {
      console.error("Erro ao criar categoria:", error);

      setErro(error.message || "Não foi possível criar a categoria.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="categoria-form" onSubmit={handleSubmit}>
      {erro && <div className="form-error">{erro}</div>}

      <div className="form-group">
        <label htmlFor="categoria-nome">Nome da categoria *</label>

        <input
          id="categoria-nome"
          type="text"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          maxLength={100}
          required
          autoFocus
        />
      </div>

      <div className="categoria-form-actions">
        <button
          type="button"
          className="button-secondary"
          onClick={onCancelar}
          disabled={salvando}
        >
          Cancelar
        </button>

        <button type="submit" className="button-primary" disabled={salvando}>
          {salvando ? "Criando..." : "Criar categoria"}
        </button>
      </div>
    </form>
  );
}

export default CategoriaForm;
