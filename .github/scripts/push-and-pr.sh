#!/usr/bin/env bash
set -euo pipefail

# push-and-pr.sh
# Helper script to create a feature branch, commit staged changes (or stage all), push it and
# optionally create a PR using the GitHub CLI. This is intentionally conservative and interactive.

usage() {
  cat <<'USAGE'
Usage: push-and-pr.sh [branch-name] [commit-message]

Examples:
  ./push-and-pr.sh                       # creates branch fix/time-directive-YYYYMMDD, stages all, commits with default message, pushes
  ./push-and-pr.sh my-branch "fix: small change"  # uses provided branch and message

Notes:
 - This script will show uncommitted changes and ask for confirmation before staging/committing.
 - It will not force-push or rewrite history.
 - To create the GitHub PR automatically you need the `gh` CLI installed and authenticated. The script will
   print the `gh` command to run if gh isn't available.
USAGE
}

# Parse optional flags: --no-commit, --no-stage
NO_COMMIT=0
NO_STAGE=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-commit)
      NO_COMMIT=1
      shift
      ;;
    --no-stage)
      NO_STAGE=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      break
      ;;
  esac
done

BRANCH=${1:-"fix/time-directive-$(date +%Y%m%d)"}
MSG=${2:-"fix(markdown): convert numeric text directives for time fragments; tighten regex"}

# safety checks
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: not inside a git repository"
  exit 1
fi

echo "Repository: $(git remote get-url origin 2>/dev/null || echo '(no origin)')"

# Make script executable when saved into the repo (git will preserve mode, but local checkout may need chmod)

STATUS=$(git status --porcelain)
if [ -n "$STATUS" ]; then
  echo "Uncommitted changes detected:"
  git status --porcelain
  echo
  if [ "$NO_STAGE" -eq 1 ]; then
    read -p "--no-stage specified: proceed WITHOUT staging changes? [y/N] " ans
    if [ "$ans" != "y" ]; then
      echo "Aborting. Please stage/commit manually or run the script again when ready.";
      exit 1
    fi
  else
    read -p "Stage ALL changes and continue? [y/N] " ans
    if [ "$ans" != "y" ]; then
      echo "Aborting. Please stage/commit manually or run the script again when ready.";
      exit 1
    fi
    git add -A
  fi
else
  echo "No uncommitted changes. Proceeding with current index/state." 
fi

# make sure origin is available
git fetch origin --quiet || true

echo "Creating branch: $BRANCH (based on origin/main if exists)
"
# create branch based on origin/main if available, otherwise current HEAD
if git show-ref --verify --quiet refs/remotes/origin/main; then
  git checkout -B "$BRANCH" origin/main
else
  git checkout -B "$BRANCH"
fi

# commit if there are staged changes and committing isn't disabled
if [ "$NO_COMMIT" -eq 1 ]; then
  echo "--no-commit specified: skipping git commit step."
else
  if git diff --staged --quiet; then
    echo "No staged changes to commit (index clean)."
  else
    git commit -m "$MSG"
    echo "Committed: $MSG"
  fi
fi

# push
git push -u origin "$BRANCH"

echo
echo "Branch pushed: origin/$BRANCH"

# Suggest creating PR
if command -v gh >/dev/null 2>&1; then
  echo "You have GitHub CLI 'gh' installed. Create a PR with:"
  echo "  gh pr create --fill --base main --head $BRANCH"
  read -p "Create the PR now with gh? [y/N] " p
  if [ "$p" = "y" ]; then
    gh pr create --fill --base main --head "$BRANCH"
  else
    echo "PR creation skipped. You can run the gh command shown above when ready."
  fi
else
  echo "GitHub CLI (gh) not found. Create a PR in the browser:" 
  echo "  Visit: https://github.com/<OWNER>/<REPO>/compare/main...$BRANCH"
  echo "(Replace <OWNER>/<REPO> with your repository path)"
fi

echo "Done. Review the PR and merge when ready."
