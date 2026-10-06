# Approval policy: checkout-api `src/payments/`

<!-- Demo policy for the fictional Northwind Commerce. Read by Cursor PR Routing & Approval for every changed file under src/payments/. -->

This directory is the payment path of a Tier 0, internet-facing, PCI-scoped
service: authorisation, capture, refunds and anything that handles card data.
It matches the `src/payments/**` protected path in VulnFleet's `policy.yaml`.

## Rules

- **Human review is required** for any pull request that changes a file in this
  directory, including tests, comments and this policy file.
- **Never auto-approve.** Ignore risk scores, PR size, author, labels and clean
  Bugbot or Security Review results: none of them is enough here.
- Request **both** named reviewers below, and leave the PR unapproved until a
  human approves it. If a reviewer cannot be requested, comment on the PR that
  human review is required under this policy and why.
- New dependencies or dependency upgrades that this directory uses need the same
  two reviewers.

## Named reviewers

| Role | GitHub login |
|---|---|
| Payments owner (payments-team) | @Band-s |
| Second reviewer, PCI security | @REPLACE-WITH-SECOND-REVIEWER <!-- TODO before the demo: a real GitHub login with access to this repo --> |

## What reviewers check

- No card data (PAN, CVV, track data) is logged, returned or stored outside the
  approved path.
- Money stays in integer cents; currency is validated before use.
- The PR includes a new regression test that fails without the fix.
