import { luminance } from '../teams.js';

export function Crest({ team, size = 'md' }) {
  const ink = luminance(team.primary) > 160 ? '#141414' : '#f6f6f6';
  const light = luminance(team.primary) > 200;
  return (
    <span
      className={light ? `crest crest-${size} is-light` : `crest crest-${size}`}
      style={{ background: team.primary, color: ink, '--stripe': team.secondary }}
      aria-hidden="true"
    >
      <span className="crest-stripe" />
      {team.short}
    </span>
  );
}
