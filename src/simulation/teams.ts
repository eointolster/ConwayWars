export const TEAMS = [
  { id: 1, name: 'Red', colour: '#ff635d' },
  { id: 2, name: 'Blue', colour: '#599fff' },
  { id: 3, name: 'Green', colour: '#68dc8b' },
  { id: 4, name: 'Gold', colour: '#f3c75a' },
  { id: 5, name: 'Violet', colour: '#bd85f3' },
] as const;
export const teamInfo = (id: number) => TEAMS[id - 1] ?? TEAMS[0];
