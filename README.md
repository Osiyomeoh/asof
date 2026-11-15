# AsOf — catch stale claims in AI answers

**AsOf finds the one outdated claim buried in an AI-generated answer — a changed
price, a deprecated API version, a superseded regulation — and proves it against
a live web source, before the wrong number reaches a customer.**

Large language models have a fixed training cutoff. Prices, model line-ups, library
versions and regulations keep moving after it. So an answer that was right when the
model was trained can be quietly, confidently wrong today. AsOf is a freshness layer:
paste an answer, and it tells you which claims are still true **as of today** — and
which have gone stale — with the source and date for every verdict.

Built for the **Global AI Hackathon** on both sponsor technologies:

- **[Bifrost by Maxim AI](https://github.com/maximhq/bifrost)** — a self-hosted,
  OpenAI-compatible AI gateway. Every LLM call is routed through Bifrost, so model
  routing, retries and fallback are real infrastructure, not a raw provider call.
  The UI shows the exact gateway route that served each step.
- **[Tavily](https://tavily.com)** — real-time web search. Each extracted claim is
  re-checked against the live web, returning dated sources that confirm or contradict it.

---

## How it works

Two LLM calls, one web-search fan-out, and a deterministic safety layer:

```
 paste an AI answer
        │
        ▼
 1. EXTRACT   (LLM via Bifrost)  → pull out time-sensitive, checkable claims
        │
        ▼
 2. SEARCH    (Tavily, parallel) → live dated sources per claim
        │
        ▼
 3. JUDGE     (LLM via Bifrost)  → verdict + score + cited source per claim
        │
        ▼
 4. RECONCILE (pure code)        → safe-fail guards, then aggregate
        │
        ▼
 per-claim cards + overall freshness score
```

### Guarantees (enforced in code, not just prompts)

- **Never false-green.** If there is no live evidence, or the model cites a source
  that isn't in the evidence we actually retrieved, the claim is marked
  **`unverifiable`** — never `fresh`. Being unsure is safe; being wrongly confident is not.
  (`lib/judge.ts` → `reconcile()`, unit-tested in `test/reconcile.test.ts`.)
- **Flag, don't rewrite.** AsOf never edits the answer. It flags each claim and a
  human clicks **Keep** or **Dismiss**. The person stays in the loop.
- **Every verdict is traceable.** A `fresh`/`stale` verdict always carries a source
  URL, its publish date, and a quote from it. No floating assertions.

---

## Quick start

### Option A — zero keys (sample mode)

No API keys, no Docker. Deterministic offline fixture so you can see the whole
experience immediately.

```bash
npm install
npm run dev          # open http://localhost:3000 and click "Try a sample"
```

### Option B — full live mode

Routes real LLM calls through a local Bifrost gateway and verifies against the live web.

```bash
cp .env.example .env            # add your own GEMINI_API_KEY and TAVILY_API_KEY
# .env.local holds non-secret config (gateway URL, model, encryption key)

docker compose --env-file .env --env-file .env.local up -d bifrost   # start the gateway
npm install
npm run dev                     # open http://localhost:3000 → "Check freshness"
```

Verify both sponsor APIs respond before you start:

```bash
bash scripts/spike.sh           # prints GO when Bifrost + Tavily both return real data
```

---

## Judge path (fastest way to evaluate)

1. `npm install && npm run dev`, open `http://localhost:3000`.
2. Click **Try a sample** — see 4 claims scored: 2 stale (red), 1 fresh (green),
   1 unverifiable (amber). The amber one is the safe-fail guard refusing to guess.
3. Scroll to the footer: **"Routed through Bifrost gateway"** shows the real route
   for the extract and judge steps.
4. For live proof, add keys (Option B) and run the **"Outdated model + pricing"**
   example. It flags *"Gemini 2.0 Flash is the latest model"* as **stale**, citing a
   news source dated within the last few days — newer than any LLM's training data.
5. `npm test` — the safety core (reconcile guards, aggregation, JSON parsing, sample
   e2e) is covered.

---

## Claims → how to reproduce

| Claim | Backed by | Reproduce |
|---|---|---|
| Every LLM call goes through the Bifrost gateway | `lib/llm.ts`, `docker-compose.yml` | `grep -n bifrostBaseUrl lib/llm.ts lib/config.ts` |
| Live web verification via Tavily | `lib/tavily.ts` | `grep -n tavily lib/tavily.ts` |
| Never false-green (no evidence ⇒ unverifiable) | `lib/judge.ts` | `npm test -- reconcile` |
| Score 0–100 per claim + overall verdict | `lib/aggregate.ts` | `npm test -- aggregate` |
| Defensive JSON parsing of model output | `lib/llm.ts` | `npm test -- extractJson` |
| Zero-key sample mode | `lib/sample.ts` | `npm test -- sample` |
| Flag, never rewrite (human Keep/Dismiss) | `app/page.tsx` | open `/`, run a sample, use the buttons |

```bash
npm run typecheck && npm test && npm run build   # all green
```

---

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Bifrost (Docker) · Tavily ·
Google Gemini (via Bifrost) · Vitest · GitHub Actions CI.

## License

MIT © Samuel Aleonomoh — see [LICENSE](./LICENSE).
