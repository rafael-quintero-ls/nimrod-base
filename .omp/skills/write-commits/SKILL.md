---
name: write-commits
description: Write and validate git commits and gh CLI PR bodies for vuexy-template. Use whenever creating a commit, opening/editing a pull request, or writing any multi-line git/gh message — covers Conventional Commits format, gitlint validation, and the safe way to pass multi-line bodies to git/gh without shell-escaping corruption.
allowed-tools: Bash(git:*), Bash(gh:*), Bash(uvx:*)
license: MIT
metadata:
  author: vuexy-template
  version: "1.0"
---

# Writing Commits and PR Bodies

**Read `CONTRIBUTING.md` first** for the branch/PR/review policy this skill implements the mechanics of. This skill is the "how"; `CONTRIBUTING.md` is the "when/why".

## The rule, in one sentence

**Every commit message and every `gh` body longer than one line is written to a temp file first, then passed via `-F`/`--body-file`/`git commit -F` — never inlined as a shell string, never built with a heredoc.**

## 1. Conventional Commits format (required)

Every commit title MUST match:

```
<type>(<optional-scope>): <description>
```

- **Types used in this repo** (matches `.gitlint`): `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **`feat`** — new capability (page, route, API endpoint).
- **`fix`** — bug fix.
- **`docs`** — documentation only, no behavior change.
- **`chore`** — tooling, scaffolding, dependency/process changes with no user-facing behavior change.
- **`refactor`** — code change with no behavior change.
- **Scope** (optional, in parens): the area touched — a page/route name, a module (`auth`, `casl`, `api`). Omit when the change is repo-wide (methodology, tooling).
- **Title**: imperative mood, no trailing period, ≤72 chars, ≥10 chars (enforced by `.gitlint`).
- **Body**: one blank line after the title, then free-form paragraphs. For a capability change, reference the OpenSpec change it corresponds to:
  ```
  OpenSpec change: openspec/changes/archive/<date>-<name>/
  ```

Full spec: [conventionalcommits.org/en/v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). This repository does not enforce SemVer or auto-generated changelogs from commit types — the value here is purely a readable, filterable history and a forcing function toward one-intent-per-commit, matching the "right-size the change" principle already used for OpenSpec changes.

### One commit, one intent

If a commit message needs "and also" to describe it, split it. Match commits to OpenSpec changes where one exists: one archived change → one commit (or one tightly-related group). Don't bundle an unrelated fix into a feature commit.

## 2. Validate before committing: gitlint

This repo ships `.gitlint` (repo root) with the Conventional Commits rule enabled. Validate a drafted message **before** committing:

```bash
# Draft the message to a temp file first (see §3), then:
uvx --from gitlint-core gitlint --config .gitlint --msg-filename /tmp/commit-msg.txt
```

Or validate after the fact / in a range:

```bash
# Lint the last commit
uvx --from gitlint-core gitlint --config .gitlint

# Lint every commit on a branch not yet in main
uvx --from gitlint-core gitlint --config .gitlint --commits main..HEAD
```

`uvx --from gitlint-core gitlint ...` runs gitlint with no persistent install. To install a local `commit-msg` git hook instead (enforces automatically on every `git commit`, blocking bad messages before they land):

```bash
uvx --from gitlint-core gitlint install-hook
```

A non-zero exit means a rule was violated — read gitlint's output, it names the exact rule and line.

## 3. The safe pattern for multi-line messages (commits AND `gh` bodies)

**Never** do this — inline heredocs and shell strings are one stray backtick, `$`, or unbalanced quote away from silent corruption:

```bash
# WRONG — do not do this
git commit -m "$(cat <<'EOF'
feat: something

Body with `backticks` or $(command) substitutions gets executed by the
shell before git ever sees it.
EOF
)"
```

**Always** write the message to a file with the `write` tool (not a shell heredoc — `write` does not invoke a shell, so nothing inside the content is ever interpreted), then pass the file path:

```bash
# 1. Write the message with the `write` tool (not bash), e.g. to /tmp/commit-msg.txt
# 2. Validate it (optional but recommended):
uvx --from gitlint-core gitlint --config .gitlint --msg-filename /tmp/commit-msg.txt
# 3. Commit with -F, never -m for anything beyond a trivial one-liner:
git commit -F /tmp/commit-msg.txt
```

The same pattern applies to every `gh` command that takes a body:

```bash
# 1. Write the PR/issue body with the `write` tool to e.g. /tmp/pr-body.md
# 2. Create or edit using --body-file (-F), never --body with an inline string
#    for anything beyond a one-line body:
gh pr create --title "..." --body-file /tmp/pr-body.md
gh pr edit <number> --body-file /tmp/pr-body.md
gh issue create --title "..." --body-file /tmp/pr-body.md
```

`-F`/`--body-file` accepts `-` to read from stdin, but prefer a real temp file — it's inspectable and re-usable if the first command fails partway.

**After creating or editing, verify what actually landed** — don't assume success from a non-error exit code:

```bash
git log -1 --format=%B                 # confirm the commit message is intact
gh pr view <number> --json title,body  # confirm the PR body is intact, not truncated/mangled
```

## 4. `gh` CLI reference for this workflow

Authentication (already configured in this environment; verify if commands fail with an auth error):

```bash
gh auth status
```

### Branches and commits

Per `CONTRIBUTING.md`: `<type>/<short-description>` branch names matching the commit type, e.g. `feat/invoice-export`, `docs/contributing-setup`. One branch per PR; a PR may bundle several tightly-related commits (e.g. one per OpenSpec change in a themed batch) but should have one clear overall purpose stated in the PR title.

```bash
git checkout -b feat/<short-description>
# ... make commits per §1-§3 ...
git push -u origin feat/<short-description>
```

### Opening a PR

```bash
gh pr create --title "<type>(<scope>): <summary>" --body-file /tmp/pr-body.md
```

- `--title`: same Conventional Commits shape as a commit title, since it becomes the squash-merge commit title on many repos' default merge strategy — check this repo's actual merge behavior with `gh repo view --json mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed` if unsure.
- `--body-file`: structured body — Summary, what changed (reference OpenSpec changes), verification performed, what's out of scope.
- `--reviewer`, `--label`, `--assignee`: add if applicable; CODEOWNERS (`.github/CODEOWNERS`) already governs required review.

### Fixing a PR you already created

```bash
gh pr edit <number> --title "..." --body-file /tmp/pr-body.md
```

Always re-verify with `gh pr view <number> --json title,body` after.

### Inspecting before trusting

```bash
gh pr view <number>                          # human-readable
gh pr view <number> --json title,body,url    # machine-readable, safe to grep/diff
gh pr diff <number>                           # see the actual diff GitHub will show
gh pr checks <number>                         # CI status, if configured
```

### Merging (only after review per CONTRIBUTING.md)

```bash
gh pr merge <number> --squash   # or --merge / --rebase, matching repo convention
```

Do not merge your own PR without the review step `CONTRIBUTING.md` requires, even when you are also the account with merge rights.

## Quick checklist

- [ ] Title matches `<type>(<scope>): <description>`, imperative, ≤72 chars.
- [ ] One commit = one intent; matches one OpenSpec change where applicable.
- [ ] Body written to a file via the `write` tool, not a shell heredoc.
- [ ] `gitlint --config .gitlint` passes (or the commit-msg hook already enforced it).
- [ ] Committed with `git commit -F <file>`, not an inline `-m` for anything multi-line.
- [ ] Any `gh` body used `--body-file`, not `--body` with an inline multi-line string.
- [ ] Verified the result (`git log -1 --format=%B`, `gh pr view --json body`) — not just checked for a non-error exit code.
