import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";

import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";

import "./SelecionarEmpresa.css";

const logoMultsigma = "/Multsigma.png";

function SelecionarEmpresa() {
  const navigate = useNavigate();

  const { user, loading, empresas, empresaAtual, selecionarEmpresa, sair } =
    useAuth();

  const [processandoEmpresaId, setProcessandoEmpresaId] = useState(null);

  const [saindo, setSaindo] = useState(false);

  const [erro, setErro] = useState("");

  function obterLogoEmpresa(logoPath) {
    if (!logoPath) {
      return null;
    }

    const { data } = supabase.storage
      .from("logos-empresas")
      .getPublicUrl(logoPath);

    return data?.publicUrl ?? null;
  }

  function obterIniciaisEmpresa(empresa) {
    const nome = empresa?.nome_fantasia || empresa?.nome || "";

    const palavras = nome.trim().split(/\s+/).filter(Boolean);

    if (palavras.length === 0) {
      return "E";
    }

    if (palavras.length === 1) {
      return palavras[0].slice(0, 2).toUpperCase();
    }

    return (palavras[0][0] + palavras[palavras.length - 1][0]).toUpperCase();
  }

  function handleSelecionarEmpresa(empresaId) {
    if (processandoEmpresaId || saindo) {
      return;
    }

    setErro("");
    setProcessandoEmpresaId(empresaId);

    try {
      selecionarEmpresa(empresaId);

      navigate("/painel", {
        replace: true,
      });
    } catch (error) {
      console.error("Erro ao selecionar empresa:", error);

      setErro("Não foi possível acessar esta empresa. Tente novamente.");

      setProcessandoEmpresaId(null);
    }
  }

  async function handleSair() {
    if (saindo || processandoEmpresaId) {
      return;
    }

    setErro("");
    setSaindo(true);

    try {
      await sair();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Erro ao sair:", error);

      setErro("Não foi possível sair da conta. Tente novamente.");

      setSaindo(false);
    }
  }

  if (loading) {
    return <LoadingScreen mensagem="Carregando suas empresas..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="selecionar-empresa-page">
      <section className="selecionar-empresa-card">
        <header className="selecionar-empresa-header">
          <img
            className="selecionar-empresa-logo"
            src={logoMultsigma}
            alt="Logo da Multsigma"
          />

          <div>
            <h1>Multsigma</h1>

            <p>Escolha a empresa que deseja acessar.</p>
          </div>
        </header>

        {erro && (
          <div className="selecionar-empresa-erro" role="alert">
            {erro}
          </div>
        )}

        <div className="selecionar-empresa-lista">
          {empresas.map((empresa) => {
            const logoUrl = obterLogoEmpresa(empresa.logo_path);

            const empresaSelecionada = empresaAtual?.id === empresa.id;

            const processando = processandoEmpresaId === empresa.id;

            return (
              <button
                key={empresa.id}
                className={`selecionar-empresa-item${
                  empresaSelecionada ? " selecionar-empresa-item-atual" : ""
                }`}
                type="button"
                onClick={() => handleSelecionarEmpresa(empresa.id)}
                disabled={Boolean(processandoEmpresaId) || saindo}
              >
                <div className="selecionar-empresa-avatar">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={`Logo da ${empresa.nome_fantasia || empresa.nome}`}
                    />
                  ) : (
                    <span>{obterIniciaisEmpresa(empresa)}</span>
                  )}
                </div>

                <div className="selecionar-empresa-info">
                  <strong>{empresa.nome_fantasia || empresa.nome}</strong>

                  <div className="selecionar-empresa-meta">
                    {empresa.vinculo?.cargo && (
                      <span>{empresa.vinculo.cargo}</span>
                    )}

                    {empresaSelecionada && (
                      <span className="selecionar-empresa-atual">Atual</span>
                    )}
                  </div>
                </div>

                <span className="selecionar-empresa-seta" aria-hidden="true">
                  {processando ? "…" : "→"}
                </span>
              </button>
            );
          })}
        </div>

        {empresaAtual && (
          <button
            className="selecionar-empresa-voltar"
            type="button"
            onClick={() =>
              navigate("/painel", {
                replace: true,
              })
            }
            disabled={Boolean(processandoEmpresaId) || saindo}
          >
            ← Voltar ao painel
          </button>
        )}

        <button
          className="selecionar-empresa-sair"
          type="button"
          onClick={handleSair}
          disabled={Boolean(processandoEmpresaId) || saindo}
        >
          {saindo ? "Saindo..." : "Sair da conta"}
        </button>

        <footer className="selecionar-empresa-footer">
          Desenvolvido por <strong>Sigma Orbitek</strong>
        </footer>
      </section>
    </main>
  );
}

export default SelecionarEmpresa;
