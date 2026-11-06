export const TEAMS = [
  { id: 'rma', name: 'Real Madrid', short: 'RMA', city: 'Madrid', attack: 90, defense: 86, primary: '#f4f4f4', secondary: '#c9a227' },
  { id: 'bar', name: 'Barcelona', short: 'BAR', city: 'Barcelona', attack: 88, defense: 82, primary: '#a50044', secondary: '#004d98' },
  { id: 'mci', name: 'Manchester City', short: 'MCI', city: 'Manchester', attack: 91, defense: 87, primary: '#6cabdd', secondary: '#1c2c5b' },
  { id: 'liv', name: 'Liverpool', short: 'LIV', city: 'Liverpool', attack: 89, defense: 84, primary: '#c8102e', secondary: '#00b2a9' },
  { id: 'bay', name: 'Bayern Munich', short: 'BAY', city: 'Munich', attack: 90, defense: 85, primary: '#dc052d', secondary: '#0066b2' },
  { id: 'psg', name: 'Paris Saint-Germain', short: 'PSG', city: 'Paris', attack: 89, defense: 83, primary: '#004170', secondary: '#da291c' },
  { id: 'ars', name: 'Arsenal', short: 'ARS', city: 'London', attack: 87, defense: 84, primary: '#ef0107', secondary: '#9c824a' },
  { id: 'int', name: 'Inter', short: 'INT', city: 'Milan', attack: 86, defense: 88, primary: '#010e80', secondary: '#a8a9ad' },
  { id: 'juv', name: 'Juventus', short: 'JUV', city: 'Turin', attack: 82, defense: 86, primary: '#ffffff', secondary: '#111111' },
  { id: 'atm', name: 'Atletico Madrid', short: 'ATM', city: 'Madrid', attack: 83, defense: 89, primary: '#cb3524', secondary: '#ffffff' },
  { id: 'che', name: 'Chelsea', short: 'CHE', city: 'London', attack: 84, defense: 83, primary: '#034694', secondary: '#dba111' },
  { id: 'bvb', name: 'Borussia Dortmund', short: 'BVB', city: 'Dortmund', attack: 86, defense: 80, primary: '#fde100', secondary: '#111111' },
  { id: 'mil', name: 'AC Milan', short: 'MIL', city: 'Milan', attack: 84, defense: 82, primary: '#fb090b', secondary: '#111111' },
  { id: 'aja', name: 'Ajax', short: 'AJA', city: 'Amsterdam', attack: 80, defense: 78, primary: '#d2122e', secondary: '#ffffff' },
  { id: 'ben', name: 'Benfica', short: 'BEN', city: 'Lisbon', attack: 81, defense: 79, primary: '#e10600', secondary: '#ffffff' },
  { id: 'por', name: 'Porto', short: 'POR', city: 'Porto', attack: 80, defense: 81, primary: '#003893', secondary: '#ffffff' },
];

const TEAM_MAP = new Map(TEAMS.map((team) => [team.id, team]));

export function teamById(id) {
  const team = TEAM_MAP.get(id);
  if (!team) {
    throw new Error(`Unknown team: ${id}`);
  }
  return team;
}

export function luminance(hex) {
  const value = hex.replace('#', '');
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000;
}
