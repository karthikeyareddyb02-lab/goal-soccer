import { RoundSteps, TieList } from '../components/TieList.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { MODE_LABEL, opponentOf, playerTie, roundName } from '../engine.js';
import { teamById } from '../teams.js';

export function BracketScreen({ mode, playerId, rounds, onBack, onPlay }) {
  const current = rounds[rounds.length - 1];
  const tie = playerTie(current, playerId);
  const foe = teamById(opponentOf(tie, playerId));
  const previous = rounds.length > 1 ? playerTie(rounds[rounds.length - 2], playerId) : null;
  const previousFoe = previous ? teamById(opponentOf(previous, playerId)) : null;
  const atHome = tie.homeId === playerId;

  return (
    <section>
      <TopBar
        kicker={`${MODE_LABEL[mode]} · Tournament`}
        title={roundName(current.length)}
        onBack={onBack}
        backLabel="Exit"
      />
      <RoundSteps currentIndex={rounds.length - 1} />
      <div className="faceoff">
        <p className="kicker">{atHome ? 'Drawn at home' : 'Drawn away'}</p>
        <h2>You face {foe.name}</h2>
        {previousFoe ? <p className="lede">Last round you beat {previousFoe.name}. The bracket kept its shape.</p> : <p className="lede">The other ties are decided when your shootout ends. Win four and the tournament is yours.</p>}
      </div>
      <TieList ties={current} playerId={playerId} />
      <div className="dock">
        <p>{current.length === 1 ? 'This is the final.' : `${current.length} ties in this round.`}</p>
        <button type="button" className="btn" onClick={onPlay}>
          {current.length === 1 ? 'Play the final' : 'Start shootout'}
        </button>
      </div>
    </section>
  );
}
