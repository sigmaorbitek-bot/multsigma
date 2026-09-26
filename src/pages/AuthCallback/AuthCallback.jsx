import { useEffect } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";

function AuthCallback() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const { user, loading, quantidadeEmpresas, empresaAtual } = useAuth();

  const erroOAuth = searchParams.get("error");

  const descricaoErro = searchParams.get("error_description");

  const mensagemErro = erroOAuth
    ? descricaoErro || "Não foi possível concluir a autenticação."
    : "";

  useEffect(() => {
    if (loading || mensagemErro) {
      return;
    }

    if (!user) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    if (quantidadeEmpresas === 0) {
      navigate("/cadastro", {
        replace: true,
      });

      return;
    }

    if (quantidadeEmpresas > 1 && !empresaAtual) {
      navigate("/selecionar-empresa", {
        replace: true,
      });

      return;
    }

    navigate("/painel", {
      replace: true,
    });
  }, [loading, mensagemErro, user, quantidadeEmpresas, empresaAtual, navigate]);

  if (mensagemErro) {
    return (
      <main className="loading-screen">
        <section className="loading-screen-content">
          <img
            className="loading-screen-logo"
            src="/Multsigma.png"
            alt="Logo da Multsigma"
          />

          <p className="loading-screen-text">{mensagemErro}</p>

          <button
            type="button"
            onClick={() =>
              navigate("/login", {
                replace: true,
              })
            }
          >
            Voltar ao login
          </button>
        </section>
      </main>
    );
  }

  return <LoadingScreen mensagem="Concluindo seu acesso..." />;
}

export default AuthCallback;
