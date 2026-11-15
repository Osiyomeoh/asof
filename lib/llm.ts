import { config } from "./config";
import type { RouteInfo } from "./types";

/**
 * Minimal Bifrost client. Bifrost is an OpenAI-compatible gateway, so we POST
 * plain JSON to /chat/completions. We use fetch (not the OpenAI SDK) to keep the
 * request shape explicit and avoid SDK auth-header requirements the gateway does
 * not need. The gateway decides which provider/model actually serves the call and
 * reports it back in `routing_info` — we surface that as proof the gateway routed.
 */

export interface LlmResult<T> {
  data: T;
  route: RouteInfo;
}

interface ChatChoice {
  message?: { content?: string | null };
  finish_reason?: string;
}
interface ChatResponse {
  choices?: ChatChoice[];
  model?: string;
  extra_fields?: {
    raw_response?: { model?: string };
    provider?: string;
    model?: string;
    request_type?: string;
    latency?: number;
  };
  routing_info?: { provider?: string; model?: string };
}

export class LlmError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "LlmError";
  }
}

/** Strip ```json fences and pull the first balanced {...} or [...] block. */
export function extractJson(text: string): string {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const firstObj = t.indexOf("{");
  const firstArr = t.indexOf("[");
  let start = -1;
  if (firstObj === -1) start = firstArr;
  else if (firstArr === -1) start = firstObj;
  else start = Math.min(firstObj, firstArr);
  if (start === -1) return t;
  const open = t[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return t.slice(start, i + 1);
    }
  }
  return t.slice(start);
}

async function callOnce(
  model: string,
  system: string,
  user: string,
  maxTokens: number,
): Promise<{ content: string; route: Omit<RouteInfo, "step" | "attempts"> }> {
  const url = `${config.bifrostBaseUrl}/chat/completions`;
  const started = Date.now();
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0,
        max_tokens: maxTokens,
      }),
    });
  } catch (e) {
    throw new LlmError(
      `Gateway unreachable at ${url}: ${(e as Error).message}`,
    );
  }
  const latencyMs = Date.now() - started;
  const bodyText = await res.text();
  if (!res.ok) {
    throw new LlmError(
      `Gateway returned ${res.status}: ${bodyText.slice(0, 300)}`,
      res.status,
    );
  }
  let body: ChatResponse;
  try {
    body = JSON.parse(bodyText);
  } catch {
    throw new LlmError(`Gateway returned non-JSON: ${bodyText.slice(0, 200)}`);
  }
  const content = body.choices?.[0]?.message?.content ?? "";
  if (!content.trim()) {
    throw new LlmError("Gateway returned empty content");
  }
  const servedModel =
    body.routing_info?.model ||
    body.extra_fields?.model ||
    body.extra_fields?.raw_response?.model ||
    body.model ||
    model;
  const servedProvider =
    body.routing_info?.provider ||
    body.extra_fields?.provider ||
    model.split("/")[0];
  return {
    content,
    route: {
      provider: servedProvider,
      model: servedModel,
      requestedModel: model,
      latencyMs,
    },
  };
}

/**
 * Ask the gateway for JSON. Tries the primary model, then the fallback model if
 * the primary errors (congestion / retirement). Parses defensively.
 */
export async function chatJson<T>(
  step: string,
  system: string,
  user: string,
  maxTokens = 2048,
): Promise<LlmResult<T>> {
  const models = [config.primaryModel, config.fallbackModel].filter(
    (m, i, a) => m && a.indexOf(m) === i,
  );
  let lastErr: unknown;
  for (let attempt = 0; attempt < models.length; attempt++) {
    try {
      const { content, route } = await callOnce(
        models[attempt],
        system,
        user,
        maxTokens,
      );
      const json = extractJson(content);
      let data: T;
      try {
        data = JSON.parse(json) as T;
      } catch (e) {
        throw new LlmError(
          `Model did not return valid JSON: ${(e as Error).message}`,
        );
      }
      return { data, route: { step, attempts: attempt + 1, ...route } };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new LlmError("All models failed");
}
