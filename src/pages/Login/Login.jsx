import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const { entrar } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (carregando) {
      return;
    }

    setErro("");
    setCarregando(true);

    try {
      await entrar(
        email.trim(),
        senha,
      );

      navigate("/painel");
    } catch (error) {
      console.error("Erro no login:", error);

      setErro(
        "Não foi possível entrar. Verifique o e-mail e a senha.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <header className="login-header">
          <div className="login-marca">
            <div className="login-logo">
              Σ
            </div>

            <div>
              <h1>Sigma Lojas</h1>
              <p>
                Gestão simples para o seu negócio.
              </p>
            </div>
          </div>
        </header>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <div className="login-form-titulo">
            <h2>Entrar</h2>

            <p>
              Acesse o painel da sua loja.
            </p>
          </div>

          {erro && (
            <div
              className="login-error"
              role="alert"
            >
              {erro}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="email">
              E-mail
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
              disabled={carregando}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="senha">
              Senha
            </label>

            <input
              id="senha"
              name="senha"
              type="password"
              value={senha}
              onChange={(event) =>
                setSenha(event.target.value)
              }
              placeholder="Digite sua senha"
              autoComplete="current-password"
              disabled={carregando}
              required
            />
          </div>

          <button
            className="login-submit"
            type="submit"
            disabled={carregando}
          >
            {carregando
              ? "Entrando..."
              : "Entrar"}
          </button>
        </form>

        <footer className="login-footer">
          <span>
            Sigma Lojas
          </span>

          <span>
            Gestão comercial
          </span>
        </footer>
      </section>
    </main>
  );
}

export default Login;