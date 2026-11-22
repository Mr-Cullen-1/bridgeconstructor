// GameLab contract v1 manifest. `levelIds` is passed in so the exported file always matches the level pack.
export const SCORE_VERSION = 1;

export const createManifest = (levelIds) => ({
  contractVersion: 1,
  gameId: "bridge-master",
  version: "1.2.0",
  kind: "level",
  title: { uz: "Bridge Master", ru: "Bridge Master", en: "Bridge Master" },
  languages: ["uz", "ru", "en"],
  ageRange: { min: 8 },
  orientation: "any",
  devices: { mobile: true, desktop: true },
  modeIds: ["default"],
  levelIds: [...levelIds],
  requiredCapabilities: ["webgl2"],
  dependencies: [{ name: "three", version: "0.187.0", delivery: "embedded" }],
  scoreVersion: SCORE_VERSION,
  metrics: {
    stars: { min: 0, max: 3, integer: true },
    score: { min: 0, max: 1000, integer: true },
    materialUsed: { min: 0, integer: true },
    stabilityScore: { min: 0, max: 1 },
  },
  // Only a successful bridge counts for the record: more stars, then a higher score, then faster.
  bestResult: {
    outcomes: ["success"],
    orderBy: [
      { field: "metrics.stars", direction: "desc" },
      { field: "metrics.score", direction: "desc" },
      { field: "durationSeconds", direction: "asc" },
    ],
  },
});
