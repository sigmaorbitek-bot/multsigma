import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

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
      return undefined;
    }

    let cancelado = false;

    async function carregarResumo() {
      try {
        const dados = await obterResumoDashboard(empresa.id);

        if (cancelado) {
          return;
        }

        setResumo(dados);
        setErro("");
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);

        if (!cancelado) {
          setErro("Não foi possível carregar os dados da visão geral.");
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

  const empresaSemProdutos =
    !loading && !erro && resumo.produtosCadastrados === 0;

  return (
    <section className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <span className="dashboard-eyebrow">PAINEL DE GESTÃO</span>

          <h1>Visão geral</h1>

          <p>Acompanhe os principais números e operações da sua empresa.</p>
        </div>

        {empresa?.nome && (
          <div className="dashboard-empresa-atual">
            <span>Empresa atual</span>

            <strong>{empresa.nome_fantasia || empresa.nome}</strong>
          </div>
        )}
      </div>

      {erro && (
        <div className="dashboard-erro" role="alert">
          {erro}
        </div>
      )}

      {empresaSemProdutos && (
        <div className="dashboard-primeiros-passos">
          <div className="dashboard-primeiros-passos-icone">📦</div>

          <div className="dashboard-primeiros-passos-conteudo">
            <span className="dashboard-primeiros-passos-etiqueta">
              PRIMEIROS PASSOS
            </span>

            <h2>Comece cadastrando seus produtos</h2>

            <p>
              Sua empresa já está pronta no Multsigma. Agora cadastre os
              produtos para começar a controlar catálogo e estoque.
            </p>
          </div>

          <Link
            className="button-primary dashboard-primeiros-passos-botao"
            to="/painel/produtos"
          >
            Cadastrar produto
          </Link>
        </div>
      )}

      <div className="dashboard-cards">
        <div className="dashboard-card-em-breve">
          <span className="dashboard-badge-em-breve">Em breve</span>

          <StatCard
            titulo="Faturamento hoje"
            valor="—"
            descricao="Total vendido hoje"
          />
        </div>

        <div className="dashboard-card-em-breve">
          <span className="dashboard-badge-em-breve">Em breve</span>

          <StatCard
            titulo="Vendas hoje"
            valor="—"
            descricao="Vendas realizadas"
          />
        </div>

        <div className="dashboard-card-em-breve">
          <span className="dashboard-badge-em-breve">Em breve</span>

          <StatCard
            titulo="Lucro do mês"
            valor="—"
            descricao="Resultado estimado no mês"
          />
        </div>

        <div className="dashboard-card-em-breve">
          <span className="dashboard-badge-em-breve">Em breve</span>

          <StatCard
            titulo="Estoque baixo"
            valor="—"
            descricao="Produtos abaixo do mínimo"
          />
        </div>

        <StatCard
          titulo="Produtos cadastrados"
          valor={loading ? "..." : resumo.produtosCadastrados}
          descricao="Total de produtos registrados"
        />

        <StatCard
          titulo="Produtos ativos"
          valor={loading ? "..." : resumo.produtosAtivos}
          descricao="Produtos disponíveis na operação"
        />
      </div>

      <div className="dashboard-modulos">
        <div className="dashboard-modulos-header">
          <div>
            <h2>Próximos recursos</h2>

            <p>Novos módulos serão liberados gradualmente no Multsigma.</p>
          </div>
        </div>

        <div className="dashboard-modulos-grid">
          <article className="dashboard-modulo-card">
            <div className="dashboard-modulo-icone">🛒</div>

            <div>
              <strong>Vendas</strong>

              <p>Registre vendas e acompanhe resultados.</p>
            </div>

            <span>Em breve</span>
          </article>

          <article className="dashboard-modulo-card">
            <div className="dashboard-modulo-icone">🧾</div>

            <div>
              <strong>Pedidos</strong>

              <p>Gerencie pedidos feitos pelos clientes.</p>
            </div>

            <span>Em breve</span>
          </article>

          <article className="dashboard-modulo-card">
            <div className="dashboard-modulo-icone">💰</div>

            <div>
              <strong>Financeiro</strong>

              <p>Acompanhe faturamento, custos e lucro.</p>
            </div>

            <span>Em breve</span>
          </article>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
