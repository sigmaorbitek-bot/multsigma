import "./LoadingScreen.css";

const logo = "/Multsigma.png";

function LoadingScreen({ mensagem = "Carregando..." }) {
  return (
    <main className="loading-screen">
      <section className="loading-screen-content">
        <img
          className="loading-screen-logo"
          src={logo}
          alt="Logo da Multsigma"
        />

        <div className="loading-screen-spinner" aria-hidden="true" />

        <p className="loading-screen-text">{mensagem}</p>
      </section>
    </main>
  );
}

export default LoadingScreen;
