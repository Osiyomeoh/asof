import { chatJson } from "./llm";
import type { Claim, ClaimType, RouteInfo } from "./types";

/**
 * LLM call #1 of 2: pull the time-sensitive, checkable claims out of an AI answer.
 * We only want claims whose truth can change over time (pricing, model/API
 * versions, regulations, company facts) — not timeless reasoning or opinions.
 */

const SYSTEM = `You extract time-sensitive factual claims from a block of text that was written by an AI assistant.

A time-sensitive claim is a specific, checkable statement whose truth can change over time, such as:
- pricing / cost / rate limits ("gpt-4o-mini costs $0.15 per 1M input tokens")
- software or API versions, model names, deprecations ("the latest model is X", "Y is the current stable version")
- laws, regulations, policy ("the EU AI Act requires ...")
- company facts that change ("X is the CEO", "the company has N employees", "Z acquired Y")

Do NOT extract:
- timeless facts, math, definitions, or general reasoning
- subjective opinions or advice
- vague statements with nothing checkable

Return STRICT JSON only, no prose, in this exact shape:
{
  "claims": [
    {
      "type": "pricing | api-version | regulation | company-fact | other",
      "subject": "the entity the claim is about",
      "assertion": "the specific checkable statement, self-contained",
      "whyTimeSensitive": "what could have changed since this was written",
      "searchQuery": "a concise web query that would confirm or refute it today"
    }
  ]
}

Extract at most 8 claims, the most load-bearing first. If there are no time-sensitive claims, return {"claims": []}.`;

const VALID_TYPES: ClaimType[] = [
  "pricing",
  "api-version",
  "regulation",
  "company-fact",
  "other",
];

interface RawExtract {
  claims?: Array<Partial<Record<keyof Claim, string>>>;
}

export interface ExtractResult {
  claims: Claim[];
  route: RouteInfo;
}

export async function extractClaims(text: string): Promise<ExtractResult> {
  const { data, route } = await chatJson<RawExtract>(
    "extract",
    SYSTEM,
    `TEXT TO ANALYZE:\n"""\n${text.slice(0, 6000)}\n"""`,
    2048,
  );
  const claims: Claim[] = (data.claims ?? [])
    .filter((c) => c && (c.assertion || "").trim())
    .slice(0, 8)
    .map((c, i) => {
      const type = (c.type as ClaimType) || "other";
      return {
        id: `c${i + 1}`,
        type: VALID_TYPES.includes(type) ? type : "other",
        subject: (c.subject || "").trim() || "unspecified",
        assertion: (c.assertion as string).trim(),
        whyTimeSensitive: (c.whyTimeSensitive || "").trim(),
        searchQuery: (c.searchQuery || c.assertion || "").trim(),
      };
    });
  return { claims, route };
}
