import { useEffect, useRef, useState } from 'react';
import { toneKick, toneResult } from '../audio.js';
import { Crest } from '../components/Crest.jsx';
import { TopBar } from '../components/TopBar.jsx';
import {
  MODE_LABEL,
  clamp,
  createAiShot,
  hitsWall,
  nextTaker,
  resolveDive,
  resolveUserShot,
  roundName,
  shootoutStatus,
} from '../engine.js';

const HOME_DIVE = { x: 0.5, y: 0.62 };
const SUNSET = [
  [0, [36, 20, 63]],
  [0.22, [110, 42, 98]],
  [0.42, [225, 90, 120]],
  [0.56, [255, 122, 60]],
  [0.65, [255, 176, 58]],
  [0.74, [255, 210, 122]],
  [0.88, [255, 186, 150]],
  [1, [186, 168, 220]],
];

function sunsetAt(power) {
  let index = 0;
  while (index < SUNSET.length - 1 && power > SUNSET[index + 1][0]) index += 1;
  const [startAt, start] = SUNSET[index];
  const [endAt, end] = SUNSET[Math.min(index + 1, SUNSET.length - 1)];
  const span = endAt - startAt || 1;
  const mix = (power - startAt) / span;
  const channels = start.map((channel, channelIndex) => Math.round(channel + (end[channelIndex] - channel) * mix));
  return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
}

function createMatchState() {
  return {
    playerGoals: 0,
    oppGoals: 0,
    playerTaken: 0,
    oppTaken: 0,
    log: [],
    phase: 'player-aim',
    taker: 'player',
    sudden: false,
    banner: '',
    bannerKind: '',
    flight: null,
    dive: HOME_DIVE,
    shotResult: null,
    winner: null,
  };
}

