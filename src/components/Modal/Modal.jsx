import "./Modal.css";

function Modal({ aberto, titulo, onFechar, children }) {
  if (!aberto) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onFechar}>
      <div
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{titulo}</h2>

          <button
            type="button"
            className="modal-close"
            onClick={onFechar}
            aria-label="Fechar"
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
