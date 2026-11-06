export function TopBar({ kicker, title, onBack, backLabel = 'Back' }) {
  return (
    <header className="topbar">
      <button type="button" className="text-btn" onClick={onBack}>
        {backLabel}
      </button>
      <div>
        <p className="kicker">{kicker}</p>
        <h1>{title}</h1>
      </div>
    </header>
  );
}