export function MatchScreen({
  mode,
  player,
  opponent,
  roundTieCount,
  onExit,
  onRematch,
  onChangeClubs,
  onContinue,
}) {
  const [state, setState] = useState(createMatchState);
  const sceneRef = useRef(null);
  const goalRef = useRef(null);
  const ballRef = useRef(null);
  const reticleRef = useRef(null);
  const meterRef = useRef(null);
  const timerRef = useRef(null);
  const primaryRef = useRef(null);
  const aimRef = useRef({ x: 0.5, y: 0.28 });
  const powerRef = useRef(0);
  const phaseRef = useRef(state.phase);
  const aiShotRef = useRef(null);
  const timersRef = useRef(new Set());
  const playerRef = useRef(player);
  const opponentRef = useRef(opponent);
  const modeRef = useRef(mode);

  phaseRef.current = state.phase;
  playerRef.current = player;
  opponentRef.current = opponent;
  modeRef.current = mode;

  const userKeeping = state.phase === 'keeper' || (state.phase !== 'player-aim' && state.taker === 'opponent');
  const keeperTeam = userKeeping ? player : opponent;
  const roundLabel = roundTieCount ? roundName(roundTieCount) : 'Match';

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => clearTimeout(id));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (state.phase !== 'player-aim') return undefined;
    const started = performance.now();
    let frame = 0;
    const loop = (now) => {
      const power = (Math.sin((now - started) / 260) + 1) / 2;
      powerRef.current = power;
      const meter = meterRef.current;
      const sunset = sunsetAt(power);
      if (meter) {
        meter.style.setProperty('--power', String(power));
        meter.style.setProperty('--sunset', sunset);
        meter.classList.toggle('is-sweet', power > 0.56 && power < 0.74);
      }
      sceneRef.current?.style.setProperty('--sky', sunset);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      sceneRef.current?.style.removeProperty('--sky');
    };
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== 'keeper') {
      aiShotRef.current = null;
      return undefined;
    }
    aiShotRef.current = createAiShot(opponentRef.current.attack, modeRef.current);
    if (timerRef.current) timerRef.current.style.transform = 'scaleX(1)';
    const started = performance.now();
    let frame = 0;
    const tick = (now) => {
      const progress = Math.min(1, (now - started) / 1300);
      if (timerRef.current) timerRef.current.style.transform = `scaleX(${1 - progress})`;
      if (progress < 1 && phaseRef.current === 'keeper') frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const timeout = setTimeout(() => {
      if (phaseRef.current === 'keeper') commitDive(0.5, 0.78);
    }, 1300);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [state.phase]);

  useEffect(() => {
    placeBall(state.flight);
  }, [state.flight]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return undefined;
    const observer = new ResizeObserver(() => {
      if (phaseRef.current === 'player-aim' || phaseRef.current === 'keeper') placeBall(null);
    });
    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (state.phase === 'done') primaryRef.current?.focus();
  }, [state.phase]);

  function later(fn, delay) {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, delay);
    timersRef.current.add(id);
  }

  function clearTimers() {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current.clear();
  }

  function placeBall(flight) {
    const scene = sceneRef.current;
    const goal = goalRef.current;
    const ball = ballRef.current;
    if (!scene || !goal || !ball) return;
    const sceneRect = scene.getBoundingClientRect();
    const homeX = scene.clientWidth / 2;
    const homeY = scene.clientHeight - 28;
    if (!flight) {
      ball.style.transition = 'none';
      ball.style.left = `${homeX}px`;
      ball.style.top = `${homeY}px`;
      ball.style.transform = 'translate(-50%, -50%) scale(1)';
      return;
    }
    const goalRect = goal.getBoundingClientRect();
    const x = clamp(flight.x, -0.12, 1.12);
    const y = clamp(flight.y, -0.18, 1.05);
    const targetX = goalRect.left - sceneRect.left + x * goalRect.width;
    const targetY = goalRect.top - sceneRect.top + y * goalRect.height;
    ball.style.transition = 'none';
    ball.style.left = `${homeX}px`;
    ball.style.top = `${homeY}px`;
    ball.style.transform = 'translate(-50%, -50%) scale(1)';
    void ball.offsetWidth;
    ball.style.transition = 'left .55s cubic-bezier(.15,.7,.2,1), top .55s cubic-bezier(.2,.65,.2,1), transform .55s';
    ball.style.left = `${targetX}px`;
    ball.style.top = `${targetY}px`;
    ball.style.transform = 'translate(-50%, -50%) scale(0.62)';
  }

  function placeReticle(x, y) {
    aimRef.current = { x, y };
    const reticle = reticleRef.current;
    if (!reticle) return;
    reticle.style.left = `${x * 100}%`;
    reticle.style.top = `${y * 100}%`;
    const blocked = modeRef.current === 'freekicks' && hitsWall(x, y);
    reticle.classList.toggle('is-blocked', blocked);
  }

  function aimFromEvent(event) {
    const rect = goalRef.current.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0.03, 0.97),
      y: clamp((event.clientY - rect.top) / rect.height, 0.03, 0.97),
    };
  }

  function beginFlight(side, outcome) {
    clearTimers();
    toneKick();
    setState((prev) => {
      const playerGoals = prev.playerGoals + (side === 'player' && outcome.result === 'goal' ? 1 : 0);
      const oppGoals = prev.oppGoals + (side === 'opponent' && outcome.result === 'goal' ? 1 : 0);
      const playerTaken = prev.playerTaken + (side === 'player' ? 1 : 0);
      const oppTaken = prev.oppTaken + (side === 'opponent' ? 1 : 0);
      const status = shootoutStatus(playerGoals, oppGoals, playerTaken, oppTaken);
      return {
        ...prev,
        playerGoals,
        oppGoals,
        playerTaken,
        oppTaken,
        sudden: status.sudden,
        log: [...prev.log, { side, result: outcome.result }],
        phase: 'flight',
        taker: side,
        banner: '',
        bannerKind: '',
        flight: { x: outcome.x, y: outcome.y },
        dive: { x: outcome.diveX, y: outcome.diveY },
        shotResult: outcome.result,
      };
    });
    later(() => {
      toneResult(outcome.result);
      setState((prev) => ({
        ...prev,
        phase: 'result',
        banner: outcome.label,
        bannerKind: outcome.result,
      }));
    }, 540);
    later(() => {
      setState((prev) => {
        const status = shootoutStatus(prev.playerGoals, prev.oppGoals, prev.playerTaken, prev.oppTaken);
        if (status.done) {
          return { ...prev, phase: 'done', winner: status.winner, banner: '', sudden: status.sudden };
        }
        const taker = nextTaker(prev.playerTaken, prev.oppTaken);
        if (taker === 'player') {
          return {
            ...prev,
            phase: 'player-aim',
            taker: 'player',
            banner: '',
            bannerKind: '',
            flight: null,
            dive: HOME_DIVE,
            shotResult: null,
            sudden: status.sudden,
          };
        }
        return {
          ...prev,
          phase: 'keeper',
          taker: 'opponent',
          banner: '',
          bannerKind: '',
          flight: null,
          dive: HOME_DIVE,
          shotResult: null,
          sudden: status.sudden,
        };
      });
    }, 1480);
  }

  function shoot(x, y, power) {
    if (phaseRef.current !== 'player-aim') return;
    phaseRef.current = 'flight';
    const outcome = resolveUserShot({
      aimX: x,
      aimY: y,
      power,
      keeperSkill: opponentRef.current.defense / 100,
      mode: modeRef.current,
    });
    beginFlight('player', outcome);
  }

  function commitDive(x, y) {
    if (phaseRef.current !== 'keeper') return;
    const shot = aiShotRef.current ?? createAiShot(opponentRef.current.attack, modeRef.current);
    phaseRef.current = 'flight';
    const outcome = resolveDive({
      shot,
      diveX: x,
      diveY: y,
      playerDefense: playerRef.current.defense,
      mode: modeRef.current,
    });
    beginFlight('opponent', outcome);
  }

  function onPointerMove(event) {
    if (phaseRef.current !== 'player-aim' && phaseRef.current !== 'keeper') return;
    const aim = aimFromEvent(event);
    placeReticle(aim.x, aim.y);
  }

  function onPointerDown(event) {
    const aim = aimFromEvent(event);
    placeReticle(aim.x, aim.y);
    if (phaseRef.current === 'player-aim') shoot(aim.x, aim.y, powerRef.current);
    else if (phaseRef.current === 'keeper') commitDive(aim.x, aim.y);
  }

  useEffect(() => {
    function onKeyDown(event) {
      const aiming = phaseRef.current === 'player-aim' || phaseRef.current === 'keeper';
      if (!aiming) return;
      const step = 0.04;
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight' || event.code === 'ArrowUp' || event.code === 'ArrowDown' || event.code === 'Space') {
        event.preventDefault();
      }
      if (event.code === 'ArrowLeft') placeReticle(clamp(aimRef.current.x - step, 0.03, 0.97), aimRef.current.y);
      if (event.code === 'ArrowRight') placeReticle(clamp(aimRef.current.x + step, 0.03, 0.97), aimRef.current.y);
      if (event.code === 'ArrowUp') placeReticle(aimRef.current.x, clamp(aimRef.current.y - step, 0.03, 0.97));
      if (event.code === 'ArrowDown') placeReticle(aimRef.current.x, clamp(aimRef.current.y + step, 0.03, 0.97));
      if (event.code === 'Space' && !event.repeat && phaseRef.current === 'player-aim') {
        shoot(aimRef.current.x, aimRef.current.y, powerRef.current);
      }
      if (event.code === 'Space' && !event.repeat && phaseRef.current === 'keeper') {
        commitDive(aimRef.current.x, aimRef.current.y);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const hint = state.phase === 'keeper'
    ? 'Click the spot you want to dive. Wait too long and you stay on your line.'
    : state.phase === 'player-aim'
      ? mode === 'freekicks'
        ? 'Clear the wall. Click a high corner when the bar turns gold.'
        : 'The bar moves through sunset. Click the goal when it turns gold.'
      : state.phase === 'done'
        ? 'Shootout over.'
        : 'Watch the ball.';

  const turnLabel = state.phase === 'keeper' || state.taker === 'opponent'
    ? 'Their kick. You keep.'
    : mode === 'freekicks'
      ? 'Your free kick'
      : 'Your penalty';

  const winnerName = state.winner === 'player' ? player.name : opponent.name;

  return (
    <section className="match">
      <TopBar
        kicker={`${MODE_LABEL[mode]} · ${roundLabel}`}
        title={turnLabel}
        onBack={onExit}
        backLabel="Exit"
      />
      <div className="scoreboard">
        <TeamScore team={player} goals={state.playerGoals} log={state.log} side="player" sudden={state.sudden} />
        <p className="score-gap">{state.sudden ? 'Sudden death' : 'Best of five'}</p>
        <TeamScore team={opponent} goals={state.oppGoals} log={state.log} side="opponent" sudden={state.sudden} align="end" />
      </div>
      <div className={state.phase === 'keeper' ? 'dive-timer is-live' : 'dive-timer'}>
        <span ref={timerRef} />
      </div>
      <div className="match-layout">
        <div className={state.phase === 'player-aim' ? 'meter-wrap' : 'meter-wrap is-idle'}>
          <div className="meter" ref={meterRef} aria-hidden="true">
            <span className="sweet" />
            <span className="fill" />
          </div>
          <span className="meter-label">Power</span>
        </div>
        <div className="scene" ref={sceneRef}>
          <div
            className={state.phase === 'player-aim' || state.phase === 'keeper' ? 'goal is-live' : 'goal'}
            ref={goalRef}
            onPointerMove={onPointerMove}
            onPointerDown={onPointerDown}
          >
            <div className="net" />
            {mode === 'freekicks' ? (
              <div className="wall" aria-hidden="true">
                <span /><span /><span /><span />
              </div>
            ) : null}
            <Keeper
              team={keeperTeam}
              dive={state.dive}
              phase={state.phase}
              shotResult={state.shotResult}
            />
            <div className="reticle" ref={reticleRef} />
            {state.banner ? (
              <div className={`banner banner-${state.bannerKind}`} role="status">{state.banner}</div>
            ) : null}
          </div>
          <div className="spot-mark" />
          <div className="ball" ref={ballRef} />
        </div>
      </div>
      <p className="hint">{hint}</p>
      <p className="hint keys">Arrows move the aim. Space shoots or dives.</p>
      {state.phase === 'done' ? (
        <div className="result-card">
          <p className="kicker">{winnerName}</p>
          <p className="scoreline">{state.playerGoals} — {state.oppGoals}</p>
          <p className="lede">{state.winner === 'player' ? 'You take the tie.' : 'They take the tie.'}</p>
          <div className="result-actions">
            {onContinue != null ? (
              <button ref={primaryRef} type="button" className="btn" onClick={() => onContinue(state.winner)}>
                Continue
              </button>
            ) : null}
            {onRematch != null ? (
              <button ref={primaryRef} type="button" className="btn" onClick={onRematch}>
                Play again
              </button>
            ) : null}
            {onChangeClubs != null ? (
              <button type="button" className="btn secondary" onClick={onChangeClubs}>
                Change clubs
              </button>
            ) : null}
            <button type="button" className="btn secondary" onClick={onExit}>Home</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function diveSide(dive) {
  if (dive.y > 0.72 && dive.x > 0.38 && dive.x < 0.62) return 'low';
  if (dive.x < 0.4) return 'left';
  if (dive.x > 0.6) return 'right';
  return 'high';
}

function Keeper({ team, dive, phase, shotResult }) {
  const diving = phase === 'flight' || phase === 'result' || phase === 'done';
  const pose = diving ? `${shotResult === 'save' ? 'save' : 'dive'}-${diveSide(dive)}` : 'stand';
  return (
    <div
      className={`keeper is-${pose}`}
      style={{
        left: `${dive.x * 100}%`,
        top: `${dive.y * 100}%`,
        '--kit': team.primary,
        '--kit-2': team.secondary,
      }}
      aria-hidden="true"
    >
      <div className="keeper-body">
        <div className="keeper-bob">
          <span className="arm left"><span className="glove" /></span>
          <span className="arm right"><span className="glove" /></span>
          <span className="head" />
          <span className="torso" />
          <span className="shorts" />
          <span className="leg left"><span className="boot" /></span>
          <span className="leg right"><span className="boot" /></span>
        </div>
      </div>
    </div>
  );
}

function TeamScore({ team, goals, log, side, sudden, align = 'start' }) {
  const kicks = log.filter((kick) => kick.side === side);
  const taken = kicks.length;
  const slots = sudden ? Math.max(5, taken) : 5;
  return (
    <div className={align === 'end' ? 'team-score align-end' : 'team-score'}>
      <div className="team-score-id">
        <Crest team={team} size="sm" />
        <span>{team.short}</span>
      </div>
      <p className="goals">{goals}</p>
      <div className="dots" aria-label={`${team.name} kicks`}>
        {Array.from({ length: slots }, (_, index) => {
          const kick = kicks[index];
          const kind = kick ? kick.result : 'pending';
          return <span key={`${side}-${index}`} className={`dot dot-${kind}`} />;
        })}
      </div>
    </div>
  );
}
