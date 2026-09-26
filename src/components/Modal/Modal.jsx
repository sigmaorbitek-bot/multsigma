import { useEffect, useId, useRef } from "react";

import "./Modal.css";

function Modal({ aberto, titulo, onFechar, children }) {
  const tituloId = useId();

  const botaoFecharRef = useRef(null);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onFechar?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    botaoFecharRef.current?.focus();

    return () => {
      document.body.style.overflow = overflowAnterior;

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [aberto, onFechar]);

  if (!aberto) {
    return null;
  }

  function handleOverlayMouseDown(event) {
    if (event.target === event.currentTarget) {
      onFechar?.();
    }
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
      >
        <div className="modal-header">
          <h2 id={tituloId}>{titulo}</h2>

          <button
            ref={botaoFecharRef}
            type="button"
            className="modal-close"
            onClick={onFechar}
            aria-label={`Fechar ${titulo}`}
            title="Fechar"
          >
            ×
          </button>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
