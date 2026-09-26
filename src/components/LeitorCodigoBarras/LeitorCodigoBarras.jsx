import { useEffect, useRef, useState } from "react";

import { BrowserMultiFormatReader } from "@zxing/browser";

import "./LeitorCodigoBarras.css";

function LeitorCodigoBarras({ onDetectado, onCancelar }) {
  const videoRef = useRef(null);
  const controlesRef = useRef(null);
  const finalizadoRef = useRef(false);

  const [erro, setErro] = useState("");

  const [iniciando, setIniciando] = useState(true);

  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let componenteAtivo = true;

    finalizadoRef.current = false;

    async function iniciarCamera() {
      try {
        setErro("");
        setIniciando(true);

        controlesRef.current?.stop();
        controlesRef.current = null;

        const leitor = new BrowserMultiFormatReader();

        const controles = await leitor.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (resultado) => {
            if (!resultado || finalizadoRef.current) {
              return;
            }

            finalizadoRef.current = true;

            const codigo = resultado.getText();

            controlesRef.current?.stop();

            onDetectado(codigo);
          },
        );

        if (!componenteAtivo) {
          controles.stop();

          return;
        }

        controlesRef.current = controles;
      } catch (error) {
        console.error("Erro ao iniciar leitor de código de barras:", error);

        if (!componenteAtivo) {
          return;
        }

        if (
          error?.name === "NotAllowedError" ||
          error?.name === "PermissionDeniedError"
        ) {
          setErro(
            "O acesso à câmera foi bloqueado. Permita o uso da câmera no navegador e tente novamente.",
          );
        } else if (
          error?.name === "NotFoundError" ||
          error?.name === "DevicesNotFoundError"
        ) {
          setErro("Nenhuma câmera foi encontrada neste dispositivo.");
        } else if (
          error?.name === "NotReadableError" ||
          error?.name === "TrackStartError"
        ) {
          setErro(
            "A câmera está sendo usada por outro aplicativo ou não pôde ser iniciada.",
          );
        } else {
          setErro(
            "Não foi possível iniciar a câmera. Verifique a permissão e tente novamente.",
          );
        }
      } finally {
        if (componenteAtivo) {
          setIniciando(false);
        }
      }
    }

    iniciarCamera();

    return () => {
      componenteAtivo = false;

      controlesRef.current?.stop();
      controlesRef.current = null;
    };
  }, [onDetectado, tentativa]);

  function tentarNovamente() {
    controlesRef.current?.stop();
    controlesRef.current = null;

    finalizadoRef.current = false;

    setErro("");
    setTentativa((valorAtual) => valorAtual + 1);
  }

  return (
    <div className="leitor-codigo">
      {!erro && (
        <>
          <div className="leitor-video-wrapper">
            <video
              ref={videoRef}
              className="leitor-video"
              muted
              playsInline
              aria-label="Visualização da câmera para leitura do código de barras"
            />

            <div className="leitor-mira" aria-hidden="true">
              <div className="leitor-mira-quadro">
                <span />
              </div>
            </div>

            {iniciando && (
              <div
                className="leitor-carregando"
                role="status"
                aria-live="polite"
              >
                <div className="leitor-carregando-spinner" />

                <span>Abrindo câmera...</span>
              </div>
            )}
          </div>

          <div className="leitor-instrucoes">
            <strong>Posicione o código dentro da área marcada</strong>

            <p>Mantenha a câmera estável e aguarde a leitura automática.</p>
          </div>
        </>
      )}

      {erro && (
        <div className="leitor-codigo-erro" role="alert">
          <div className="leitor-codigo-erro-icone" aria-hidden="true">
            📷
          </div>

          <div className="leitor-codigo-erro-conteudo">
            <strong>Não foi possível usar a câmera</strong>

            <p>{erro}</p>
          </div>
        </div>
      )}

      <div className="leitor-acoes">
        {erro && (
          <button
            type="button"
            className="button-primary"
            onClick={tentarNovamente}
          >
            Tentar novamente
          </button>
        )}

        <button type="button" className="button-secondary" onClick={onCancelar}>
          Fechar câmera
        </button>
      </div>
    </div>
  );
}

export default LeitorCodigoBarras;
