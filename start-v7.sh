#!/usr/bin/env bash
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Node.js لازم است: https://nodejs.org"; exit 1; }
node apply-v7.mjs
( sleep 1; (xdg-open http://localhost:3000 || open http://localhost:3000) >/dev/null 2>&1 ) &
node tools/serve-v7.mjs 3000
