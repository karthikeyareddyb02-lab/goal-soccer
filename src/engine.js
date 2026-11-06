import { teamById } from './teams.js';

export const MODE_LABEL = {
  penalties: 'Penalties',
  freekicks: 'Free kicks',
};

export const WALL = { x0: 0.32, x1: 0.68, y0: 0.58 };
const SWEET = 0.64;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function hitsWall(x, y) {
  return y > WALL.y0 && x > WALL.x0 && x < WALL.x1;
}

export function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swapIndex];
    copy[swapIndex] = current;
  }
  return copy;
}

export function buildRoundOf16(ids) {
  const order = shuffle(ids);
  const ties = [];
  for (let index = 0; index < order.length; index += 2) {
    ties.push({
      id: `r16-${order[index]}-${order[index + 1]}`,
      homeId: order[index],
      awayId: order[index + 1],
      winnerId: null,
    });
  }
  return ties;
}

export function nextRound(ties) {
  const next = [];
  for (let index = 0; index < ties.length; index += 2) {
    const homeId = ties[index].winnerId;
    const awayId = ties[index + 1].winnerId;
    next.push({
      id: `r${ties.length}-${homeId}-${awayId}`,
      homeId,
      awayId,
      winnerId: null,
    });
  }
  return next;
}

export function roundName(tieCount) {
  if (tieCount >= 8) return 'Round of 16';
  if (tieCount === 4) return 'Quarter-finals';
  if (tieCount === 2) return 'Semi-finals';
  return 'Final';
}

export function playerTie(ties, playerId) {
  return ties.find((tie) => tie.homeId === playerId || tie.awayId === playerId) ?? null;
}

export function opponentOf(tie, playerId) {
  return tie.homeId === playerId ? tie.awayId : tie.homeId;
}

export function simulateWinner(home, away) {
  const homeScore = home.attack * 0.62 + home.defense * 0.38;
  const awayScore = away.attack * 0.62 + away.defense * 0.38;
  const probability = 1 / (1 + Math.exp(-(homeScore - awayScore) / 8));
  return Math.random() < probability ? home.id : away.id;
}

export function playOut(rounds) {
  const all = rounds.map((round) => round.map((tie) => ({ ...tie })));
  let current = all[all.length - 1].map((tie) => {
    if (tie.winnerId) return tie;
    return {
      ...tie,
      winnerId: simulateWinner(teamById(tie.homeId), teamById(tie.awayId)),
    };
  });
  all[all.length - 1] = current;

  while (current.length > 1) {
    current = nextRound(current).map((tie) => ({
      ...tie,
      winnerId: simulateWinner(teamById(tie.homeId), teamById(tie.awayId)),
    }));
    all.push(current);
  }

  return { rounds: all, championId: current[0].winnerId };
}

export function settleTournament({ rounds, playerTeamId, opponentTeamId, playerWon }) {
  const nextRounds = rounds.map((round) => round.map((tie) => ({ ...tie })));
  const index = nextRounds.length - 1;
  nextRounds[index] = nextRounds[index].map((tie) => {
    const involvesPlayer = tie.homeId === playerTeamId || tie.awayId === playerTeamId;
    if (involvesPlayer) {
      return { ...tie, winnerId: playerWon ? playerTeamId : opponentTeamId };
    }
    if (tie.winnerId) return tie;
    return {
      ...tie,
      winnerId: simulateWinner(teamById(tie.homeId), teamById(tie.awayId)),
    };
  });

  const isFinal = nextRounds[index].length === 1;
  if (playerWon && !isFinal) {
    nextRounds.push(nextRound(nextRounds[index]));
    return { rounds: nextRounds, championId: null, eliminatedRound: null, finished: false };
  }

  if (!isFinal) {
    const rest = playOut(nextRounds);
    return {
      rounds: rest.rounds,
      championId: rest.championId,
      eliminatedRound: roundName(nextRounds[index].length),
      finished: true,
    };
  }

  return {
    rounds: nextRounds,
    championId: nextRounds[index][0].winnerId,
    eliminatedRound: playerWon ? null : 'Final',
    finished: true,
  };
}

