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

- The environment's install step (`.cursor/environment.json`) already runs `npm ci`.
- `npm ci` needs network access to github.com to fetch shared-utils.
- To reproduce an HTTP bug by hand: `npm start` in one terminal, then
  `curl -s -X POST localhost:3000/api/receipts/preview -H 'content-type: application/json' -d '<body>'`.
  Prefer a test that starts the app on port 0 (see `test/receipts.test.ts`).
