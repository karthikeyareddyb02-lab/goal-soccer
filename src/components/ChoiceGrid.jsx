export function ChoiceGrid({ kicker, title, lede, choices }) {
  return (
    <section className="choice-screen">
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      <p className="lede">{lede}</p>
      <div className="choice-grid">
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className={`choice choice-${choice.id}`}
            onClick={choice.onClick}
          >
            <span className="choice-index">{choice.index}</span>
            <span className="choice-title">{choice.title}</span>
            <span className="choice-copy">{choice.copy}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
