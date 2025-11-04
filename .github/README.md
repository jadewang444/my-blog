# Repository helper scripts

This folder contains small helper scripts for contributors. They are intentionally conservative and interactive.

## push-and-pr.sh

A helper to create a branch, optionally stage/commit changes, push to `origin`, and create a pull request with the GitHub CLI.

Location: `.github/scripts/push-and-pr.sh`

Usage examples:

- Default (creates branch, stages all changes, commits with default message, pushes):

```bash
.github/scripts/push-and-pr.sh
```

- Specify branch and commit message:

```bash
.github/scripts/push-and-pr.sh my-branch "fix: adjust text directive handling"
```

- Skip auto-staging (script will not run `git add -A`):

```bash
.github/scripts/push-and-pr.sh --no-stage
```

- Skip committing (useful when you only want to create a branch & push existing staged changes):

```bash
.github/scripts/push-and-pr.sh --no-commit
```

- Combine flags (order of flags is flexible):

```bash
.github/scripts/push-and-pr.sh --no-stage --no-commit my-branch "message"
```

Notes:
- The script will not force-push or rewrite history.
- If you want the script to create a PR automatically, install and authenticate the GitHub CLI (`gh`). When prompted the script can run `gh pr create --fill --base main --head <branch>` for you.
- The script is intended as a convenience for contributors; prefer the branch + PR workflow for production changes.

If you want additional behaviors (e.g., `--no-push`, or automatic sign-off), open a PR with the change.