import { aggregate } from "./aggregate";
import type { AnalysisResult, ClaimResult } from "./types";

/**
 * Sample mode: a fixed, offline analysis so the demo always works with zero keys
 * and zero network — judges can click one button and see the full experience even
 * if a free-tier provider is rate-limiting. The evidence below is illustrative
 * fixture data (clearly labelled in the UI as "Sample"), not a live lookup.
 */

export const SAMPLE_INPUT = `Here's a quick rundown:

- The latest and most capable Gemini model is Gemini 2.0 Flash, released in December 2024.
- OpenAI's gpt-4o-mini costs $0.15 per 1M input tokens.
- Node.js 20 is the current Long-Term Support (LTS) release, so target that.
- Under the EU AI Act, obligations for providers of general-purpose AI models begin to apply in August 2025.`;

const claims: ClaimResult[] = [
  {
    id: "c1",
    claimId: "c1",
    type: "api-version",
    subject: "Google Gemini (latest model)",
    assertion:
      "The latest and most capable Gemini model is Gemini 2.0 Flash, released in December 2024.",
    whyTimeSensitive:
      "Model line-ups are superseded every few months; 'latest' goes stale fast.",
    searchQuery: "latest Google Gemini model 2026",
    verdict: "stale",
    freshnessScore: 12,
    explanation:
      "Newer Gemini models have shipped since 2.0 Flash, so it is no longer the latest.",
    evidenceQuote:
      "Google's current flagship Gemini family has moved well past the 2.0 Flash generation.",
    sourceUrl: "https://blog.google/technology/ai/gemini-model-update/",
    sourceDate: "2026-09-30",
    sources: [
      {
        title: "Google ships new Gemini flagship, succeeding 2.0 Flash",
        url: "https://blog.google/technology/ai/gemini-model-update/",
        content:
          "Google announced a new flagship Gemini model, the latest step beyond the 2.0 Flash generation introduced in late 2024.",
        publishedDate: "2026-09-30",
        score: 0.94,
      },
    ],
  },
  {
    id: "c2",
    claimId: "c2",
    type: "pricing",
    subject: "OpenAI gpt-4o-mini pricing",
    assertion: "OpenAI's gpt-4o-mini costs $0.15 per 1M input tokens.",
    whyTimeSensitive: "Model prices are revised and cheaper tiers are introduced.",
    searchQuery: "gpt-4o-mini price per 1M input tokens",
    verdict: "fresh",
    freshnessScore: 86,
    explanation:
      "Current pricing pages still list gpt-4o-mini at $0.15 per 1M input tokens.",
    evidenceQuote: "gpt-4o-mini — $0.15 / 1M input tokens.",
    sourceUrl: "https://openai.com/api/pricing/",
    sourceDate: "2026-10-20",
    sources: [
      {
        title: "OpenAI API pricing",
        url: "https://openai.com/api/pricing/",
        content:
          "gpt-4o-mini is priced at $0.15 per 1M input tokens and $0.60 per 1M output tokens.",
        publishedDate: "2026-10-20",
        score: 0.9,
      },
    ],
  },
  {
    id: "c3",
    claimId: "c3",
    type: "api-version",
    subject: "Node.js LTS version",
    assertion: "Node.js 20 is the current Long-Term Support (LTS) release.",
    whyTimeSensitive: "Node promotes a new LTS line every year; the old one ages out.",
    searchQuery: "current Node.js LTS version 2026",
    verdict: "stale",
    freshnessScore: 22,
    explanation:
      "A newer Node.js line is the active LTS now; Node 20 has moved to maintenance.",
    evidenceQuote:
      "The active LTS line has advanced past Node 20, which is now in maintenance.",
    sourceUrl: "https://nodejs.org/en/about/previous-releases",
    sourceDate: "2026-10-01",
    sources: [
      {
        title: "Node.js releases — active and maintenance LTS",
        url: "https://nodejs.org/en/about/previous-releases",
        content:
          "The current active LTS line is newer than Node 20, which has entered maintenance.",
        publishedDate: "2026-10-01",
        score: 0.88,
      },
    ],
  },
  {
    id: "c4",
    claimId: "c4",
    type: "regulation",
    subject: "EU AI Act — general-purpose AI obligations",
    assertion:
      "Under the EU AI Act, obligations for providers of general-purpose AI models begin to apply in August 2025.",
    whyTimeSensitive:
      "Regulatory timelines are detailed and often misremembered or amended.",
    searchQuery: "EU AI Act general-purpose AI model obligations date",
    verdict: "unverifiable",
    freshnessScore: 50,
    explanation:
      "Retrieved sources discuss the AI Act broadly but none pin the GPAI date precisely enough to confirm.",
    sources: [
      {
        title: "EU AI Act overview",
        url: "https://digital-strategy.ec.europa.eu/en/policies/ai-act",
        content:
          "The AI Act phases in obligations over time, including rules for general-purpose AI models.",
        publishedDate: "2026-07-15",
        score: 0.7,
      },
    ],
  },
];

export function getSampleResult(input?: string): AnalysisResult {
  return {
    id: "sample",
    input: (input || "").trim() || SAMPLE_INPUT,
    mode: "sample",
    claims,
    overall: aggregate(claims),
    routes: [
      {
        step: "extract",
        provider: "gemini",
        model: "gemini-flash-lite-latest",
        requestedModel: "gemini/gemini-flash-lite-latest",
        attempts: 1,
      },
      {
        step: "judge",
        provider: "gemini",
        model: "gemini-flash-lite-latest",
        requestedModel: "gemini/gemini-flash-lite-latest",
        attempts: 1,
      },
    ],
    createdAt: new Date().toISOString(),
    notes: [
      "Sample mode — offline fixture data, shown so the demo runs with zero keys.",
    ],
  };
}
