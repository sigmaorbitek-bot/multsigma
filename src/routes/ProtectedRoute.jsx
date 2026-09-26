import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

function ProtectedRoute({ children }) {
  const location = useLocation();

  const { user, loading, quantidadeEmpresas, empresaAtual } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (quantidadeEmpresas === 0) {
    return <Navigate to="/cadastro" replace />;
  }

  if (quantidadeEmpresas > 1 && !empresaAtual) {
    return <Navigate to="/selecionar-empresa" replace />;
  }

  return children;
}

export default ProtectedRoute;
