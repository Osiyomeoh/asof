import { describe, it, expect } from "vitest";
import { reconcile } from "@/lib/judge";
import type { Claim, Evidence } from "@/lib/types";

const claim: Claim = {
  id: "c1",
  type: "pricing",
  subject: "gpt-4o-mini",
  assertion: "gpt-4o-mini costs $0.15 per 1M input tokens",
  whyTimeSensitive: "prices change",
  searchQuery: "gpt-4o-mini price",
};

const evidence: Evidence = {
  claimId: "c1",
  sources: [
    {
      title: "OpenAI pricing",
      url: "https://openai.com/api/pricing/",
      content: "gpt-4o-mini $0.15 / 1M input",
      publishedDate: "2026-10-20",
    },
  ],
};

describe("reconcile — safe-fail guards", () => {
  it("returns unverifiable when there is no evidence, even if model says fresh", () => {
    const out = reconcile(claim, { claimId: "c1", sources: [] }, {
      verdict: "fresh",
      freshnessScore: 99,
      sourceUrl: "https://openai.com/api/pricing/",
    });
    expect(out.verdict).toBe("unverifiable");
    expect(out.sourceUrl).toBeUndefined();
  });

  it("downgrades a 'fresh' verdict that cites no real source to unverifiable", () => {
    const out = reconcile(claim, evidence, {
      verdict: "fresh",
      freshnessScore: 95,
      sourceUrl: "", // no citation
    });
    expect(out.verdict).toBe("unverifiable");
  });

  it("downgrades a 'fresh' verdict whose cited URL is not in the evidence", () => {
    const out = reconcile(claim, evidence, {
      verdict: "fresh",
      freshnessScore: 95,
      sourceUrl: "https://totally-made-up.example/nope",
    });
    expect(out.verdict).toBe("unverifiable");
  });

  it("keeps a 'fresh' verdict that cites a real evidence URL and carries its date", () => {
    const out = reconcile(claim, evidence, {
      verdict: "fresh",
      freshnessScore: 90,
      explanation: "still $0.15",
      sourceUrl: "https://openai.com/api/pricing/",
    });
    expect(out.verdict).toBe("fresh");
    expect(out.sourceUrl).toBe("https://openai.com/api/pricing/");
    expect(out.sourceDate).toBe("2026-10-20");
    expect(out.freshnessScore).toBeGreaterThanOrEqual(60);
  });

  it("keeps a 'stale' verdict with a real citation and clamps score into the stale band", () => {
    const out = reconcile(claim, evidence, {
      verdict: "stale",
      freshnessScore: 88, // model contradicts itself; must be clamped down
      sourceUrl: "https://openai.com/api/pricing/",
    });
    expect(out.verdict).toBe("stale");
    expect(out.freshnessScore).toBeLessThanOrEqual(40);
  });

  it("clamps scores into 0..100 and defaults an unknown verdict to unverifiable", () => {
    const out = reconcile(claim, evidence, {
      verdict: "banana" as never,
      freshnessScore: 9999,
      sourceUrl: "https://openai.com/api/pricing/",
    });
    expect(out.verdict).toBe("unverifiable");
    expect(out.freshnessScore).toBeGreaterThanOrEqual(0);
    expect(out.freshnessScore).toBeLessThanOrEqual(100);
  });
});
