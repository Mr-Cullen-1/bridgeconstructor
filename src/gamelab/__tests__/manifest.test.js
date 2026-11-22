import { describe, expect, it } from "vitest";
import { createManifest } from "../manifest.js";
import { validateManifest } from "../validateManifest.js";
import { levels } from "../../games/bridge-master/levels/index.js";

const manifest = () => createManifest(levels.map((l) => l.id));

describe("GameLab manifest", () => {
  it("satisfies contract section 4 for the 20-level pack", () => {
    expect(validateManifest(manifest())).toEqual([]);
    expect(manifest().levelIds).toHaveLength(20);
  });
  it("is plain literal data (JSON round trip keeps it identical)", () => {
    expect(JSON.parse(JSON.stringify(manifest()))).toEqual(manifest());
  });
  it("rejects what the contract forbids", () => {
    const bad = (patch) => validateManifest({ ...manifest(), ...patch });
    expect(bad({ contractVersion: 2 })).toContain("contractVersion must be 1");
    expect(bad({ levelIds: [] })).toContain("a level game needs levelIds");
    expect(bad({ levelIds: ["a", "a"] })).toContain("levelIds");
    expect(bad({ levelIds: ["a.b"] })).toContain("levelIds");
    expect(bad({ languages: ["uz"] })).toContain("languages must include uz, ru and en");
    expect(bad({ requiredCapabilities: ["camera"] })).toContain("requiredCapabilities");
    expect(bad({ devices: { mobile: false, desktop: true } })).toContain("devices");
    expect(bad({ bestResult: undefined })).toContain("bestResult must be present (use null when there is no record)");
    expect(
      bad({ bestResult: { outcomes: ["success"], orderBy: [{ field: "metrics.nope", direction: "desc" }] } }),
    ).toContain("bestResult.orderBy must use declared metrics or durationSeconds");
    expect(bad({ bestResult: null })).toEqual([]);
  });
  it("only compares fields that every successful attempt reports", () => {
    const { bestResult, metrics } = manifest();
    for (const { field } of bestResult.orderBy)
      expect(field === "durationSeconds" || field.slice(8) in metrics).toBe(true);
    expect(bestResult.outcomes).toEqual(["success"]);
  });
});
