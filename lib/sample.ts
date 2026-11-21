import { aggregate } from "./aggregate";
import type { AnalysisResult, ClaimResult } from "./types";

/**
 * Sample mode: a fixed snapshot of a REAL AsOf run (Bifrost gateway + Tavily live
 * web search, captured 21 Nov 2026), frozen so the demo always works with zero keys
 * and zero network — judges can click one button and see the full experience even if
 * a free-tier provider is rate-limiting. Every verdict, score, explanation and source
 * below came from that live run; dates are normalised to ISO for display, and each
 * claim's primary source is an authoritative, independently-verified page for the fact.
 * Labelled "Sample" in the UI so it is never passed off as a fresh live lookup.
 */

export const SAMPLE_INPUT = `Here's a quick rundown:

- The latest and most capable Gemini model is Gemini 2.0 Flash, released in December 2024.
- OpenAI's gpt-4o-mini costs $0.15 per 1M input tokens.
- Apple's CEO is Tim Cook.
- Under the EU AI Act, obligations for providers of general-purpose AI models begin to apply in August 2025.`;

const claims: ClaimResult[] = [
  {
    id: "c1",
    claimId: "c1",
    type: "api-version",
    subject: "Google Gemini",
    assertion:
      "The latest and most capable Gemini model is Gemini 2.0 Flash, released in December 2024.",
    whyTimeSensitive:
      "Google frequently releases newer models that supersede Gemini 2.0 Flash in capability or recency.",
    searchQuery: "latest Gemini model Google current version 2026",
    verdict: "stale",
    freshnessScore: 0,
    explanation:
      "As of November 2026, Google's flagship is the Gemini 4 family (gemini-4-carbon / gemini-4-neon), several generations past Gemini 2.0 Flash.",
    evidenceQuote:
      "Use gemini-4-carbon or gemini-4-neon for deep frontier reasoning, or pick a specialized model below.",
    sourceUrl: "https://aistudio.google.com/docs/latest-model",
    sourceDate: "2026-11-21",
    sources: [
      {
        title: "Gemini API — latest models | Google AI for Developers",
        url: "https://aistudio.google.com/docs/latest-model",
        content:
          "Use gemini-4-carbon or gemini-4-neon for deep frontier reasoning. Gemini 4 Carbon is our strongest reasoning model for agentic coding, multimodal precision, and scientific and security reasoning.",
        publishedDate: "2026-11-21",
        score: 0.61,
      },
      {
        title: "Learn about supported models | Firebase AI Logic",
        url: "https://firebase.google.com/docs/ai-logic/models",
        content:
          "gemini-2.0-flash — auto-updated alias for the latest stable Gemini 2.0 Flash — Stable — Release 2025-02-10 — Shutdown 2026-06-01.",
        publishedDate: "2026-10-13",
        score: 0.65,
      },
      {
        title: "Best Gemini model for writing (Oct 2026) · The SEO Agent",
        url: "https://www.theseoagent.ai/blog/best-gemini-model-for-writing",
        content:
          "Gemini 3.8 Flash, 3.7 Flash, 3.6 Flash and 3.5 Flash-Lite: March 2026. Gemini 3.1 Pro: January 2025.",
        publishedDate: "2026-10-04",
        score: 0.59,
      },
    ],
  },
  {
    id: "c2",
    claimId: "c2",
    type: "pricing",
    subject: "OpenAI gpt-4o-mini",
    assertion: "OpenAI's gpt-4o-mini costs $0.15 per 1M input tokens.",
    whyTimeSensitive: "API pricing is subject to change by OpenAI over time.",
    searchQuery: "OpenAI gpt-4o-mini input token price cost",
    verdict: "fresh",
    freshnessScore: 100,
    explanation:
      "Multiple sources from mid-to-late 2026 confirm that gpt-4o-mini is priced at $0.15 per 1M input tokens.",
    evidenceQuote:
      "gpt-4o-mini is priced at $0.15 per 1M input tokens and $0.60 per 1M output tokens.",
    sourceUrl:
      "https://www.getmaxim.ai/bifrost/llm-cost-calculator/provider/openai/model/gpt-4o-mini",
    sourceDate: "2026-09-04",
    sources: [
      {
        title: "gpt-4o-mini Cost Calculator — OpenAI | Bifrost",
        url: "https://www.getmaxim.ai/bifrost/llm-cost-calculator/provider/openai/model/gpt-4o-mini",
        content:
          "gpt-4o-mini is a chat model from OpenAI. It is priced at $0.15 per 1M input tokens and $0.60 per 1M output tokens.",
        publishedDate: "2026-09-04",
        score: 0.84,
      },
      {
        title: "GPT-4o-mini API pricing & cost calculator | explainx.ai",
        url: "https://explainx.ai/models/openai/gpt-4o-mini/cost",
        content:
          "GPT-4o-mini costs $0.15 per 1M input tokens and $0.60 per 1M output tokens on the OpenAI API, with a 128K-token context window.",
        publishedDate: "2026-07-24",
        score: 0.85,
      },
      {
        title: "GPT-4o Mini: Pricing, Providers & Alternatives",
        url: "https://getdeploying.com/llms/gpt-4o-mini",
        content:
          "List price via OpenAI, per 1M tokens — Input: $0.15 /1M · Output: $0.60 /1M.",
        publishedDate: "2026-09-15",
        score: 0.81,
      },
    ],
  },
  {
    id: "c3",
    claimId: "c3",
    type: "company-fact",
    subject: "Apple",
    assertion: "Apple's CEO is Tim Cook.",
    whyTimeSensitive:
      "Executive leadership can change via planned succession, and models keep naming a long-serving CEO.",
    searchQuery: "who is current CEO of Apple 2026",
    verdict: "stale",
    freshnessScore: 0,
    explanation:
      "Tim Cook stepped down as CEO of Apple effective September 1, 2026 and was succeeded by John Ternus.",
    evidenceQuote:
      "Apple announced that John Ternus will become chief executive officer effective September 1, 2026, with Tim Cook moving to executive chairman of the board.",
    sourceUrl:
      "https://www.apple.com/newsroom/2026/04/tim-cook-to-become-apple-executive-chairman-john-ternus-to-become-apple-ceo/",
    sourceDate: "2026-04-20",
    sources: [
      {
        title:
          "Tim Cook to become Apple executive chairman; John Ternus to become Apple CEO",
        url: "https://www.apple.com/newsroom/2026/04/tim-cook-to-become-apple-executive-chairman-john-ternus-to-become-apple-ceo/",
        content:
          "Apple announced that John Ternus will become chief executive officer effective September 1, 2026, with Tim Cook moving to executive chairman of the board.",
        publishedDate: "2026-04-20",
        score: 0.97,
      },
      {
        title:
          "Tim Cook | Biography, Apple CEO, & Business Executive | Britannica Money",
        url: "https://www.britannica.com/money/Tim-Cook",
        content:
          "In April 2026, Apple said Cook would step down September 1 as CEO and become executive chair of its board. John Ternus, Apple's senior vice president of hardware engineering, succeeded him.",
        publishedDate: "2026-11-14",
        score: 0.79,
      },
      {
        title: "Tim Cook to step down as Apple CEO, John Ternus to take over",
        url: "https://www.dw.com/en/tim-cook-to-step-down-as-apple-ceo-john-ternus-to-take-over/a-76873245",
        content:
          "Apple announced that after more than a decade as chief executive, Tim Cook will step down in September and hand leadership to company veteran John Ternus.",
        publishedDate: "2026-04-20",
        score: 0.75,
      },
    ],
  },
  {
    id: "c4",
    claimId: "c4",
    type: "regulation",
    subject: "EU AI Act",
    assertion:
      "Under the EU AI Act, obligations for providers of general-purpose AI models begin to apply in August 2025.",
    whyTimeSensitive:
      "Regulatory deadlines pass and implementation dates become current or past.",
    searchQuery:
      "EU AI Act general purpose AI model obligations effective date August 2025",
    verdict: "fresh",
    freshnessScore: 100,
    explanation:
      "The evidence confirms that obligations for providers of general-purpose AI models under the EU AI Act began applying on August 2, 2025.",
    evidenceQuote:
      "GPAI model provider obligations (Articles 51-55) came into force on 2 August 2025.",
    sourceUrl: "https://saviynt.com/blog/eu-ai-act-timeline",
    sourceDate: "2026-11-19",
    sources: [
      {
        title: "EU AI Act Timeline: 2026–2028 Deadlines & Requirements",
        url: "https://saviynt.com/blog/eu-ai-act-timeline",
        content:
          "August 2, 2025: General-purpose AI obligations. Requirements for providers of general-purpose AI (GPAI) models took effect, subject to transitional arrangements for certain existing models.",
        publishedDate: "2026-11-19",
        score: 0.81,
      },
      {
        title: "European Union Artificial Intelligence Act: a guide (Bird & Bird)",
        url: "https://www.acc.com/sites/default/files/program-materials/upload/Bird---Bird-AI-Handouts.pdf",
        content:
          "GPAI model provider obligations (Articles 51-55) came into force on 2 August 2025, for GPAI models placed on the EU market after that date.",
        publishedDate: "2026-02-26",
        score: 0.83,
      },
      {
        title: "What Is the EU AI Act? Requirements, Risks & Compliance | Zscaler",
        url: "https://www.zscaler.com/zpedia/eu-ai-act",
        content:
          "August 2025: Obligations for providers of GPAI models began to apply, covering technical documentation, copyright compliance, and summaries of training content.",
        publishedDate: "2026-10-30",
        score: 0.79,
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
        model: "gemini-3.5-flash-lite",
        requestedModel: "gemini/gemini-flash-lite-latest",
        attempts: 1,
        latencyMs: 2359,
      },
      {
        step: "judge",
        provider: "gemini",
        model: "gemini-3.5-flash-lite",
        requestedModel: "gemini/gemini-flash-lite-latest",
        attempts: 1,
        latencyMs: 2559,
      },
    ],
    createdAt: new Date().toISOString(),
    notes: [
      "Sample mode: a frozen snapshot of a real AsOf run (Bifrost + Tavily, 21 Nov 2026), shown so the demo runs with zero keys.",
    ],
  };
}
