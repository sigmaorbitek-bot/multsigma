import { NavLink } from "react-router-dom";

import "./Sidebar.css";

function Sidebar({ aberto, onFechar }) {
  return (
    <aside className={`sidebar ${aberto ? "sidebar-aberta" : ""}`}>
      <div className="sidebar-topo">
        <h2 className="sidebar-title">Lojas Sigmas</h2>

        <button
          className="sidebar-fechar"
          type="button"
          onClick={onFechar}
          aria-label="Fechar menu"
        >
          ✕
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/painel" end onClick={onFechar}>
          Visão geral
        </NavLink>

        <NavLink to="/painel/produtos" onClick={onFechar}>
          Produtos
        </NavLink>

        <NavLink to="/painel/estoque" onClick={onFechar}>
          Estoque
        </NavLink>

        <NavLink to="/painel/vendas" onClick={onFechar}>
          Vendas
        </NavLink>

        <NavLink to="/painel/clientes" onClick={onFechar}>
          Clientes
        </NavLink>

        <NavLink to="/painel/financeiro" onClick={onFechar}>
          Financeiro
        </NavLink>

        <NavLink to="/painel/relatorios" onClick={onFechar}>
          Relatórios
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
