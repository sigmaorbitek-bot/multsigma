import { useState } from "react";

import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

import {
  criarEmpresaUsuario,
  enviarLogoEmpresa,
} from "../../services/empresas";

import "./CadastroEmpresa.css";

const logoMultsigma = "/Multsigma.png";

function CadastroEmpresa() {
  const navigate = useNavigate();

  const { user, loading, sair, recarregarEmpresas } = useAuth();

  const [nomeEmpresa, setNomeEmpresa] = useState("");

  const [nomeResponsavelEditado, setNomeResponsavelEditado] = useState(null);

  const [logoArquivo, setLogoArquivo] = useState(null);

  const [logoPreview, setLogoPreview] = useState("");

  const [empresaCriadaId, setEmpresaCriadaId] = useState(null);

  const [erro, setErro] = useState("");

  const [sucesso, setSucesso] = useState("");

  const [carregando, setCarregando] = useState(false);

  const email = user?.email ?? "";

  const nomeGoogle =
    user?.user_metadata?.full_name || user?.user_metadata?.name || "";

  const nomeResponsavel = nomeResponsavelEditado ?? nomeGoogle;

  const cadastroFinalizado = Boolean(empresaCriadaId);

  function selecionarLogo(event) {
    const arquivo = event.target.files?.[0];

    setErro("");
    setSucesso("");

    if (!arquivo) {
      setLogoArquivo(null);
      setLogoPreview("");

      return;
    }

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

    if (!tiposPermitidos.includes(arquivo.type)) {
      event.target.value = "";

      setLogoArquivo(null);
      setLogoPreview("");

      setErro("A logo deve ser uma imagem JPG, PNG ou WEBP.");

      return;
    }

    const tamanhoMaximo = 5 * 1024 * 1024;

    if (arquivo.size > tamanhoMaximo) {
      event.target.value = "";

      setLogoArquivo(null);
      setLogoPreview("");

      setErro("A imagem da logo deve ter no máximo 5 MB.");

      return;
    }

    setLogoArquivo(arquivo);

    const leitor = new FileReader();

    leitor.onload = () => {
      setLogoPreview(typeof leitor.result === "string" ? leitor.result : "");
    };

    leitor.onerror = () => {
      event.target.value = "";

      setLogoArquivo(null);
      setLogoPreview("");

      setErro("Não foi possível carregar a prévia da imagem.");
    };

    leitor.readAsDataURL(arquivo);
  }

  function removerLogo() {
    setLogoArquivo(null);
    setLogoPreview("");

    const input = document.getElementById("logoEmpresa");

    if (input) {
      input.value = "";
    }
  }

  async function atualizarContextoEmpresa(empresaId) {
    await recarregarEmpresas(empresaId);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (carregando || cadastroFinalizado) {
      return;
    }

    setErro("");
    setSucesso("");

    const empresaLimpa = nomeEmpresa.trim();

    const responsavelLimpo = nomeResponsavel.trim();

    if (!empresaLimpa) {
      setErro("Informe o nome da empresa.");

      return;
    }

    if (!responsavelLimpo) {
      setErro("Informe o nome do responsável.");

      return;
    }

    if (!user?.id || !email) {
      setErro("Não foi possível identificar sua conta. Entre novamente.");

      return;
    }

    setCarregando(true);

    let novaEmpresa;

    try {
      novaEmpresa = await criarEmpresaUsuario({
        nomeEmpresa: empresaLimpa,

        nomeResponsavel: responsavelLimpo,
      });

      setEmpresaCriadaId(novaEmpresa.empresa_id);
    } catch (error) {
      console.error("Erro ao criar empresa:", error);

      setErro(error?.message || "Não foi possível criar a empresa.");

      setCarregando(false);

      return;
    }

    if (logoArquivo) {
      try {
        await enviarLogoEmpresa({
          empresaId: novaEmpresa.empresa_id,

          arquivo: logoArquivo,
        });
      } catch (error) {
        console.error("Empresa criada, mas ocorreu erro na logo:", error);

        try {
          await atualizarContextoEmpresa(novaEmpresa.empresa_id);
        } catch (erroContexto) {
          console.error("Erro ao atualizar empresas:", erroContexto);
        }

        setSucesso("Sua empresa foi criada com sucesso.");

        setErro(
          "Não foi possível enviar a logo. Você pode tentar novamente ou continuar sem ela.",
        );

        setCarregando(false);

        return;
      }
    }

    try {
      await atualizarContextoEmpresa(novaEmpresa.empresa_id);

      navigate("/painel", {
        replace: true,
      });
    } catch (error) {
      console.error("Erro ao atualizar empresa atual:", error);

      setSucesso("Sua empresa foi criada com sucesso.");

      setErro(
        "Não foi possível abrir o painel automaticamente. Tente continuar novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }

  async function tentarEnviarLogoNovamente() {
    if (!empresaCriadaId || !logoArquivo || carregando) {
      return;
    }

    setErro("");
    setSucesso("");
    setCarregando(true);

    try {
      await enviarLogoEmpresa({
        empresaId: empresaCriadaId,

        arquivo: logoArquivo,
      });

      await atualizarContextoEmpresa(empresaCriadaId);

      navigate("/painel", {
        replace: true,
      });
    } catch (error) {
      console.error("Erro ao reenviar logo:", error);

      setSucesso("Sua empresa já está cadastrada.");

      setErro(
        "Ainda não foi possível enviar a logo. Você pode tentar novamente ou continuar sem ela.",
      );
    } finally {
      setCarregando(false);
    }
  }

  async function continuarSemLogo() {
    if (!empresaCriadaId || carregando) {
      return;
    }

    setErro("");
    setCarregando(true);

    try {
      await atualizarContextoEmpresa(empresaCriadaId);

      navigate("/painel", {
        replace: true,
      });
    } catch (error) {
      console.error("Erro ao abrir painel:", error);

      setErro("Não foi possível abrir o painel. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  async function trocarConta() {
    if (carregando) {
      return;
    }

    setErro("");
    setSucesso("");
    setCarregando(true);

    try {
      await sair();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Erro ao trocar de conta:", error);

      setErro("Não foi possível sair da conta atual. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  if (loading) {
    return (
      <main className="cadastro-page">
        <div className="cadastro-loading">Carregando...</div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="cadastro-page">
      <section className="cadastro-card">
        <div className="cadastro-voltar-area">
          <Link className="cadastro-voltar" to="/">
            ← Voltar ao início
          </Link>
        </div>

        <header className="cadastro-header">
          <div className="cadastro-marca">
            <div className="cadastro-logo">
              <img src={logoMultsigma} alt="Logo da Multsigma" />
            </div>

            <div>
              <h1>Multsigma</h1>

              <p>Sua gestão de múltiplas lojas.</p>
            </div>
          </div>
        </header>

        <form
          className="cadastro-form"
          onSubmit={handleSubmit}
          aria-busy={carregando}
        >
          <div className="cadastro-titulo">
            <h2>Cadastre sua empresa</h2>

            <p>Complete os dados abaixo para começar a usar o Multsigma.</p>
          </div>

          {sucesso && (
            <div className="cadastro-success" role="status">
              {sucesso}
            </div>
          )}

          {erro && (
            <div className="cadastro-error" role="alert">
              {erro}
            </div>
          )}

          <div className="cadastro-logo-area">
            <div className="cadastro-logo-preview">
              {logoPreview ? (
                <img src={logoPreview} alt="Prévia da logo da empresa" />
              ) : (
                <div className="cadastro-logo-vazia">
                  <span aria-hidden="true">🏪</span>

                  <small>Logo da empresa</small>
                </div>
              )}
            </div>

            <div className="cadastro-logo-controles">
              <strong>Logo da empresa</strong>

              <p>JPG, PNG ou WEBP, até 5 MB.</p>

              <div className="cadastro-logo-acoes">
                <label className="cadastro-logo-botao" htmlFor="logoEmpresa">
                  {logoArquivo ? "Trocar logo" : "Adicionar logo"}
                </label>

                <input
                  id="logoEmpresa"
                  name="logoEmpresa"
                  className="cadastro-logo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={selecionarLogo}
                  disabled={carregando}
                />

                {logoArquivo && (
                  <button
                    type="button"
                    className="cadastro-logo-remover"
                    onClick={removerLogo}
                    disabled={carregando}
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="cadastro-field">
            <label htmlFor="nomeEmpresa">Nome da empresa ou loja</label>

            <input
              id="nomeEmpresa"
              name="nomeEmpresa"
              type="text"
              value={nomeEmpresa}
              onChange={(event) => setNomeEmpresa(event.target.value)}
              placeholder="Ex.: Multsigma"
              autoComplete="organization"
              maxLength={120}
              disabled={carregando || cadastroFinalizado}
              required
            />
          </div>

          <div className="cadastro-field">
            <label htmlFor="nomeResponsavel">Nome do responsável</label>

            <input
              id="nomeResponsavel"
              name="nomeResponsavel"
              type="text"
              value={nomeResponsavel}
              onChange={(event) =>
                setNomeResponsavelEditado(event.target.value)
              }
              placeholder="Seu nome completo"
              autoComplete="name"
              maxLength={120}
              disabled={carregando || cadastroFinalizado}
              required
            />
          </div>

          <div className="cadastro-field">
            <label htmlFor="emailCadastro">E-mail da conta</label>

            <input
              id="emailCadastro"
              name="email"
              type="email"
              value={email}
              readOnly
              aria-readonly="true"
            />

            <small className="cadastro-field-ajuda">
              Este e-mail vem da conta usada para entrar no Multsigma.
            </small>
          </div>

          {!cadastroFinalizado && (
            <button
              className="cadastro-submit"
              type="submit"
              disabled={carregando}
            >
              {carregando ? "Criando empresa..." : "Criar minha empresa"}
            </button>
          )}

          {cadastroFinalizado && (
            <div className="cadastro-pos-criacao">
              {logoArquivo && (
                <button
                  className="cadastro-submit"
                  type="button"
                  onClick={tentarEnviarLogoNovamente}
                  disabled={carregando}
                >
                  {carregando ? "Enviando..." : "Tentar enviar logo novamente"}
                </button>
              )}

              <button
                className="cadastro-continuar"
                type="button"
                onClick={continuarSemLogo}
                disabled={carregando}
              >
                Continuar para o painel
              </button>
            </div>
          )}

          <div className="cadastro-conta-info">
            <span>Entrou com a conta errada?</span>

            <button type="button" onClick={trocarConta} disabled={carregando}>
              Trocar de conta
            </button>
          </div>
        </form>

        <footer className="cadastro-footer">
          <span>Multsigma</span>

          <span>
            Desenvolvido por <strong>Sigma Orbitek</strong>
          </span>
        </footer>
      </section>
    </main>
  );
}

export default CadastroEmpresa;
