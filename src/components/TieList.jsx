import { teamById } from '../teams.js';
import { Crest } from './Crest.jsx';

export function TieList({ ties, playerId }) {
  return (
    <ul className="ties">
      {ties.map((tie) => {
        const home = teamById(tie.homeId);
        const away = teamById(tie.awayId);
        const yours = tie.homeId === playerId || tie.awayId === playerId;
        return (
          <li key={tie.id} className={yours ? 'tie is-yours' : 'tie'}>
            <Side team={home} won={tie.winnerId === home.id} lost={Boolean(tie.winnerId) && tie.winnerId !== home.id} />
            <span className="vs">vs</span>
            <Side team={away} won={tie.winnerId === away.id} lost={Boolean(tie.winnerId) && tie.winnerId !== away.id} />
            {yours ? <span className="you-tag">You</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

function Side({ team, won, lost }) {
  const className = won ? 'side is-winner' : lost ? 'side is-out' : 'side';
  return (
    <span className={className}>
      <Crest team={team} size="sm" />
      <span>{team.name}</span>
    </span>
  );
}

export function RoundSteps({ currentIndex }) {
  const steps = ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];
  return (
    <ol className="steps">
      {steps.map((step, index) => {
        const className = index === currentIndex ? 'is-current' : index < currentIndex ? 'is-done' : undefined;
        return (
          <li key={step} className={className}>
            {step}
          </li>
        );
      })}
    </ol>
  );
}
