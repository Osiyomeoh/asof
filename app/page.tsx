"use client";

import { useEffect, useState } from "react";
import type { AnalysisResult, ClaimResult } from "@/lib/types";

const EXAMPLES: { label: string; text: string }[] = [
  {
    label: "Outdated model + pricing",
    text: "The latest and most capable Gemini model is Gemini 2.0 Flash, released in December 2024. OpenAI's gpt-4o-mini costs $0.15 per 1M input tokens. Node.js 20 is the current LTS release, so target that.",
  },
  {
    label: "Framework versions",
    text: "Use Next.js 14 with the app router — it's the current stable major. React 18 is the latest release. For styling, Tailwind CSS v3 is the version to install.",
  },
  {
    label: "Company facts",
    text: "As of now, the CEO of OpenAI is Sam Altman, and Twitter is still called Twitter. GitHub Copilot's individual plan costs $10 per month.",
  },
];

function pct(n: number) {
  return `${Math.round(n)}`;
}

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<null | "live" | "sample">(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<boolean | null>(null);
  const [today, setToday] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [decisions, setDecisions] = useState<Record<string, "kept" | "dismissed">>({});

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "light" ? "light" : "dark");
    fetch("/api/analyze")
      .then((r) => r.json())
      .then((d) => setLive(Boolean(d.live)))
      .catch(() => setLive(false));
    setToday(
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    );
  }, []);

  async function run(sample: boolean) {
    setError(null);
    setResult(null);
    setDecisions({});
    setLoading(sample ? "sample" : "live");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sample }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setResult(data as AnalysisResult);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("asof-theme", next);
      } catch {
        /* storage blocked (private mode) — theme still applies for this session */
      }
      return next;
    });
  }

  return (
    <main className="container">
      <header className="hero">
        <div className="eyebrow">
          <span className="d" />
          Freshness layer for AI answers
        </div>
        <div className="hero-top">
          <h1>AsOf</h1>
          {live !== null && (
            <span className={`badge ${live ? "live" : "sample"}`}>
              <span className="dot" />
              {live ? "Live mode ready" : "Sample mode"}
            </span>
          )}
          {theme !== null && (
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            >
              {theme === "light" ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              )}
            </button>
          )}
        </div>
        <p className="tag">
          Paste an AI-generated answer. AsOf finds the <strong>time-sensitive
          claims</strong> — prices, model and API versions, regulations, company
          facts — and checks each against the live web, so you catch what&apos;s
          gone stale <strong>as of today</strong>.
        </p>
        {today && (
          <div className="asof">
            Verifying against the web as of <b>{today}</b>
          </div>
        )}
      </header>

      <div className="panel">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste an AI answer here — e.g. a ChatGPT reply about pricing, model names, or library versions…"
        />
        <div className="row" style={{ marginTop: 12 }}>
          <button
            className="btn primary"
            onClick={() => run(false)}
            disabled={loading !== null || text.trim().length < 12}
          >
            {loading === "live" ? <span className="spin" /> : "Check freshness"}
          </button>
          <button
            className="btn"
            onClick={() => run(true)}
            disabled={loading !== null}
          >
            {loading === "sample" ? <span className="spin" /> : "Try a sample"}
          </button>
          {!live && (
            <span className="note" style={{ marginTop: 0 }}>
              No API keys detected — results use the offline sample.
            </span>
          )}
        </div>
        <p className="try-label">Try one:</p>
        <div className="chips">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              className="chip"
              onClick={() => setText(ex.text)}
              disabled={loading !== null}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="err">⚠ {error}</div>}

      {result && (
        <Results
          result={result}
          decisions={decisions}
          onDecide={(id, d) =>
            setDecisions((prev) => ({
              ...prev,
              [id]: prev[id] === d ? undefined! : d,
            }))
          }
        />
      )}

      <footer className="routes" style={{ marginTop: 40, opacity: 0.7 }}>
        <span>
          AsOf · claims are flagged, never rewritten · you decide what to keep.
        </span>
      </footer>
    </main>
  );
}

