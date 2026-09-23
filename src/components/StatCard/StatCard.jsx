import "./StatCard.css";

function StatCard({ titulo, valor, descricao }) {
  return (
    <article className="stat-card">
      <span className="stat-card-titulo">{titulo}</span>

      <strong className="stat-card-valor">{valor}</strong>

      {descricao && <span className="stat-card-descricao">{descricao}</span>}
    </article>
  );
}

export default StatCard;
