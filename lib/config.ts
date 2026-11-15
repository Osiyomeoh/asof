/** Central runtime config. Reads env once; never throws at import time. */

export interface AsofConfig {
  bifrostBaseUrl: string;
  primaryModel: string;
  fallbackModel: string;
  tavilyApiKey: string | undefined;
  sampleOnly: boolean;
}

function readConfig(): AsofConfig {
  const bifrostBaseUrl = (
    process.env.BIFROST_BASE_URL || "http://localhost:8088/v1"
  ).replace(/\/+$/, "");
  const primaryModel =
    process.env.ASOF_MODEL || "gemini/gemini-flash-lite-latest";
  // Fallback stays within the same provider so one key covers both.
  const fallbackModel =
    process.env.ASOF_FALLBACK_MODEL || "gemini/gemini-flash-latest";
  const tavilyApiKey = process.env.TAVILY_API_KEY || undefined;
  const sampleOnly = process.env.ASOF_SAMPLE_ONLY === "1";
  return { bifrostBaseUrl, primaryModel, fallbackModel, tavilyApiKey, sampleOnly };
}

export const config = readConfig();

/** True when we have everything needed to run a real (non-sample) analysis. */
export function canRunLive(cfg: AsofConfig = config): boolean {
  return !cfg.sampleOnly && Boolean(cfg.tavilyApiKey) && Boolean(cfg.bifrostBaseUrl);
}
