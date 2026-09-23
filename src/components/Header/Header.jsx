import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";

import "./Header.css";

function Header({ onAbrirMenu }) {
  const { empresa, vinculo, sair } = useAuth();

  const logoUrl = empresa?.logo_path
    ? supabase.storage.from("logos-empresas").getPublicUrl(empresa.logo_path)
        .data.publicUrl
    : null;

  async function handleSair() {
    try {
      await sair();
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  }

  return (
    <header className="header">
      <div className="header-empresa">
        <button
          className="header-menu"
          type="button"
          onClick={onAbrirMenu}
          aria-label="Abrir menu"
        >
          ☰
        </button>

        {logoUrl && (
          <img
            className="header-logo"
            src={logoUrl}
            alt={`Logo ${empresa?.nome ?? "da empresa"}`}
          />
        )}

        <span className="header-empresa-nome">
          {empresa?.nome_fantasia || empresa?.nome || "Empresa"}
        </span>
      </div>
      <div className="header-actions">
        <button
          className="header-notificacao"
          type="button"
          aria-label="Notificações"
        >
          🔔
        </button>

        <span className="header-usuario">{vinculo?.nome ?? "Usuário"}</span>

        <button className="header-sair" type="button" onClick={handleSair}>
          Sair
        </button>
      </div>
    </header>
  );
}

export default Header;
