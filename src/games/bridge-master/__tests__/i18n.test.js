import { describe, expect, it } from "vitest";
import { uz } from "../i18n/uz.js";
import { ru } from "../i18n/ru.js";
import { en } from "../i18n/en.js";
import { getDictionary, levelText, normalizeLang } from "../i18n/index.js";
import { levels } from "../levels/index.js";
import { starsFromProgress } from "../BridgeMaster.jsx";

// Same shape as Uzbek: same keys, same value types, same array lengths, no empty strings.
function shape(value, path = "") {
  if (typeof value === "function") return [`${path}:fn`];
  if (Array.isArray(value)) return [`${path}:[${value.length}]`, ...value.flatMap((v, i) => shape(v, `${path}[${i}]`))];
  if (value && typeof value === "object")
    return Object.keys(value).sort().flatMap((k) => shape(value[k], path ? `${path}.${k}` : k));
  return [`${path}:${typeof value}`];
}
const strip = (dictionary) => {
  const { levelTexts: _levelTexts, ...rest } = dictionary;
  return rest;
};
function emptyStrings(value, path = "") {
  if (typeof value === "string") return value.trim() ? [] : [path];
  if (Array.isArray(value)) return value.flatMap((v, i) => emptyStrings(v, `${path}[${i}]`));
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([k, v]) => emptyStrings(v, `${path}.${k}`));
  return [];
}

describe.each([["ru", ru], ["en", en]])("%s dictionary", (_name, dictionary) => {
  it("has exactly the Uzbek keys", () => expect(shape(strip(dictionary))).toEqual(shape(strip(uz))));
  it("has no empty text", () => expect(emptyStrings(dictionary)).toEqual([]));
  it("names every level and gives a hint to every level that has one in Uzbek", () => {
    expect(Object.keys(dictionary.levelTexts).sort()).toEqual(levels.map((l) => l.id).sort());
    expect(Object.keys(dictionary.levelHints).sort()).toEqual(Object.keys(uz.levelHints).sort());
  });
  it("formats the parameterised strings", () => {
    expect(dictionary.node("a")).toContain("A");
    expect(dictionary.levelLabel(3, "X")).toContain("3");
    expect(dictionary.intro.levelBadge(2, 20)).toMatch(/2.*20/);
    expect(dictionary.save.pending(2)).toContain("2");
  });
});

describe("dictionary selection", () => {
  it("falls back to Uzbek for unknown languages and missing keys", () => {
    expect(normalizeLang("fr")).toBe("uz");
    expect(getDictionary("fr").start).toBe(uz.start);
    expect(getDictionary("ru", { ru: { start: "Go" } }).start).toBe("Go");
    expect(getDictionary("ru").pause).toBe(ru.pause);
  });
  it("localises level names and keeps the JSON names for Uzbek", () => {
    const [first] = levels;
    expect(levelText(first, getDictionary("uz")).title).toBe(first.title);
    expect(levelText(first, getDictionary("en")).title).toBe("First Bridge");
  });
});

describe("server progress", () => {
  it("shows completed levels and the best stars for the current score version only", () => {
    const scope = (levelId, stars, scoreVersion = 1, modeId = "default") => ({
      modeId, levelId, scoreVersion, bestResult: { metrics: { stars } },
    });
    expect(
      starsFromProgress({
        completedLevelIds: ["bridge-01", "bridge-02"],
        scopes: [scope("bridge-01", 3), scope("bridge-02", 2, 2), scope("bridge-03", 3, 1, "other")],
      }),
    ).toEqual({ "bridge-01": 3, "bridge-02": 1 });
  });
  it("copes with the empty first-run structures", () => {
    expect(starsFromProgress({ completedLevelIds: [], scopes: [] })).toEqual({});
    expect(starsFromProgress(undefined)).toEqual({});
  });
});
