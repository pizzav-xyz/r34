#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if [ -z "$TMUX" ]; then
  tmux new-session -d -s r34 "$0"
  tmux attach -t r34 2>/dev/null || true
  exit 0
fi

trap 'kill $PROXY_PID 2>/dev/null; rm -f .proxy-port' EXIT

rm -f .proxy-port

: "${R34_PROXY_PORT:=34000}"
export R34_PROXY_PORT

uv run proxy.py &
PROXY_PID=$!

for i in $(seq 1 30); do [ -f .proxy-port ] && break; sleep 0.1; done
[ -f .proxy-port ] || { echo "Proxy failed" >&2; exit 1; }

echo "Proxy ready on :$(cat .proxy-port)"
exec npx vite