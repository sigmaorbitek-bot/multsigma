import { useEffect, useState } from "react";

import { useAuth } from "../../hooks/useAuth";

import { obterResumoDashboard } from "../../services/dashboard";

import StatCard from "../../components/StatCard/StatCard";

import "./Dashboard.css";

function Dashboard() {
  const { empresa } = useAuth();

  const [resumo, setResumo] = useState({
    produtosCadastrados: 0,
    produtosAtivos: 0,
  });

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!empresa?.id) {
      return;
    }

    let cancelado = false;

    async function carregarResumo() {
      try {
        setErro("");

        const dados = await obterResumoDashboard(
          empresa.id,
        );

        if (cancelado) {
          return;
        }

        setResumo(dados);
      } catch (error) {
        console.error(
          "Erro ao carregar dashboard:",
          error,
        );

        if (!cancelado) {
          setErro(
            "Não foi possível carregar os dados da visão geral.",
          );
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    }

    carregarResumo();

    return () => {
      cancelado = true;
    };
  }, [empresa?.id]);

  return (
    <section className="dashboard-page">
      <div className="dashboard-page-header">
        <h1>Visão geral</h1>

        <p>
          Acompanhe os principais números da sua empresa.
        </p>
      </div>

      {erro && (
        <div className="dashboard-erro">
          {erro}
        </div>
      )}

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

        <StatCard
          titulo="Produtos cadastrados"
          valor={
            loading
              ? "..."
              : resumo.produtosCadastrados
          }
          descricao="Total de produtos registrados"
        />

        <StatCard
          titulo="Produtos ativos"
          valor={
            loading
              ? "..."
              : resumo.produtosAtivos
          }
          descricao="Produtos ativos na loja"
        />
      </div>
    </section>
  );
}

export default Dashboard;