function FreshnessDial({ score, verdict }: { score: number; verdict: string }) {
  const color =
    verdict === "FRESH"
      ? "var(--fresh)"
      : verdict === "STALE"
        ? "var(--stale)"
        : "var(--unverified)";
  const r = 42;
  const circ = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(score * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const offset = circ * (1 - Math.max(0, Math.min(100, shown)) / 100);
  return (
    <div className="dial">
      <svg viewBox="0 0 100 100" width="104" height="104">
        <circle className="dial-track" cx="50" cy="50" r={r} />
        <circle
          className="dial-arc"
          cx="50"
          cy="50"
          r={r}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ stroke: color, color }}
        />
      </svg>
      <div className="dial-num" style={{ color }}>
        <strong>{Math.round(shown)}</strong>
        <span>/ 100 fresh</span>
      </div>
    </div>
  );
}

function Results({
  result,
  decisions,
  onDecide,
}: {
  result: AnalysisResult;
  decisions: Record<string, "kept" | "dismissed">;
  onDecide: (id: string, d: "kept" | "dismissed") => void;
}) {
  const o = result.overall;
  const cls = o.verdict === "NEEDS REVIEW" ? "NEEDS" : o.verdict;
  return (
    <section>
      <div className={`overall ${cls}`}>
        <FreshnessDial score={o.score} verdict={o.verdict} />
        <div>
          <div className="v">{o.verdict}</div>
          <div className="h">{o.headline}</div>
        </div>
        <div className="counts">
          <span style={{ color: "var(--fresh)" }}>
            <b>{o.fresh}</b> fresh
          </span>
          <span style={{ color: "var(--stale)" }}>
            <b>{o.stale}</b> stale
          </span>
          <span style={{ color: "var(--unverified)" }}>
            <b>{o.unverifiable}</b> review
          </span>
        </div>
      </div>

      {result.claims.length === 0 && (
        <div className="panel note" style={{ marginTop: 10 }}>
          No time-sensitive claims were found in this text — nothing to go stale.
        </div>
      )}

      {result.claims.map((c, i) => (
        <ClaimCard
          key={c.id}
          claim={c}
          index={i}
          decision={decisions[c.id]}
          onDecide={onDecide}
        />
      ))}

      {result.routes.length > 0 && (
        <div className="routes">
          <span>Routed through Bifrost gateway:</span>
          {result.routes.map((r) => (
            <span className="gw" key={r.step}>
              {r.step} → {r.provider}/{r.model}
              {r.attempts > 1 ? ` (retry ${r.attempts})` : ""}
            </span>
          ))}
        </div>
      )}

      {result.notes?.map((n, i) => (
        <div className="note" key={i}>
          {n}
        </div>
      ))}
    </section>
  );
}

function ClaimCard({
  claim,
  index,
  decision,
  onDecide,
}: {
  claim: ClaimResult;
  index: number;
  decision?: "kept" | "dismissed";
  onDecide: (id: string, d: "kept" | "dismissed") => void;
}) {
  return (
    <article
      className={`claim ${claim.verdict} ${
        decision === "dismissed" ? "dismissed" : ""
      }`}
      style={{ animationDelay: `${index * 80 + 80}ms` }}
    >
      <div className="top">
        <span className={`pill ${claim.verdict}`}>{claim.verdict}</span>
        <span className="type">{claim.type}</span>
        <span className="freshscore">freshness {pct(claim.freshnessScore)}/100</span>
      </div>
      <p className={`assertion ${decision === "dismissed" ? "struck" : ""}`}>
        {claim.assertion}
      </p>
      {claim.whyTimeSensitive && (
        <p className="why">Why it can go stale: {claim.whyTimeSensitive}</p>
      )}
      <p className="explain">{claim.explanation}</p>

      {(claim.evidenceQuote || claim.sourceUrl) && (
        <div className="evidence">
          {claim.evidenceQuote && <div className="q">“{claim.evidenceQuote}”</div>}
          {claim.sourceUrl && (
            <div className="src">
              <a href={claim.sourceUrl} target="_blank" rel="noreferrer">
                {hostOf(claim.sourceUrl)}
              </a>
              {claim.sourceDate && <span className="date">· {claim.sourceDate}</span>}
            </div>
          )}
        </div>
      )}

      <div className="actions">
        <button
          className={`btn small ${decision === "kept" ? "primary" : ""}`}
          onClick={() => onDecide(claim.id, "kept")}
        >
          {decision === "kept" ? "✓ Kept" : "Keep"}
        </button>
        <button
          className="btn small"
          onClick={() => onDecide(claim.id, "dismissed")}
        >
          {decision === "dismissed" ? "Dismissed" : "Dismiss"}
        </button>
      </div>
    </article>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
