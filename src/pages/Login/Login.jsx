import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";

import "./Login.css";

const logo = "/Multsigma.png";

function Login() {
  const navigate = useNavigate();

  const { entrar } = useAuth();

  const [email, setEmail] = useState("");

  const [senha, setSenha] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [erro, setErro] = useState("");

  const [mensagem, setMensagem] = useState("");

  const [carregando, setCarregando] = useState(false);

  const [carregandoGoogle, setCarregandoGoogle] = useState(false);

  const [recuperandoSenha, setRecuperandoSenha] = useState(false);

  const estaCarregando = carregando || carregandoGoogle || recuperandoSenha;

  async function handleSubmit(event) {
    event.preventDefault();

    if (estaCarregando) {
      return;
    }

    setErro("");
    setMensagem("");
    setCarregando(true);

    try {
      await entrar(email.trim(), senha);

      navigate("/painel", {
        replace: true,
      });
    } catch (error) {
      console.error("Erro no login:", error);

      setErro("Não foi possível entrar. Verifique o e-mail e a senha.");
    } finally {
      setCarregando(false);
    }
  }

  async function entrarComGoogle() {
    if (estaCarregando) {
      return;
    }

    setErro("");
    setMensagem("");
    setCarregandoGoogle(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",

        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Erro ao entrar com Google:", error);

      setErro("Não foi possível entrar com o Google.");

      setCarregandoGoogle(false);
    }
  }

  async function esqueciMinhaSenha() {
    if (estaCarregando) {
      return;
    }

    const emailLimpo = email.trim();

    if (!emailLimpo) {
      setMensagem("");

      setErro("Informe seu e-mail primeiro para recuperar a senha.");

      return;
    }

    setErro("");
    setMensagem("");
    setRecuperandoSenha(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) {
        throw error;
      }

      setMensagem("Enviamos as instruções de recuperação para o seu e-mail.");
    } catch (error) {
      console.error("Erro ao recuperar senha:", error);

      setErro(
        "Não foi possível enviar o e-mail de recuperação. Tente novamente.",
      );
    } finally {
      setRecuperandoSenha(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-voltar-area">
          <Link className="login-voltar-inicio" to="/">
            ← Voltar ao início
          </Link>
        </div>

        <header className="login-header">
          <div className="login-marca">
            <div className="login-logo">
              <img src={logo} alt="Logo da Multsigma" />
            </div>

            <div>
              <h1>Multsigma</h1>

              <p>Sua gestão de múltiplas lojas.</p>
            </div>
          </div>
        </header>

        <form
          className="login-form"
          onSubmit={handleSubmit}
          aria-busy={estaCarregando}
        >
          <div className="login-form-titulo">
            <h2>Entrar</h2>

            <p>Acesse o painel da sua empresa.</p>
          </div>

          {erro && (
            <div className="login-error" role="alert">
              {erro}
            </div>
          )}

          {mensagem && (
            <div className="login-success" role="status" aria-live="polite">
              {mensagem}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="email">E-mail</label>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
              disabled={estaCarregando}
              required
            />
          </div>

          <div className="login-field">
            <div className="login-senha-label">
              <label htmlFor="senha">Senha</label>

              <button
                type="button"
                className="login-esqueci-senha"
                onClick={esqueciMinhaSenha}
                disabled={estaCarregando}
              >
                {recuperandoSenha ? "Enviando..." : "Esqueci minha senha"}
              </button>
            </div>

            <div className="login-senha-container">
              <input
                id="senha"
                name="senha"
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                disabled={estaCarregando}
                required
              />

              <button
                type="button"
                className="login-mostrar-senha"
                onClick={() => setMostrarSenha((valorAtual) => !valorAtual)}
                disabled={estaCarregando}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            className="login-submit"
            type="submit"
            disabled={estaCarregando}
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          <div className="login-divisor">
            <span>ou</span>
          </div>

          <button
            className="login-google"
            type="button"
            onClick={entrarComGoogle}
            disabled={estaCarregando}
          >
            <span className="login-google-icon" aria-hidden="true">
              G
            </span>

            <span>
              {carregandoGoogle ? "Conectando..." : "Continuar com Google"}
            </span>
          </button>

          <div className="login-cadastro">
            <span>Ainda não usa o Multsigma?</span>

            <Link to="/cadastro">✨ Cadastrar minha empresa</Link>
          </div>
        </form>

        <footer className="login-footer">
          <span>Multsigma</span>

          <span>
            Desenvolvido por <strong>Sigma Orbitek</strong>
          </span>
        </footer>
      </section>
    </main>
  );
}

export default Login;
