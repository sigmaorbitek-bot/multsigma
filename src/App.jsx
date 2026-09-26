import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import CadastroEmpresa from "./pages/CadastroEmpresa/CadastroEmpresa";
import RedefinirSenha from "./pages/RedefinirSenha/RedefinirSenha";
import AuthCallback from "./pages/AuthCallback/AuthCallback";
import SelecionarEmpresa from "./pages/SelecionarEmpresa/SelecionarEmpresa";

import Dashboard from "./pages/Dashboard/Dashboard";
import Produtos from "./pages/Produtos/Produtos";
import Estoque from "./pages/Estoque/Estoque";
import Vendas from "./pages/Vendas/Vendas";

import DashboardLayout from "./layouts/DashboardLayout";

import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/cadastro" element={<CadastroEmpresa />} />

        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route path="/redefinir-senha" element={<RedefinirSenha />} />

        <Route path="/selecionar-empresa" element={<SelecionarEmpresa />} />

        <Route
          path="/painel"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />

          <Route path="produtos" element={<Produtos />} />

          <Route path="estoque" element={<Estoque />} />

          <Route path="vendas" element={<Vendas />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
