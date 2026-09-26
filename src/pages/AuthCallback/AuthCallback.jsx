import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

import LoadingScreen from "../../components/LoadingScreen/LoadingScreen";

function AuthCallback() {
  const navigate = useNavigate();

  const { user, loading, quantidadeEmpresas, empresaAtual } = useAuth();

  useEffect(() => {
    if (loading) {
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
  }, [user, loading, quantidadeEmpresas, empresaAtual, navigate]);

  return <LoadingScreen mensagem="Preparando o acesso à sua empresa..." />;
}

export default AuthCallback;
