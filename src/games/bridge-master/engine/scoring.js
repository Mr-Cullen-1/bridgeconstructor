const valid = (r) =>
  Number.isFinite(r.materialUsed) &&
  r.materialUsed >= 0 &&
  Number.isFinite(r.stabilityScore) &&
  r.stabilityScore >= 0 &&
  r.stabilityScore <= 1;
export function calculateStars(level, result) {
  if (result.status !== "completed" || !valid(result)) return 0;
  if (result.materialUsed > level.parBudget) return 1;
  return result.stabilityScore >= level.threeStarStability ? 3 : 2;
}
export function calculateScore(level, result) {
  if (result.status !== "completed" || !valid(result)) return 0;
  const { base, savingBonus, stabilityBonus } = level.scoreConfig;
  const score = Math.round(
    base +
      savingBonus *
        Math.max(0, Math.min(1, 1 - result.materialUsed / level.budget)) +
      stabilityBonus * result.stabilityScore,
  );
  return Number.isFinite(score) ? Math.max(0, score) : 0;
}
