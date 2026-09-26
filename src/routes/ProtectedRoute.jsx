import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

import LoadingScreen from "../components/LoadingScreen/LoadingScreen";

function ProtectedRoute({ children }) {
  const location = useLocation();

  const { user, loading, precisaCadastrarEmpresa, precisaSelecionarEmpresa } =
    useAuth();

  if (loading) {
    return <LoadingScreen mensagem="Preparando seu ambiente..." />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
        }}
      />
    );
  }

  if (precisaCadastrarEmpresa) {
    return <Navigate to="/cadastro" replace />;
  }

  if (precisaSelecionarEmpresa) {
    return <Navigate to="/selecionar-empresa" replace />;
  }

  return children;
}

export default ProtectedRoute;
