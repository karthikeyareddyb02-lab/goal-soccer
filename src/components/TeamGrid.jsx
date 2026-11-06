import { Crest } from './Crest.jsx';

export function TeamGrid({ teams, selectedId, markedId, onSelect }) {
  return (
    <div className="team-grid">
      {teams.map((team) => {
        const selected = team.id === selectedId;
        const marked = team.id === markedId;
        return (
          <button
            key={team.id}
            type="button"
            className={selected ? 'team is-selected' : 'team'}
            aria-pressed={selected}
            disabled={marked}
            onClick={() => onSelect(team.id)}
          >
            <Crest team={team} />
            <span className="team-copy">
              <span className="team-name">{team.name}</span>
              <span className="team-city">{team.city}</span>
              <span className="ratings">
                <span>ATK {team.attack}</span>
                <span>DEF {team.defense}</span>
              </span>
            </span>
            {marked ? <span className="badge">You</span> : null}
          </button>
        );
      })}
    </div>
  );
}
