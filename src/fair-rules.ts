export type Direction = 'left' | 'right' | 'up' | 'down';
export function slide2048(board: number[], direction: Direction) {
  const next = board.slice();
  let score = 0;
  for (let line = 0; line < 4; line++) {
    const indices = Array.from({length: 4}, (_, i) => direction === 'left' ? line * 4 + i : direction === 'right' ? line * 4 + 3 - i : direction === 'up' ? i * 4 + line : (3 - i) * 4 + line);
    const values = indices.map(i => board[i]).filter(Boolean), merged: number[] = [];
    for (let i = 0; i < values.length; i++) {
      if (values[i] === values[i + 1]) { merged.push(values[i] * 2); score += values[i] * 2; i++; }
      else merged.push(values[i]);
    }
    indices.forEach((index, i) => next[index] = merged[i] || 0);
  }
  return {board: next, score, changed: next.some((v, i) => v !== board[i])};
}
export function canMove2048(board: number[]) {
  return board.some(v => v === 0) || (['left','right','up','down'] as Direction[]).some(d => slide2048(board, d).changed);
}
export function birdHits(y: number, pipeX: number, gapY: number, gap: number) {
  return y < .35 || y > 9.65 || (Math.abs(pipeX + 3.5) < .95 && (y - .3 < gapY - gap / 2 || y + .3 > gapY + gap / 2));
}
export function ringHit(x: number): number {
  return [-3, 0, 3].findIndex(target => Math.abs(target - x) <= .48);
}
