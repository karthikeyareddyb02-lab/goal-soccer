import { Crest } from '../components/Crest.jsx';
import { RoundSteps, TieList } from '../components/TieList.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { MODE_LABEL, roundName } from '../engine.js';
import { teamById } from '../teams.js';

export function ChampionScreen({ mode, playerId, rounds, championId, eliminatedRound, onHome, onRetry }) {
  const champion = teamById(championId);
  const playerWon = championId === playerId;
  const headline = playerWon ? 'Champions' : champion.name;
  const detail = playerWon
    ? 'Four wins. The trophy is yours.'
    : eliminatedRound === 'Final'
      ? 'You lost the final.'
      : `You went out in the ${eliminatedRound}.`;

  return (
    <section>
      <TopBar
        kicker={`${MODE_LABEL[mode]} · Tournament`}
        title={playerWon ? 'You won it' : 'Tournament over'}
        onBack={onHome}
        backLabel="Home"
      />
      <div className="champion">
        <Crest team={champion} size="lg" />
        <p className="kicker">{playerWon ? 'Your club' : 'Winners'}</p>
        <h2>{headline}</h2>
        <p className="lede">{detail}</p>
      </div>
      <div className="dock dock-inline">
        <button type="button" className="btn" onClick={onRetry}>New tournament</button>
        <button type="button" className="btn secondary" onClick={onHome}>Home</button>
      </div>
      <RoundSteps currentIndex={3} />
      {rounds.map((round) => (
        <section key={roundName(round.length)} className="round-block">
          <h3>{roundName(round.length)}</h3>
          <TieList ties={round} playerId={playerId} />
        </section>
      ))}
    </section>
  );
}
