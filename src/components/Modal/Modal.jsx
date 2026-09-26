import { useId } from "react";

import "./Modal.css";

function Modal({ aberto, titulo, onFechar, children }) {
  const tituloId = useId();

  if (!aberto) {
    return null;
  }

  function handleOverlayMouseDown(event) {
    if (event.target === event.currentTarget) {
      onFechar?.();
    }
  }

  function handleKeyDown(event) {
    if (event.key !== "Escape") {
      return;
    }

    event.stopPropagation();

    onFechar?.();
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={handleOverlayMouseDown}
      onKeyDown={handleKeyDown}
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
