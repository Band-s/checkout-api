---
name: northwind-safe-fix
description: Northwind Commerce procedure for fixing a bug or a vulnerability safely - reproduce, write a failing regression test first, make the smallest fix, run the full suite, and hand the reviewer evidence. Use when asked to fix a bug, remediate a CVE or security advisory, or prepare a fix PR in a Northwind repo.
---

# Northwind safe fix

Follow these steps in order. Do not skip a step; if one cannot be done, stop and
say which one and why.

## 1. Verify the environment

Run the verify command from `AGENTS.md` ("Cursor Cloud specific instructions"),
normally `npm ci && npm test`. If it fails, stop and report the failing command
and its output. Do not fix the environment by editing code or tests.

## 2. Reproduce

- Find the entry point (route, exported function, batch input) and follow the
  call chain to the faulty code. Write the chain down with `file:line` references.
- State the input that triggers the problem and what happens today.
- If the chain enters a protected path (`src/auth/**`, `src/payments/**`), stop
  after this step and ask for a named human approval before editing.

## 3. Write the failing regression test

- Add a **new** file, for example `test/<topic>.test.ts`. Never edit, skip or
  delete an existing test.
- One behavior per test, named for the behavior ("rejects an invalid currency
  with a 400"), using `node:test` and `node:assert/strict`.
- Run `npm test` and confirm the new test fails **on an assertion** (wrong status,
  wrong output). An import error or a crash in setup does not count as a
  reproduction.

## 4. Make the smallest fix

- Change as few lines in as few files as possible. No refactors, renames or
  formatting changes.
- No dependency changes unless the fix is a dependency upgrade; then minor/patch
  only, with the matching `package-lock.json` change. A major upgrade needs
  human approval.
- Do not change `package.json` scripts.

## 5. Run the full suite

Run `npm test`. Every test, old and new, must pass. Paste the summary lines
(`# tests`, `# pass`, `# fail`).

## 6. Summarize for the reviewer

Write the PR description (or final message) with these headings:

- **Problem**: what broke, for whom, in business terms.
- **Root cause**: the call chain with `file:line`.
- **Change**: files changed and why this is the smallest fix.
- **Evidence**: the new test's name; its failing output before the fix; the full
  suite result after the fix.
- **Risk**: what could regress, and what you deliberately did not change.
- **Approvals**: protected paths touched (or "none").