export function shootoutStatus(playerGoals, oppGoals, playerTaken, oppTaken) {
  if (playerTaken < 5 || oppTaken < 5) {
    const playerLeft = 5 - playerTaken;
    const oppLeft = 5 - oppTaken;
    if (playerGoals > oppGoals + oppLeft) {
      return { done: true, winner: 'player', sudden: false };
    }
    if (oppGoals > playerGoals + playerLeft) {
      return { done: true, winner: 'opponent', sudden: false };
    }
    return { done: false, winner: null, sudden: false };
  }

  if (playerTaken === oppTaken && playerGoals !== oppGoals) {
    return {
      done: true,
      winner: playerGoals > oppGoals ? 'player' : 'opponent',
      sudden: true,
    };
  }

  return { done: false, winner: null, sudden: true };
}

export function nextTaker(playerTaken, oppTaken) {
  return playerTaken === oppTaken ? 'player' : 'opponent';
}

function missLabel(y) {
  return y < 0.02 ? 'OVER' : 'WIDE';
}

export function resolveUserShot({ aimX, aimY, power, keeperSkill, mode }) {
  const spread = Math.abs(power - SWEET);
  const error = (mode === 'freekicks' ? 0.7 : 0.48) * spread;
  let x = aimX + (Math.random() - 0.5) * error;
  let y = aimY + (Math.random() - 0.5) * error * 0.8;

  if (power < 0.34) y += (0.34 - power) * 1.1;
  if (power > 0.84) {
    y -= (power - 0.84) * 1.15;
    x += (Math.random() - 0.5) * 0.18;
  }

  const readsShot = Math.random() < 0.22 + keeperSkill * 0.55;
  const diveX = readsShot
    ? clamp(aimX + (Math.random() - 0.5) * 0.18, 0.05, 0.95)
    : [0.14, 0.5, 0.86][Math.floor(Math.random() * 3)];
  const diveY = readsShot
    ? clamp(aimY + (Math.random() - 0.5) * 0.12, 0.08, 0.9)
    : 0.38 + Math.random() * 0.28;

  return finishShot({ x, y, diveX, diveY, mode, reach: 0.13 + keeperSkill * 0.15 });
}

export function createAiShot(attack, mode) {
  const skill = attack / 100;
  const goCorner = Math.random() < 0.5 + skill * 0.35;
  let x = goCorner
    ? (Math.random() < 0.5 ? 0.08 : 0.92) + (Math.random() - 0.5) * 0.06
    : 0.28 + Math.random() * 0.44;
  let y = mode === 'freekicks'
    ? 0.06 + Math.random() * (0.22 + skill * 0.12)
    : 0.08 + Math.random() * 0.5;

  const accurate = Math.random() < (mode === 'freekicks' ? 0.62 : 0.7) + skill * 0.22;
  if (!accurate) {
    const missWide = Math.random() < 0.65;
    if (missWide) x = Math.random() < 0.5 ? -0.08 : 1.08;
    else y = -0.08;
  }

  return { x, y };
}

export function resolveDive({ shot, diveX, diveY, playerDefense, mode }) {
  const reach = 0.18 + (playerDefense / 100) * 0.14;
  return finishShot({ x: shot.x, y: shot.y, diveX, diveY, mode, reach });
}

function finishShot({ x, y, diveX, diveY, mode, reach }) {
  const offTarget = x < 0.02 || x > 0.98 || y < 0.02 || y > 0.98;
  if (offTarget) {
    return { result: 'miss', label: missLabel(y), x, y, diveX, diveY };
  }
  if (mode === 'freekicks' && hitsWall(x, y)) {
    return { result: 'save', label: 'WALLED', x, y, diveX, diveY };
  }
  const saved = Math.hypot(x - diveX, y - diveY) < reach;
  return {
    result: saved ? 'save' : 'goal',
    label: saved ? 'SAVED' : 'GOAL',
    x,
    y,
    diveX,
    diveY,
  };
}
