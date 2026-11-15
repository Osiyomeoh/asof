import { describe, it, expect } from "vitest";
import { analyze } from "@/lib/analyze";
import { getSampleResult, SAMPLE_INPUT } from "@/lib/sample";

describe("sample mode (offline, zero keys)", () => {
  it("analyze(forceSample) returns a deterministic STALE result with claims", async () => {
    const r = await analyze("anything", { forceSample: true });
    expect(r.mode).toBe("sample");
    expect(r.claims.length).toBeGreaterThan(0);
    expect(r.overall.verdict).toBe("STALE");
    expect(r.overall.stale).toBeGreaterThan(0);
  });

  it("every stale/fresh claim in the fixture carries a real source URL (no false green without evidence)", () => {
    const r = getSampleResult(SAMPLE_INPUT);
    for (const c of r.claims) {
      if (c.verdict === "stale" || c.verdict === "fresh") {
        expect(c.sourceUrl, `${c.id} must cite a source`).toBeTruthy();
        expect(c.sources.length).toBeGreaterThan(0);
      }
    }
  });

  it("surfaces the gateway routes it would use (gateway proof)", () => {
    const r = getSampleResult();
    expect(r.routes.length).toBeGreaterThan(0);
    expect(r.routes.every((x) => x.provider === "gemini")).toBe(true);
  });
});
