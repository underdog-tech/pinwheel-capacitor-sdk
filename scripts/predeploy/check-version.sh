#!/usr/bin/env bash
# Ensures CHANGELOG.md documents the version in package.json (npm packages).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

VERSION="$(node -e "console.log(JSON.parse(require('fs').readFileSync('package.json','utf8')).version)")"

echo ">> package.json version: $VERSION"

if ! grep -qF "## [$VERSION]" CHANGELOG.md && ! grep -qF "## ${VERSION}" CHANGELOG.md; then
  echo ""
  echo "ERROR: No CHANGELOG.md section found for version $VERSION."
  echo "Add a '## [$VERSION]' section to CHANGELOG.md."
  exit 1
fi

echo ">> CHANGELOG.md contains an entry for $VERSION."
echo ">> Version check passed."
