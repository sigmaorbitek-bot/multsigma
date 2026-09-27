import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

import { obterResumoDashboard } from "../../services/dashboard";

import StatCard from "../../components/StatCard/StatCard";

import "./Dashboard.css";

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

function Dashboard() {
  const { empresa } = useAuth();

  const [resumo, setResumo] = useState({
    produtosCadastrados: 0,
    produtosAtivos: 0,
    estoqueBaixo: 0,

    vendasHoje: 0,
    faturamentoHoje: 0,
    lucroMes: 0,
  });

  const [empresaDadosId, setEmpresaDadosId] = useState(null);

  const [empresaConsultadaId, setEmpresaConsultadaId] = useState(null);

  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!empresa?.id) {
      return;
    }

    let cancelado = false;

    obterResumoDashboard(empresa.id)
      .then((dados) => {
        if (cancelado) {
          return;
        }

        setResumo(dados);

        setEmpresaDadosId(empresa.id);

        setErro("");
      })
      .catch((error) => {
        if (cancelado) {
          return;
        }

        console.error("Erro ao carregar dashboard:", error);

        setErro("Não foi possível carregar os dados da visão geral.");
      })
      .finally(() => {
        if (cancelado) {
          return;
        }

        setEmpresaConsultadaId(empresa.id);
      });

    return () => {
      cancelado = true;
    };
  }, [empresa?.id]);

  const dadosSaoDaEmpresaAtual =
    Boolean(empresa?.id) && empresaDadosId === empresa.id;

  const loading = Boolean(empresa?.id) && empresaConsultadaId !== empresa.id;

  const resumoAtual = dadosSaoDaEmpresaAtual
    ? resumo
    : {
        produtosCadastrados: 0,
        produtosAtivos: 0,
        estoqueBaixo: 0,

        vendasHoje: 0,
        faturamentoHoje: 0,
        lucroMes: 0,
      };

  const empresaSemProdutos =
    !loading && !erro && resumoAtual.produtosCadastrados === 0;

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
        <StatCard
          titulo="Faturamento hoje"
          valor={loading ? "..." : formatarMoeda(resumoAtual.faturamentoHoje)}
          descricao="Total vendido hoje"
        />

        <StatCard
          titulo="Vendas hoje"
          valor={loading ? "..." : resumoAtual.vendasHoje}
          descricao="Vendas concluídas hoje"
        />

        <StatCard
          titulo="Lucro do mês"
          valor={loading ? "..." : formatarMoeda(resumoAtual.lucroMes)}
          descricao="Lucro das vendas concluídas no mês"
        />

        <StatCard
          titulo="Estoque baixo"
          valor={loading ? "..." : resumoAtual.estoqueBaixo}
          descricao="Produtos no mínimo ou abaixo"
        />

        <StatCard
          titulo="Produtos cadastrados"
          valor={loading ? "..." : resumoAtual.produtosCadastrados}
          descricao="Total de produtos registrados"
        />

        <StatCard
          titulo="Produtos ativos"
          valor={loading ? "..." : resumoAtual.produtosAtivos}
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
            <div className="dashboard-modulo-icone">🧾</div>

            <div>
              <strong>Pedidos</strong>

              <p>Gerencie pedidos feitos pelos clientes.</p>
            </div>

            <span>Em breve</span>
          </article>

          <article className="dashboard-modulo-card">
            <div className="dashboard-modulo-icone">👥</div>

            <div>
              <strong>Clientes</strong>

              <p>Centralize informações e histórico dos seus clientes.</p>
            </div>

            <span>Em breve</span>
          </article>

          <article className="dashboard-modulo-card">
            <div className="dashboard-modulo-icone">💰</div>

            <div>
              <strong>Financeiro</strong>

              <p>Acompanhe receitas, despesas e resultados financeiros.</p>
            </div>

            <span>Em breve</span>
          </article>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
