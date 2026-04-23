#!/bin/bash

# Causes the shell to exit immediately if a simple command exits with a nonzero exit value.
set -e

function get_version () {
  node -e "console.log(JSON.parse(require('fs').readFileSync('package.json','utf8')).version)"
}

function get_hash () {
  git rev-parse --short HEAD
}

function get_repo_owner () {
  echo "${PUBLIC_REPO_OWNER:-pinwheel-hq}"
}

function get_repo_name () {
  echo "${PUBLIC_REPO_NAME:-pinwheel-capacitor-sdk}"
}

# Same as pinwheel-android-sdk-internal: CircleCI injects GITHUB_TOKEN_CTX from frontend-production.
# GitHub Actions: set repository secret GITHUB_TOKEN_CTX to the same PAT.
function get_github_write_token () {
  echo "$GITHUB_TOKEN_CTX"
}

function set_up_github_user () {
  git config user.email "pinwheel-it@pinwheelapi.com"
  git config user.name "pinwheel-it-svc"

  if ! git remote | grep -q "authenticated"; then
    git remote add authenticated \
      "https://pinwheel-it-svc:$(get_github_write_token)@github.com/$(get_repo_owner)/$(get_repo_name).git"
  fi
}

# Returns "true" if the current branch is not main (i.e. it is a deploy/* branch),
# "false" if we are on main. Used to set prerelease: true/false on GitHub Releases.
function get_alpha_val () {
  if [ -n "${GITHUB_REF_NAME:-}" ]; then
    current_branch="$GITHUB_REF_NAME"
  else
    current_branch=$(git rev-parse --abbrev-ref HEAD)
  fi

  if [ "$current_branch" = "main" ]; then
    echo "false"
  else
    echo "true"
  fi
}
