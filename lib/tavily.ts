import { config } from "./config";
import type { Source } from "./types";

/**
 * Tavily real-time web search. We use topic:"news" so results carry a
 * published_date, which is the signal we need to reason about freshness.
 */

export class TavilyError extends Error {}

interface TavilyRaw {
  answer?: string;
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
    published_date?: string;
    score?: number;
  }>;
}

export interface TavilyResult {
  answer?: string;
  sources: Source[];
}

export async function tavilySearch(
  query: string,
  opts: { maxResults?: number; timeRange?: string; topic?: "news" | "general" } = {},
): Promise<TavilyResult> {
  if (!config.tavilyApiKey) {
    throw new TavilyError("TAVILY_API_KEY is not set");
  }
  const { maxResults = 5, timeRange = "year", topic = "news" } = opts;
  let res: Response;
  try {
    res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.tavilyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        topic,
        time_range: timeRange,
        max_results: maxResults,
        include_answer: true,
        search_depth: "basic",
      }),
    });
  } catch (e) {
    throw new TavilyError(`Tavily unreachable: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const t = await res.text();
    throw new TavilyError(`Tavily ${res.status}: ${t.slice(0, 200)}`);
  }
  const raw = (await res.json()) as TavilyRaw;
  const sources: Source[] = (raw.results ?? [])
    .filter((r) => r.url)
    .map((r) => ({
      title: r.title || r.url || "source",
      url: r.url as string,
      content: (r.content || "").slice(0, 600),
      publishedDate: r.published_date,
      score: r.score,
    }));
  return { answer: raw.answer, sources };
}
