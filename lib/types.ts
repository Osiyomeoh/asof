export type ClaimType =
  | "pricing"
  | "api-version"
  | "regulation"
  | "company-fact"
  | "other";

export type Verdict = "fresh" | "stale" | "unverifiable";

/** A time-sensitive claim extracted from an AI answer. */
export interface Claim {
  id: string;
  type: ClaimType;
  /** The specific, checkable assertion, e.g. "gpt-4o-mini costs $0.15 / 1M input tokens". */
  assertion: string;
  /** The subject the claim is about, e.g. "OpenAI gpt-4o-mini". */
  subject: string;
  /** Why this is time-sensitive (what could have changed). */
  whyTimeSensitive: string;
  /** A web query that would confirm or refute the assertion. */
  searchQuery: string;
}

/** One web source returned by Tavily. */
export interface Source {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
  score?: number;
}

/** Evidence gathered for one claim. */
export interface Evidence {
  claimId: string;
  sources: Source[];
  tavilyAnswer?: string;
}

/** The judged result for one claim. */
export interface ClaimVerdict {
  claimId: string;
  verdict: Verdict;
  /** 0 = certainly outdated, 100 = certainly current. */
  freshnessScore: number;
  explanation: string;
  evidenceQuote?: string;
  sourceUrl?: string;
  sourceDate?: string;
}

/** Everything the UI needs about one claim. */
export interface ClaimResult extends Claim, ClaimVerdict {
  sources: Source[];
}

/** Which gateway route actually served a model call (proof the gateway decided). */
export interface RouteInfo {
  step: string;
  provider: string;
  model: string;
  requestedModel: string;
  latencyMs?: number;
  attempts: number;
}

export interface AnalysisOverall {
  score: number; // 0-100 overall freshness
  total: number;
  fresh: number;
  stale: number;
  unverifiable: number;
  verdict: "FRESH" | "NEEDS REVIEW" | "STALE";
  headline: string;
}

export interface AnalysisResult {
  id: string;
  input: string;
  mode: "live" | "sample";
  claims: ClaimResult[];
  overall: AnalysisOverall;
  routes: RouteInfo[];
  createdAt: string;
  notes?: string[];
}
