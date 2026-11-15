import { chatJson } from "./llm";
import type {
  Claim,
  ClaimVerdict,
  Evidence,
  RouteInfo,
  Verdict,
} from "./types";

/**
 * LLM call #2 of 2: judge every claim against its live evidence in ONE batched
 * call (cheaper + faster on a flaky free tier). The model proposes a verdict and
 * score and must cite a source URL from the evidence we provided. After the model
 * answers, deterministic guards reconcile the result so we NEVER show a false
 * green: no evidence -> unverifiable; a "fresh" with no cited source -> downgraded;
 * a "stale" with no contradicting source -> downgraded. The product's promise is
 * "flag, don't trust": being unsure is safe, being wrongly confident is not.
 */

const SYSTEM = `You are a freshness fact-checker. For each claim you are given live web evidence (titles, URLs, snippets, and publish dates) retrieved today. Decide whether the claim is still accurate RIGHT NOW.

For each claim return one of:
- "fresh": the evidence confirms the claim is still accurate today.
- "stale": the evidence shows the claim is now outdated or contradicted (e.g. price changed, version superseded, fact no longer true).
- "unverifiable": the evidence is insufficient or irrelevant to decide.

Rules:
- Base your decision ONLY on the provided evidence. Do not use prior knowledge of specific prices or versions.
- You MUST cite the sourceUrl you relied on, copied exactly from the evidence. If you cannot cite one, the verdict is "unverifiable".
- Prefer the most recently dated evidence.
- freshnessScore: 0 = certainly outdated, 100 = certainly current.

Return STRICT JSON only:
{
  "verdicts": [
    {
      "claimId": "c1",
      "verdict": "fresh | stale | unverifiable",
      "freshnessScore": 0-100,
      "explanation": "one sentence grounded in the evidence",
      "evidenceQuote": "short quote from the source that decides it",
      "sourceUrl": "exact url from the evidence, or empty string"
    }
  ]
}`;

const VALID: Verdict[] = ["fresh", "stale", "unverifiable"];

interface RawJudge {
  verdicts?: Array<{
    claimId?: string;
    verdict?: string;
    freshnessScore?: number;
    explanation?: string;
    evidenceQuote?: string;
    sourceUrl?: string;
  }>;
}

export interface JudgeResult {
  verdicts: ClaimVerdict[];
  route: RouteInfo;
}

function clamp(n: unknown, lo: number, hi: number, dflt: number): number {
  const v = typeof n === "number" && isFinite(n) ? n : dflt;
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

function buildPrompt(claims: Claim[], evidence: Map<string, Evidence>): string {
  const blocks = claims.map((c) => {
    const ev = evidence.get(c.id);
    const sources = ev?.sources ?? [];
    const srcText = sources.length
      ? sources
          .map(
            (s, i) =>
              `  [${i + 1}] url: ${s.url}\n      date: ${
                s.publishedDate || "unknown"
              }\n      title: ${s.title}\n      snippet: ${s.content}`,
          )
          .join("\n")
      : "  (no sources found)";
    return `CLAIM ${c.id} [${c.type}]: ${c.assertion}
  subject: ${c.subject}
  evidence:
${srcText}`;
  });
  return `Today's date is ${new Date().toISOString().slice(0, 10)}.\n\n${blocks.join(
    "\n\n",
  )}`;
}

/**
 * Deterministic reconciliation. This is the safety core: it runs regardless of
 * what the model said and is unit-tested independently of any live call.
 */
export function reconcile(
  claim: Claim,
  evidence: Evidence | undefined,
  proposed: {
    verdict?: string;
    freshnessScore?: number;
    explanation?: string;
    evidenceQuote?: string;
    sourceUrl?: string;
  } | undefined,
): ClaimVerdict {
  const sources = evidence?.sources ?? [];
  const base: ClaimVerdict = {
    claimId: claim.id,
    verdict: "unverifiable",
    freshnessScore: 50,
    explanation: "",
    evidenceQuote: proposed?.evidenceQuote?.trim() || undefined,
    sourceUrl: undefined,
    sourceDate: undefined,
  };

  // Guard 1: no evidence at all -> always unverifiable, never a green.
  if (sources.length === 0) {
    return {
      ...base,
      verdict: "unverifiable",
      freshnessScore: 50,
      explanation: "No live sources were found, so this claim cannot be verified.",
    };
  }

  const rawVerdict = (proposed?.verdict || "").toLowerCase() as Verdict;
  const verdict: Verdict = VALID.includes(rawVerdict) ? rawVerdict : "unverifiable";
  const score = clamp(
    proposed?.freshnessScore,
    0,
    100,
    verdict === "fresh" ? 80 : verdict === "stale" ? 20 : 50,
  );

  // The model must cite a URL that actually appears in the evidence we gave it.
  const citedUrl = (proposed?.sourceUrl || "").trim();
  const matched = sources.find((s) => s.url === citedUrl) ||
    sources.find((s) => citedUrl && s.url.includes(citedUrl));

  const explanation =
    (proposed?.explanation || "").trim() || "Judged against live evidence.";

  // Guard 2: a positive/negative verdict with no valid citation can't be trusted.
  if ((verdict === "fresh" || verdict === "stale") && !matched) {
    return {
      ...base,
      verdict: "unverifiable",
      freshnessScore: 50,
      explanation:
        "The model did not cite a verifiable source for this verdict, so it is treated as unverifiable.",
    };
  }

  // Guard 3: keep score consistent with the verdict band.
  let finalScore = score;
  if (verdict === "fresh") finalScore = Math.max(score, 60);
  if (verdict === "stale") finalScore = Math.min(score, 40);

  return {
    claimId: claim.id,
    verdict,
    freshnessScore: finalScore,
    explanation,
    evidenceQuote: base.evidenceQuote,
    sourceUrl: matched?.url,
    sourceDate: matched?.publishedDate,
  };
}

export async function judgeClaims(
  claims: Claim[],
  evidence: Map<string, Evidence>,
): Promise<JudgeResult> {
  if (claims.length === 0) {
    return {
      verdicts: [],
      route: {
        step: "judge",
        provider: "none",
        model: "none",
        requestedModel: "none",
        attempts: 0,
      },
    };
  }
  const { data, route } = await chatJson<RawJudge>(
    "judge",
    SYSTEM,
    buildPrompt(claims, evidence),
    3000,
  );
  const byId = new Map(
    (data.verdicts ?? []).map((v) => [v.claimId || "", v]),
  );
  const verdicts = claims.map((c) =>
    reconcile(c, evidence.get(c.id), byId.get(c.id)),
  );
  return { verdicts, route };
}
