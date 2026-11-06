import { TEAMS, teamById } from './teams.js';
import { buildRoundOf16, opponentOf, playerTie, settleTournament } from './engine.js';

export const initialState = {
  screen: 'home',
  mode: null,
  subMode: null,
  playerTeamId: null,
  opponentTeamId: null,
  rounds: [],
  championId: null,
  eliminatedRound: null,
  matchKey: 0,
};

export function reducer(state, action) {
  switch (action.type) {
    case 'mode':
      return {
        ...initialState,
        mode: action.mode,
        screen: 'submode',
        matchKey: state.matchKey,
      };
    case 'submode':
      return {
        ...state,
        subMode: action.subMode,
        screen: 'pick-team',
        playerTeamId: null,
        opponentTeamId: null,
        rounds: [],
        championId: null,
        eliminatedRound: null,
      };
    case 'team':
      if (state.subMode === 'tournament') {
        return {
          ...state,
          playerTeamId: action.id,
          opponentTeamId: null,
          rounds: [buildRoundOf16(TEAMS.map((team) => team.id))],
          championId: null,
          eliminatedRound: null,
          screen: 'bracket',
        };
      }
      return {
        ...state,
        playerTeamId: action.id,
        screen: 'pick-opponent',
      };
    case 'opponent':
      return {
        ...state,
        opponentTeamId: action.id,
        screen: 'play',
        matchKey: state.matchKey + 1,
      };
    case 'play-tie': {
      const round = state.rounds[state.rounds.length - 1];
      const tie = playerTie(round, state.playerTeamId);
      return {
        ...state,
        opponentTeamId: opponentOf(tie, state.playerTeamId),
        screen: 'play',
        matchKey: state.matchKey + 1,
      };
    }
    case 'match-complete': {
      const settled = settleTournament({
        rounds: state.rounds,
        playerTeamId: state.playerTeamId,
        opponentTeamId: state.opponentTeamId,
        playerWon: action.winner === 'player',
      });
      return {
        ...state,
        rounds: settled.rounds,
        championId: settled.championId,
        eliminatedRound: settled.eliminatedRound,
        opponentTeamId: null,
        screen: settled.finished ? 'champion' : 'bracket',
      };
    }
    case 'rematch':
      return { ...state, screen: 'play', matchKey: state.matchKey + 1 };
    case 'change-clubs':
      return { ...state, screen: 'pick-team', opponentTeamId: null };
    case 'retry-tournament':
      return {
        ...state,
        screen: 'pick-team',
        playerTeamId: null,
        opponentTeamId: null,
        rounds: [],
        championId: null,
        eliminatedRound: null,
      };
    case 'home':
      return { ...initialState, matchKey: state.matchKey };
    case 'back':
      return goBack(state);
    default:
      return state;
  }
}

function goBack(state) {
  switch (state.screen) {
    case 'submode':
      return { ...initialState, matchKey: state.matchKey };
    case 'pick-team':
      return { ...state, screen: 'submode' };
    case 'pick-opponent':
      return { ...state, screen: 'pick-team' };
    case 'bracket':
      return { ...initialState, matchKey: state.matchKey };
    case 'play':
      return state.subMode === 'tournament'
        ? { ...state, screen: 'bracket', opponentTeamId: null }
        : { ...state, screen: 'pick-opponent' };
    case 'champion':
      return { ...initialState, matchKey: state.matchKey };
    default:
      return state;
  }
}

export function currentRound(state) {
  if (state.rounds.length === 0) return [];
  return state.rounds[state.rounds.length - 1];
}

export function selectedTeam(id) {
  return id ? teamById(id) : null;
}
