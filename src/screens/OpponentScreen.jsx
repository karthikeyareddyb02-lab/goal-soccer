import { useState } from 'react';
import { TeamGrid } from '../components/TeamGrid.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { MODE_LABEL } from '../engine.js';
import { TEAMS, teamById } from '../teams.js';

export function OpponentScreen({ mode, playerId, onBack, onConfirm }) {
  const [selectedId, setSelectedId] = useState(null);
  const player = teamById(playerId);
  const selected = selectedId ? teamById(selectedId) : null;

  return (
    <section>
      <TopBar
        kicker={`${MODE_LABEL[mode]} · Match`}
        title="Pick the opponent"
        onBack={onBack}
      />
      <p className="lede">Playing as {player.name}. One shootout, five kicks each.</p>
      <TeamGrid teams={TEAMS} selectedId={selectedId} markedId={playerId} onSelect={setSelectedId} />
      <div className="dock">
        <p>{selected ? `Opponent: ${selected.name}` : 'Choose who you face.'}</p>
        <button type="button" className="btn" disabled={!selected} onClick={() => onConfirm(selectedId)}>
          Start shootout
        </button>
      </div>
    </section>
  );
}
