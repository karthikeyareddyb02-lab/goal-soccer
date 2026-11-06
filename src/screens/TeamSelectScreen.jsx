import { useState } from 'react';
import { TeamGrid } from '../components/TeamGrid.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { MODE_LABEL } from '../engine.js';
import { TEAMS, teamById } from '../teams.js';

export function TeamSelectScreen({ mode, subMode, onBack, onConfirm }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = selectedId ? teamById(selectedId) : null;
  const tournament = subMode === 'tournament';

  return (
    <section>
      <TopBar
        kicker={`${MODE_LABEL[mode]} · ${tournament ? 'Tournament' : 'Match'}`}
        title="Pick your club"
        onBack={onBack}
      />
      <p className="lede">
        {tournament
          ? 'Sixteen clubs are in. Choose yours and the draw is shuffled around you.'
          : 'This is the club you take kicks for, and the club you keep goal for.'}
      </p>
      <TeamGrid teams={TEAMS} selectedId={selectedId} onSelect={setSelectedId} />
      <div className="dock">
        <p>{selected ? selected.name : 'Choose a club to continue.'}</p>
        <button type="button" className="btn" disabled={!selected} onClick={() => onConfirm(selectedId)}>
          {tournament ? 'Enter the draw' : 'Choose opponent'}
        </button>
      </div>
    </section>
  );
}
