import { useReducer } from 'react';
import { currentRound, initialState, reducer, selectedTeam } from './state.js';
import { BracketScreen } from './screens/BracketScreen.jsx';
import { ChampionScreen } from './screens/ChampionScreen.jsx';
import { HomeScreen } from './screens/HomeScreen.jsx';
import { MatchScreen } from './screens/MatchScreen.jsx';
import { OpponentScreen } from './screens/OpponentScreen.jsx';
import { SubModeScreen } from './screens/SubModeScreen.jsx';
import { TeamSelectScreen } from './screens/TeamSelectScreen.jsx';

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const player = selectedTeam(state.playerTeamId);
  const opponent = selectedTeam(state.opponentTeamId);
  const screenKey = state.screen === 'play' ? `play-${state.matchKey}` : state.screen;

  return (
    <div className="app">
      <div className="screen" key={screenKey}>
        {state.screen === 'home' ? (
          <HomeScreen onMode={(mode) => dispatch({ type: 'mode', mode })} />
        ) : null}
        {state.screen === 'submode' ? (
          <SubModeScreen
            mode={state.mode}
            onSubMode={(subMode) => dispatch({ type: 'submode', subMode })}
          />
        ) : null}
        {state.screen === 'pick-team' ? (
          <TeamSelectScreen
            mode={state.mode}
            subMode={state.subMode}
            onBack={() => dispatch({ type: 'back' })}
            onConfirm={(id) => dispatch({ type: 'team', id })}
          />
        ) : null}
        {state.screen === 'pick-opponent' ? (
          <OpponentScreen
            mode={state.mode}
            playerId={state.playerTeamId}
            onBack={() => dispatch({ type: 'back' })}
            onConfirm={(id) => dispatch({ type: 'opponent', id })}
          />
        ) : null}
        {state.screen === 'bracket' ? (
          <BracketScreen
            mode={state.mode}
            playerId={state.playerTeamId}
            rounds={state.rounds}
            onBack={() => dispatch({ type: 'back' })}
            onPlay={() => dispatch({ type: 'play-tie' })}
          />
        ) : null}
        {state.screen === 'play' && player && opponent ? (
          <MatchScreen
            mode={state.mode}
            player={player}
            opponent={opponent}
            roundTieCount={state.subMode === 'tournament' ? currentRound(state).length : 0}
            onExit={() => dispatch({ type: 'home' })}
            onRematch={state.subMode === 'match' ? () => dispatch({ type: 'rematch' }) : null}
            onChangeClubs={state.subMode === 'match' ? () => dispatch({ type: 'change-clubs' }) : null}
            onContinue={
              state.subMode === 'tournament'
                ? (winner) => dispatch({ type: 'match-complete', winner })
                : null
            }
          />
        ) : null}
        {state.screen === 'champion' ? (
          <ChampionScreen
            mode={state.mode}
            playerId={state.playerTeamId}
            rounds={state.rounds}
            championId={state.championId}
            eliminatedRound={state.eliminatedRound}
            onHome={() => dispatch({ type: 'home' })}
            onRetry={() => dispatch({ type: 'retry-tournament' })}
          />
        ) : null}
      </div>
      <footer className="legal">Twelve Yards</footer>
    </div>
  );
}
