import { useEffect, useRef, useState } from "react";

import { BrowserMultiFormatReader } from "@zxing/browser";

import "./LeitorCodigoBarras.css";

function LeitorCodigoBarras({ onDetectado, onCancelar }) {
  const videoRef = useRef(null);
  const controlesRef = useRef(null);
  const finalizadoRef = useRef(false);

  const [erro, setErro] = useState("");
  const [iniciando, setIniciando] = useState(true);

  useEffect(() => {
    let componenteAtivo = true;

    async function iniciarCamera() {
      try {
        setErro("");
        setIniciando(true);

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
          setErro("Permissão para usar a câmera foi negada.");
        } else if (
          error?.name === "NotFoundError" ||
          error?.name === "DevicesNotFoundError"
        ) {
          setErro("Nenhuma câmera foi encontrada neste dispositivo.");
        } else {
          setErro("Não foi possível iniciar a câmera.");
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
  }, [onDetectado]);

  return (
    <div className="leitor-codigo">
      {erro ? (
        <div className="leitor-codigo-erro">{erro}</div>
      ) : (
        <>
          <div className="leitor-video-wrapper">
            <video ref={videoRef} className="leitor-video" muted playsInline />

            <div className="leitor-mira">
              <span />
            </div>
          </div>

          <p className="leitor-instrucao">
            {iniciando
              ? "Abrindo câmera..."
              : "Aponte a câmera para o código de barras."}
          </p>
        </>
      )}

      <button type="button" className="button-secondary" onClick={onCancelar}>
        Fechar câmera
      </button>
    </div>
  );
}

export default LeitorCodigoBarras;
