import { Link } from "react-router-dom";

import "./Home.css";

function Home() {
  return (
    <main className="home-page">
      <section className="home-card">
        <div className="home-logo">
          <img src="/Multsigma.png" alt="Logo da Multsigma" />
        </div>

        <header className="home-header">
          <span className="home-badge">Gestão comercial inteligente</span>

          <h1>
            Bem-vindo ao
            <strong> Multsigma</strong>
          </h1>

          <p className="home-subtitulo">Sua gestão de múltiplas lojas.</p>
        </header>

        <div className="home-divisor" />

        <p className="home-descricao">
          Gerencie produtos, estoque, vendas e operações das suas lojas em um só
          lugar.
        </p>

        <div className="home-recursos">
          <article className="home-recurso">
            <span className="home-recurso-icone" aria-hidden="true">
              📦
            </span>

            <strong>Produtos e estoque</strong>

            <span>Controle seus produtos e quantidades.</span>
          </article>

          <article className="home-recurso">
            <span className="home-recurso-icone" aria-hidden="true">
              💳
            </span>

            <strong>Vendas</strong>

            <span>Acompanhe suas vendas e resultados.</span>
          </article>

          <article className="home-recurso">
            <span className="home-recurso-icone" aria-hidden="true">
              🏪
            </span>

            <strong>Múltiplas lojas</strong>

            <span>Gerencie suas operações em um só sistema.</span>
          </article>
        </div>

        <div className="home-acoes">
          <Link className="home-botao home-botao-empresa" to="/login">
            <span aria-hidden="true">🏪</span>

            <span>Acessar como empresa</span>
          </Link>

          <button
            className="home-botao home-botao-cliente"
            type="button"
            disabled
          >
            <span aria-hidden="true">🛍️</span>

            <span>Acessar como cliente</span>

            <small>Em breve</small>
          </button>
        </div>

        <footer className="home-footer">
          <span>Multsigma</span>

          <span>
            Desenvolvido por <strong>Sigma Orbitek</strong>
          </span>
        </footer>
      </section>
    </main>
  );
}

export default Home;
