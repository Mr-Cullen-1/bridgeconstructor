// Structural checks from GameLab-JSX-AUTHOR-CONTRACT.md §4. Returns a list of problems (empty = valid).
const kinds = ["level", "endless", "free", "mixed"];
const orientations = ["any", "portrait", "landscape"];
const capabilities = ["webgl2"];
const outcomes = ["success", "failure", "finished", "aborted"];
const isId = (value) => typeof value === "string" && value.length > 0 && !value.includes(".");
const unique = (list) => new Set(list).size === list.length;

export function validateManifest(m) {
  const errors = [];
  const check = (ok, message) => {
    if (!ok) errors.push(message);
  };
  if (!m || typeof m !== "object") return ["manifest must be an object"];
  check(m.contractVersion === 1, "contractVersion must be 1");
  check(isId(m.gameId), "gameId must be a stable id without dots");
  check(/^\d+\.\d+\.\d+$/.test(m.version ?? ""), "version must look like 1.0.0");
  check(kinds.includes(m.kind), "kind");
  for (const lang of ["uz", "ru", "en"])
    check(typeof m.title?.[lang] === "string" && m.title[lang].length > 0, `title.${lang}`);
  check(
    Array.isArray(m.languages) && ["uz", "ru", "en"].every((l) => m.languages.includes(l)),
    "languages must include uz, ru and en",
  );
  check(Number.isInteger(m.ageRange?.min) && m.ageRange.min >= 0, "ageRange.min");
  check(orientations.includes(m.orientation), "orientation");
  check(m.devices?.mobile === true && typeof m.devices.desktop === "boolean", "devices");
  const ids = (list) => Array.isArray(list) && list.every(isId) && unique(list);
  check(ids(m.modeIds) && m.modeIds.length > 0, "modeIds");
  check(ids(m.levelIds), "levelIds");
  check(m.kind !== "level" || m.levelIds?.length > 0, "a level game needs levelIds");
  check(
    Array.isArray(m.requiredCapabilities) && m.requiredCapabilities.every((c) => capabilities.includes(c)),
    "requiredCapabilities",
  );
  check(
    Array.isArray(m.dependencies) &&
      m.dependencies.every(
        (d) => typeof d?.name === "string" && d.name.length > 0 && typeof d.version === "string" && ["embedded", "host"].includes(d.delivery),
      ),
    "dependencies",
  );
  check(Number.isInteger(m.scoreVersion) && m.scoreVersion > 0, "scoreVersion");
  const metricNames = Object.keys(m.metrics ?? {});
  check(
    metricNames.every((name) => {
      const spec = m.metrics[name];
      return isId(name) && spec && ["min", "max"].every((k) => spec[k] === undefined || Number.isFinite(spec[k]));
    }),
    "metrics",
  );
  const rules = m.bestResult === null ? [] : m.bestResult?.byMode ? Object.values(m.bestResult.byMode) : [m.bestResult];
  check(m.bestResult !== undefined, "bestResult must be present (use null when there is no record)");
  for (const rule of rules) {
    if (rule === null) continue;
    check(
      Array.isArray(rule?.outcomes) && rule.outcomes.length > 0 && rule.outcomes.every((o) => outcomes.includes(o)),
      "bestResult.outcomes",
    );
    check(
      Array.isArray(rule?.orderBy) &&
        rule.orderBy.length > 0 &&
        rule.orderBy.every(
          (o) =>
            ["asc", "desc"].includes(o.direction) &&
            (o.field === "durationSeconds" ||
              (o.field.startsWith("metrics.") && metricNames.includes(o.field.slice(8)))),
        ),
      "bestResult.orderBy must use declared metrics or durationSeconds",
    );
  }
  return errors;
}
