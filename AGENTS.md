# checkout-api

> Demo code written for the VulnFleet / Cursor exercise. Northwind Commerce is
> fictional. It depends (via shared-utils) on lodash 4.17.20, historical
> CVE-2021-23337, on purpose.

## What this is

The Northwind Commerce checkout API: the internet-facing service merchants and
shoppers hit while paying. This repo holds the receipt flow:
`POST /api/receipts/preview` lets a merchant preview a branded receipt during
public onboarding, before they have an account. If it is down or wrong,
merchants cannot finish onboarding and shoppers get broken receipts.

## CMDB

| Field | Value |
|---|---|
| Tier | 0 (highest business criticality) |
| Exposure | internet-facing |
| Data class | PCI |
| Owner | payments-team |

## Install, build, test

```bash
npm ci        # installs shared-utils from git (github.com/<owner>/shared-utils#main)
npm test      # node --import tsx --test "test/**/*.test.ts"
npm start     # tsx src/server.ts, port 3000 (PORT overrides)
```

There is no build step: TypeScript runs through tsx. `npx tsc --noEmit` currently
fails at baseline (shared-utils' source needs `@types/lodash`, which is only a
devDependency there). That is known and not part of the verify command.

## Conventions

- Routes live in `src/routes/`, mounted in `src/app.ts`. Validate request
  bodies at the route and answer bad input with `400 { error: "<what is wrong>" }`.
- Money is integer cents; format with `formatCents` from shared-utils.
- `src/payments/**` is a protected path: see `src/payments/APPROVAL_POLICY.md`.
- Tests live in `test/*.test.ts` and start the real app on port 0.
- Remediation conventions: `.cursor/rules/northwind-remediation.mdc`.
  Fix procedure: the `northwind-safe-fix` skill.

## Cursor Cloud specific instructions

Verify command:

```bash
npm ci && npm test
```

Before editing, run the verify command. If it fails, stop and report the failing command and output.

- Builds run the default branch's install step (`.cursor/environment.json`), so
  dependencies are already installed; the verify command's `npm ci` makes them
  match this branch's lockfile.
- `npm ci` needs network access to github.com to fetch shared-utils.
- Prefer a test that starts the app on port 0 (see `test/receipts.test.ts`).

### Before/after evidence for an HTTP fix

Run this once before you change `src/` and once after the fix, and paste both
responses (status line and body) into the PR description:

```bash
node --import tsx src/server.ts > /tmp/checkout-api.log 2>&1 &
SERVER_PID=$!
for i in $(seq 1 40); do curl -s -o /dev/null localhost:3000/ && break; sleep 0.25; done
curl -s -i -X POST localhost:3000/api/receipts/preview \
  -H 'content-type: application/json' \
  -d '{"order":{"id":"ord_2","totalCents":4250,"currency":null}}'
kill $SERVER_PID
```

For the receipt currency bug: before the fix this returns `500` with an HTML stack
trace; after it, `400` with a JSON `error` that names `order.currency`. An absent
currency (no `currency` field) is not the bug: it defaults to USD and returns
`200`. Show that it still does by sending `{"order":{"id":"ord_2","totalCents":4250}}`.
