import { NavLink } from "react-router-dom";

import "./Sidebar.css";

const logo = "/Multsigma.png";

const itensDisponiveis = [
  {
    to: "/painel",
    icone: "📊",
    nome: "Visão geral",
    end: true,
  },
  {
    to: "/painel/produtos",
    icone: "🛍️",
    nome: "Produtos",
  },
  {
    to: "/painel/estoque",
    icone: "📦",
    nome: "Estoque",
  },
  {
    to: "/painel/vendas",
    icone: "🛒",
    nome: "Vendas",
  },
  {
    to: "/painel/relatorios",
    icone: "📄",
    nome: "Relatórios",
  },
];

const itensEmBreve = [
  {
    icone: "🧾",
    nome: "Pedidos",
  },
  {
    icone: "👨🏻‍💼",
    nome: "Funcionários",
  },
  {
    icone: "🔔",
    nome: "Notificações",
  },
  {
    icone: "👥",
    nome: "Clientes",
  },
  {
    icone: "🕐",
    nome: "Horários",
  },
  {
    icone: "💰",
    nome: "Financeiro",
  },
  {
    icone: "⚙️",
    nome: "Configurações",
  },
];

function Sidebar({ aberto, onFechar }) {
  return (
    <aside className={`sidebar ${aberto ? "sidebar-aberta" : ""}`}>
      <div className="sidebar-topo">
        <div className="sidebar-marca">
          <div className="sidebar-logo">
            <img
              src={logo}
              alt="Logo da Multsigma"
              className="sidebar-logo-imagem"
            />
          </div>

          <h2 className="sidebar-title">Multsigma</h2>
        </div>

        <button
          className="sidebar-fechar"
          type="button"
          onClick={onFechar}
          aria-label="Fechar menu"
        >
          ✕
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {itensDisponiveis.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onFechar}
            className="sidebar-item"
          >
            <span className="sidebar-item-icone" aria-hidden="true">
              {item.icone}
            </span>

            <span className="sidebar-item-nome">{item.nome}</span>
          </NavLink>
        ))}

        <div className="sidebar-divisor" aria-hidden="true" />

        {itensEmBreve.map((item) => (
          <button
            key={item.nome}
            className="sidebar-item sidebar-item-em-breve"
            type="button"
            disabled
            aria-label={`${item.nome} - Em breve`}
          >
            <span className="sidebar-item-icone" aria-hidden="true">
              {item.icone}
            </span>

            <span className="sidebar-item-nome">{item.nome}</span>

            <span className="sidebar-badge-em-breve">Em breve</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
