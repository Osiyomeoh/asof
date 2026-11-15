import type { AnalysisOverall, ClaimVerdict } from "./types";

/** Pure aggregation of per-claim verdicts into an overall freshness summary. */
export function aggregate(verdicts: ClaimVerdict[]): AnalysisOverall {
  const total = verdicts.length;
  const fresh = verdicts.filter((v) => v.verdict === "fresh").length;
  const stale = verdicts.filter((v) => v.verdict === "stale").length;
  const unverifiable = verdicts.filter(
    (v) => v.verdict === "unverifiable",
  ).length;
  const score = total
    ? Math.round(verdicts.reduce((a, v) => a + v.freshnessScore, 0) / total)
    : 100;
  const verdict: AnalysisOverall["verdict"] =
    stale > 0 ? "STALE" : unverifiable > 0 ? "NEEDS REVIEW" : "FRESH";
  let headline: string;
  if (total === 0) headline = "No time-sensitive claims found.";
  else if (stale > 0) headline = `${stale} of ${total} claims look outdated.`;
  else if (unverifiable > 0)
    headline = `${total - unverifiable} of ${total} claims verified; ${unverifiable} need review.`;
  else headline = `All ${total} claims still look current.`;
  return { score, total, fresh, stale, unverifiable, verdict, headline };
}
