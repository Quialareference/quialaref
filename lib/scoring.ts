// Rank-based scoring: 1st correct = 1000, 2nd = 800, 3rd = 600, 4th = 400, 5th+ = 200
// Wrong answer = 0

const RANK_POINTS = [1000, 800, 600, 400, 200];

export function calculatePoints(rank: number, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  return RANK_POINTS[Math.min(rank - 1, RANK_POINTS.length - 1)];
}
