#!/usr/bin/env bash
# Packs the publishable packages and installs the CLI from the resulting
# tarballs into a scratch project, then exercises the installed binary.
# This guards against packaging regressions that unit tests can't see:
# missing dist/build files, or a runtime dependency declared in the wrong
# section (the bug that shipped in 2.0.3).
#
# The scratch project uses npm overrides to point the @my-scrapbook/* names
# at the local tarballs, and installs ONLY the cli tarball — so a workspace
# package the cli forgets to declare as a dependency is genuinely absent at
# runtime, exactly as it would be for a real npm install.
#
# Expects the packages to be built already (local-api dist/, local-client
# build/, cli dist/) — same as before a publish.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${SMOKE_PORT:-4801}"

for built in packages/local-api/dist packages/local-client/build packages/cli/dist; do
  if [ ! -d "$ROOT/$built" ]; then
    echo "Missing $built — build the packages first (see .github/workflows/ci.yml)." >&2
    exit 1
  fi
done

WORK="$(mktemp -d)"
SERVER_PID=""
cleanup() {
  if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -rf "$WORK"
}
trap cleanup EXIT

echo "==> Packing packages"
mkdir -p "$WORK/tarballs"
pack() {
  local name
  name="$(cd "$ROOT/packages/$1" && npm pack --pack-destination "$WORK/tarballs" --silent)"
  echo "$WORK/tarballs/$name"
}
TYPES_TGZ="$(pack types)"
API_TGZ="$(pack local-api)"
CLIENT_TGZ="$(pack local-client)"
CLI_TGZ="$(pack cli)"

echo "==> Installing the cli tarball into a scratch project"
APP="$WORK/app"
mkdir "$APP"
cd "$APP"
node -e '
  const [api, client, types] = process.argv.slice(1);
  require("fs").writeFileSync(
    "package.json",
    JSON.stringify(
      {
        name: "pack-smoke",
        private: true,
        overrides: {
          "@my-scrapbook/local-api": "file:" + api,
          "@my-scrapbook/local-client": "file:" + client,
          "@my-scrapbook/types": "file:" + types,
        },
      },
      null,
      2
    ) + "\n"
  );
' "$API_TGZ" "$CLIENT_TGZ" "$TYPES_TGZ"
npm install "$CLI_TGZ" --no-audit --no-fund --loglevel=error

BIN="$APP/node_modules/.bin/my-scrapbook"

echo "==> Checking --version"
# The path is passed as an argument (not interpolated into the expression) so
# Git Bash on Windows converts it to a form Windows node can require().
EXPECTED="$(node -p "require(process.argv[1]).version" "$ROOT/packages/cli/package.json")"
ACTUAL="$("$BIN" --version)"
if [ "$ACTUAL" != "$EXPECTED" ]; then
  echo "--version reported '$ACTUAL', expected '$EXPECTED'" >&2
  exit 1
fi

echo "==> Serving a notebook and hitting the API"
"$BIN" serve --no-open -p "$PORT" &
SERVER_PID=$!

up=""
for _ in $(seq 1 40); do
  if curl -sf "http://localhost:$PORT/cells" -o "$WORK/cells.json"; then
    up=1
    break
  fi
  sleep 0.5
done
if [ -z "$up" ]; then
  echo "Server never answered on port $PORT" >&2
  exit 1
fi

if [ "$(cat "$WORK/cells.json")" != "[]" ]; then
  echo "GET /cells on a fresh notebook returned $(cat "$WORK/cells.json"), expected []" >&2
  exit 1
fi
if [ ! -f "$APP/notebook.js" ]; then
  echo "Serving did not create notebook.js" >&2
  exit 1
fi
if ! curl -sf "http://localhost:$PORT/" | grep -q 'id="root"'; then
  echo "GET / did not return the app shell" >&2
  exit 1
fi

echo "==> Pack smoke test passed (my-scrapbook $ACTUAL)"
