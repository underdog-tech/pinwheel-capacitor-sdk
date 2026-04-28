#!/bin/bash
# Syncs the public pinwheel-capacitor-sdk repo after a successful release (mirrors
# pinwheel-android-sdk-internal/scripts/update-external-repo/main.sh):
#   - Copies CHANGELOG.md from the internal repo
#   - Commits and pushes to the public repo's main branch
#   - Tags the commit with the version
#   - Creates a GitHub Release (prerelease=true for non-main branches)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

source "$REPO_ROOT/scripts/helpers.sh"

VERSION=$(get_version)
IS_ALPHA=$(get_alpha_val)

echo ">> Version:  $VERSION"
echo ">> IS_ALPHA: $IS_ALPHA"

set_up_github_user

echo ">> Cloning public repo: $(get_repo_owner)/$(get_repo_name)"
git clone "https://github.com/$(get_repo_owner)/$(get_repo_name).git"

# Capture old changelog before overwriting so we can compute the diff for the release notes
OLD_CHANGELOG="$(get_repo_name)/CHANGELOG.md"
TMP_OLD_CHANGELOG=".tmp_old_changelog"
if [ -f "$OLD_CHANGELOG" ]; then
  cp "$OLD_CHANGELOG" "$TMP_OLD_CHANGELOG"
else
  touch "$TMP_OLD_CHANGELOG"
fi

cd "$(get_repo_name)"

echo ">> Copying CHANGELOG.md"
cp -r ../CHANGELOG.md .

echo ">> Computing release description from changelog diff"
DESCRIPTION=$(diff ../CHANGELOG.md "../$TMP_OLD_CHANGELOG" | grep '^< ' | sed 's/^< //' | tail -n +2)
echo ">> Description:"
echo "$DESCRIPTION"

echo ">> Git status"
git status
echo ">> Git diff"
git diff | cat

echo ">> Setting up git user for external repo commit"
set_up_github_user

git add .
git commit -m "Update CHANGELOG.md for version $VERSION"

if [ "${GITHUB_ACTIONS:-}" = "true" ] || [ "${CIRCLECI:-}" = "true" ]; then
  echo ">> Pushing to main"
  git push authenticated main

  echo ">> Tagging: $VERSION"
  git tag "$VERSION"
  git push authenticated --tags

  echo ">> Creating GitHub Release"
  json_payload=$(jq -n \
    --arg tag "$VERSION" \
    --arg desc "$DESCRIPTION" \
    --arg is_alpha "$IS_ALPHA" \
    '{
      tag_name: $tag,
      target_commitish: "main",
      name: ($tag + " Release"),
      body: $desc,
      draft: false,
      prerelease: ($is_alpha == "true")
    }')

  curl -X POST \
    -H "Authorization: token $(get_github_write_token)" \
    -H "Accept: application/vnd.github.v3+json" \
    -d "$json_payload" \
    "https://api.github.com/repos/$(get_repo_owner)/$(get_repo_name)/releases"

  echo ">> GitHub Release created"
else
  echo ">> Not in CI — skipping push, tag, and release."
fi

cd ..
rm -f "$TMP_OLD_CHANGELOG"
