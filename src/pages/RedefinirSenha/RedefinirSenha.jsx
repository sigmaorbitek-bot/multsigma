import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../../services/supabase";

import "./RedefinirSenha.css";

function RedefinirSenha() {
  const navigate = useNavigate();

  const [novaSenha, setNovaSenha] = useState("");

  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [erro, setErro] = useState("");

  const [mensagem, setMensagem] = useState("");

  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (salvando) {
      return;
    }

    setErro("");
    setMensagem("");

    if (novaSenha.length < 8) {
      setErro("A nova senha deve possuir pelo menos 8 caracteres.");

      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas informadas não são iguais.");

      return;
    }

    setSalvando(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (error) {
        throw error;
      }

      setMensagem("Senha alterada com sucesso. Redirecionando para o login...");

      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1500);
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);

      setErro(
        "Não foi possível alterar sua senha. O link pode ter expirado. Solicite uma nova recuperação.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="redefinir-page">
      <section className="redefinir-card">
        <header className="redefinir-header">
          <div className="redefinir-marca">
            <div className="redefinir-logo">
              <img src="/Multsigma.png" alt="Logo da Multsigma" />
            </div>

            <div>
              <h1>Multsigma</h1>

              <p>Sua gestão de múltiplas lojas.</p>
            </div>
          </div>
        </header>

        <div className="redefinir-conteudo">
          <div className="redefinir-titulo">
            <h2>Criar nova senha</h2>

            <p>Informe sua nova senha para continuar usando sua conta.</p>
          </div>

          {erro && (
            <div className="redefinir-error" role="alert">
              {erro}
            </div>
          )}

          {mensagem && (
            <div className="redefinir-success" role="status">
              {mensagem}
            </div>
          )}

          <form className="redefinir-form" onSubmit={handleSubmit}>
            <div className="redefinir-field">
              <label htmlFor="novaSenha">Nova senha</label>

              <div className="redefinir-senha-container">
                <input
                  id="novaSenha"
                  name="novaSenha"
                  type={mostrarSenha ? "text" : "password"}
                  value={novaSenha}
                  onChange={(event) => setNovaSenha(event.target.value)}
                  placeholder="Digite a nova senha"
                  autoComplete="new-password"
                  minLength={8}
                  disabled={salvando}
                  required
                />

                <button
                  type="button"
                  className="redefinir-mostrar-senha"
                  onClick={() => setMostrarSenha((valorAtual) => !valorAtual)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="redefinir-field">
              <label htmlFor="confirmarSenha">Confirmar nova senha</label>

              <div className="redefinir-senha-container">
                <input
                  id="confirmarSenha"
                  name="confirmarSenha"
                  type={mostrarSenha ? "text" : "password"}
                  value={confirmarSenha}
                  onChange={(event) => setConfirmarSenha(event.target.value)}
                  placeholder="Digite novamente"
                  autoComplete="new-password"
                  minLength={8}
                  disabled={salvando}
                  required
                />

                <button
                  type="button"
                  className="redefinir-mostrar-senha"
                  onClick={() => setMostrarSenha((valorAtual) => !valorAtual)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              className="redefinir-submit"
              type="submit"
              disabled={salvando}
            >
              {salvando ? "Alterando senha..." : "Alterar senha"}
            </button>
          </form>

          <Link className="redefinir-voltar" to="/login">
            Voltar para o login
          </Link>
        </div>

        <footer className="redefinir-footer">
          <span>Multsigma</span>

          <span>
            Desenvolvido por <strong>Sigma Orbitek</strong>
          </span>
        </footer>
      </section>
    </main>
  );
}

export default RedefinirSenha;
