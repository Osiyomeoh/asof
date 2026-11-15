#!/usr/bin/env bash
# Spike: prove Bifrost (gateway) and Tavily (live web) both work with a real call.
# Reads secrets from .env (yours) and non-secret config from .env.local (mine).
# Usage: bash scripts/spike.sh
set -uo pipefail
cd "$(dirname "$0")/.."

# load env without echoing values
set -a
[ -f .env ] && . ./.env
[ -f .env.local ] && . ./.env.local
set +a
: "${BIFROST_BASE_URL:=http://localhost:8088/v1}"
: "${ASOF_MODEL:=gemini/gemini-flash-lite-latest}"

pass=0; fail=0
line() { printf '%s\n' "------------------------------------------------------------"; }
mask() { local v="${1:-}"; [ -n "$v" ] && echo "set (len ${#v})" || echo "MISSING"; }

echo "Keys detected:"
echo "  GEMINI_API_KEY : $(mask "${GEMINI_API_KEY:-}")"
echo "  TAVILY_API_KEY : $(mask "${TAVILY_API_KEY:-}")"
echo "  BIFROST_ENCRYPTION_KEY : $(mask "${BIFROST_ENCRYPTION_KEY:-}")"
echo

echo "### Spike 1/2 — Bifrost gateway ($BIFROST_BASE_URL, model $ASOF_MODEL)"
line
echo "Starting Bifrost via docker compose..."
docker compose --env-file .env --env-file .env.local up -d bifrost >/dev/null 2>&1
for i in $(seq 1 40); do
  curl -s -o /dev/null "http://localhost:8080/" && break
  sleep 1
done
BIFRO=$(curl -s -X POST "$BIFROST_BASE_URL/chat/completions" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"$ASOF_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"Reply with exactly: BIFROST_OK\"}],\"max_tokens\":20}")
echo "$BIFRO" | head -c 1400; echo
if echo "$BIFRO" | grep -q "BIFROST_OK"; then echo "✅ Bifrost PASS"; pass=$((pass+1)); else echo "❌ Bifrost FAIL"; fail=$((fail+1)); fi

echo; echo "### Spike 2/2 — Tavily live search (freshness)"
line
TAV=$(curl -s -X POST "https://api.tavily.com/search" \
  -H "Authorization: Bearer ${TAVILY_API_KEY:-}" \
  -H "Content-Type: application/json" \
  -d '{"query":"Google Gemini API pricing per million tokens","topic":"news","time_range":"year","max_results":5,"include_answer":true}')
echo "$TAV" | head -c 1400; echo
if echo "$TAV" | grep -q '"results"'; then echo "✅ Tavily PASS"; pass=$((pass+1)); else echo "❌ Tavily FAIL"; fail=$((fail+1)); fi

echo; line
echo "SPIKE RESULT: $pass passed, $fail failed"
[ "$fail" -eq 0 ] && echo "GO: both sponsor APIs return real data." || echo "WEAK: stop and report."
