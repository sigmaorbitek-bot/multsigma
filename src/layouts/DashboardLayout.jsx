import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../components/Header/Header";

import "./DashboardLayout.css";

function DashboardLayout() {
  const [menuAberto, setMenuAberto] = useState(false);

  function abrirMenu() {
    setMenuAberto(true);
  }

  function fecharMenu() {
    setMenuAberto(false);
  }

  return (
    <div className="dashboard-layout">
      <Sidebar aberto={menuAberto} onFechar={fecharMenu} />

      {menuAberto && (
        <button
          className="sidebar-overlay"
          type="button"
          aria-label="Fechar menu"
          onClick={fecharMenu}
        />
      )}

      <div className="dashboard-content">
        <Header onAbrirMenu={abrirMenu} />

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
