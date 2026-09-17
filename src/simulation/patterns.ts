export const patterns: Record<string, string[]> = {
  'Glider': ['.O.', '..O', 'OOO'],
  'R-pentomino': ['.OO', 'OO.', '.O.'],
  'Acorn': ['.O.....', '...O...', 'OO..OOO'],
  'Diehard': ['......O.', 'OO......', '.O...OOO'],
  'Pulsar': ['..OOO...OOO..', '.............', 'O....O.O....O', 'O....O.O....O', 'O....O.O....O', '..OOO...OOO..', '.............', '..OOO...OOO..', 'O....O.O....O', 'O....O.O....O', 'O....O.O....O', '.............', '..OOO...OOO..'],
  'Gosper Glider Gun': ['........................O...........', '......................O.O...........', '............OO......OO............OO', '...........O...O....OO............OO', 'OO........O.....O...OO..............', 'OO........O...O.OO....O.O...........', '..........O.....O.......O...........', '...........O...O....................', '............OO......................'],
};
export function patternGrid(name: string, requestedSize: number): { size: number; state: Uint8Array } {
  const rows = patterns[name];
  const width = Math.max(...rows.map(row => row.length));
  const size = Math.max(requestedSize, width > 32 ? 48 : 32);
  const state = new Uint8Array(size * size);
  const ox = Math.floor((size - width) / 2), oz = Math.floor((size - rows.length) / 2);
  rows.forEach((row, z) => [...row].forEach((cell, x) => { if (cell === 'O') state[(oz + z) * size + ox + x] = 1; }));
  return { size, state };
}
