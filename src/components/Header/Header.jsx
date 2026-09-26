import { useState } from "react";

import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";

import "./Header.css";

function Header({ onAbrirMenu }) {
  const { empresa, vinculo, sair } = useAuth();

  const [saindo, setSaindo] = useState(false);

  const [erroSaida, setErroSaida] = useState("");

  const logoUrl = empresa?.logo_path
    ? supabase.storage.from("logos-empresas").getPublicUrl(empresa.logo_path)
        .data.publicUrl
    : null;

  const nomeEmpresa = empresa?.nome_fantasia || empresa?.nome || "Empresa";

  const nomeUsuario = vinculo?.nome || "Usuário";

  function obterIniciaisEmpresa() {
    if (!nomeEmpresa) {
      return "E";
    }

    const palavras = nomeEmpresa.trim().split(/\s+/).filter(Boolean);

    if (palavras.length === 0) {
      return "E";
    }

    if (palavras.length === 1) {
      return palavras[0].slice(0, 2).toUpperCase();
    }

    return (palavras[0][0] + palavras[palavras.length - 1][0]).toUpperCase();
  }

  async function handleSair() {
    if (saindo) {
      return;
    }

    setErroSaida("");
    setSaindo(true);

    try {
      await sair();
    } catch (error) {
      console.error("Erro ao sair:", error);

      setErroSaida("Não foi possível sair. Tente novamente.");

      setSaindo(false);
    }
  }

  return (
    <header className="header">
      <div className="header-esquerda">
        <button
          className="header-menu"
          type="button"
          onClick={onAbrirMenu}
          aria-label="Abrir menu"
        >
          ☰
        </button>

        <div className="header-empresa">
          <div className="header-logo-area">
            {logoUrl ? (
              <img
                className="header-logo"
                src={logoUrl}
                alt={`Logo da ${nomeEmpresa}`}
              />
            ) : (
              <div className="header-logo-placeholder" aria-hidden="true">
                {obterIniciaisEmpresa()}
              </div>
            )}
          </div>

          <div className="header-empresa-info">
            <span className="header-empresa-label">Empresa atual</span>

            <strong className="header-empresa-nome">{nomeEmpresa}</strong>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <div className="header-notificacao-area">
          <button
            className="header-notificacao"
            type="button"
            disabled
            aria-label="Notificações - Em breve"
            title="Notificações - Em breve"
          >
            <span aria-hidden="true">🔔</span>
          </button>

          <span className="header-notificacao-badge">Em breve</span>
        </div>

        <div className="header-usuario-area">
          <span className="header-usuario-label">Usuário</span>

          <strong className="header-usuario">{nomeUsuario}</strong>
        </div>

        <button
          className="header-sair"
          type="button"
          onClick={handleSair}
          disabled={saindo}
        >
          {saindo ? "Saindo..." : "Sair"}
        </button>
      </div>

      {erroSaida && (
        <div className="header-erro" role="alert">
          {erroSaida}
        </div>
      )}
    </header>
  );
}

export default Header;
