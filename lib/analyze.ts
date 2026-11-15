import { canRunLive, config } from "./config";
import { aggregate } from "./aggregate";
import { extractClaims } from "./extract";
import { judgeClaims } from "./judge";
import { tavilySearch } from "./tavily";
import { getSampleResult } from "./sample";
import type {
  AnalysisResult,
  ClaimResult,
  Evidence,
  RouteInfo,
} from "./types";

export { aggregate };

function id(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface AnalyzeOptions {
  /** Force sample mode even if keys are present (used by the "Sample" button). */
  forceSample?: boolean;
}

export async function analyze(
  input: string,
  opts: AnalyzeOptions = {},
): Promise<AnalysisResult> {
  const text = (input || "").trim();

  // Sample mode wins first so the "Try a sample" button always works, even with
  // an empty box. Deterministic, no network — keeps the demo bulletproof.
  if (opts.forceSample || !canRunLive()) {
    return getSampleResult(text);
  }

  if (!text) {
    return {
      id: id(),
      input: "",
      mode: "live",
      claims: [],
      overall: aggregate([]),
      routes: [],
      createdAt: new Date().toISOString(),
      notes: ["Empty input."],
    };
  }

  const notes: string[] = [];
  const routes: RouteInfo[] = [];

  // Step 1 — extract claims (LLM call 1).
  const { claims, route: extractRoute } = await extractClaims(text);
  routes.push(extractRoute);
  if (claims.length === 0) {
    return {
      id: id(),
      input: text,
      mode: "live",
      claims: [],
      overall: aggregate([]),
      routes,
      createdAt: new Date().toISOString(),
      notes: ["No time-sensitive claims were found in this text."],
    };
  }

  // Step 2 — gather live evidence per claim (parallel web search).
  const evidence = new Map<string, Evidence>();
  await Promise.all(
    claims.map(async (c) => {
      try {
        const { sources, answer } = await tavilySearch(c.searchQuery, {
          maxResults: 5,
        });
        evidence.set(c.id, { claimId: c.id, sources, tavilyAnswer: answer });
      } catch (e) {
        notes.push(`Search failed for ${c.id}: ${(e as Error).message}`);
        evidence.set(c.id, { claimId: c.id, sources: [] });
      }
    }),
  );

  // Step 3 — judge all claims against evidence (LLM call 2), then safe-fail guards.
  const { verdicts, route: judgeRoute } = await judgeClaims(claims, evidence);
  if (judgeRoute.attempts > 0) routes.push(judgeRoute);

  const results: ClaimResult[] = claims.map((c) => {
    const v =
      verdicts.find((x) => x.claimId === c.id) ?? {
        claimId: c.id,
        verdict: "unverifiable" as const,
        freshnessScore: 50,
        explanation: "No verdict produced.",
      };
    return { ...c, ...v, sources: evidence.get(c.id)?.sources ?? [] };
  });

  return {
    id: id(),
    input: text,
    mode: "live",
    claims: results,
    overall: aggregate(results),
    routes,
    createdAt: new Date().toISOString(),
    notes: notes.length ? notes : undefined,
  };
}

export { config };
