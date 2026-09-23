import StatCard from "../../components/StatCard/StatCard";

import "./Dashboard.css";

function Dashboard() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-page-header">
        <h1>Visão geral</h1>

        <p>Acompanhe os principais números da sua empresa.</p>
      </div>

      <div className="dashboard-cards">
        <StatCard
          titulo="Faturamento hoje"
          valor="R$ 0,00"
          descricao="Total vendido hoje"
        />

        <StatCard
          titulo="Vendas hoje"
          valor="0"
          descricao="Vendas realizadas"
        />

        <StatCard
          titulo="Lucro do mês"
          valor="R$ 0,00"
          descricao="Lucro estimado no mês"
        />

        <StatCard
          titulo="Estoque baixo"
          valor="0"
          descricao="Produtos abaixo do mínimo"
        />
      </div>
    </section>
  );
}

export default Dashboard;
