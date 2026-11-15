import { describe, it, expect } from "vitest";
import { aggregate } from "@/lib/aggregate";
import type { ClaimVerdict } from "@/lib/types";

const v = (verdict: ClaimVerdict["verdict"], s: number): ClaimVerdict => ({
  claimId: "x",
  verdict,
  freshnessScore: s,
  explanation: "",
});

describe("aggregate", () => {
  it("is FRESH only when every claim is fresh", () => {
    const o = aggregate([v("fresh", 90), v("fresh", 80)]);
    expect(o.verdict).toBe("FRESH");
    expect(o.fresh).toBe(2);
    expect(o.score).toBe(85);
  });

  it("is STALE if any claim is stale, regardless of others", () => {
    const o = aggregate([v("fresh", 90), v("stale", 10), v("unverifiable", 50)]);
    expect(o.verdict).toBe("STALE");
    expect(o.stale).toBe(1);
  });

  it("is NEEDS REVIEW when there are unverifiable but no stale claims", () => {
    const o = aggregate([v("fresh", 90), v("unverifiable", 50)]);
    expect(o.verdict).toBe("NEEDS REVIEW");
  });

  it("handles the empty case as a clean 100 with no claims", () => {
    const o = aggregate([]);
    expect(o.total).toBe(0);
    expect(o.score).toBe(100);
    expect(o.verdict).toBe("FRESH");
  });
});
