# src/payments/

Reserved for checkout-api's payment path (authorisation, capture, refunds, card
data handling). There is no code here yet in this demo repo; the directory
exists so its `APPROVAL_POLICY.md` is in place before payment code lands.

Every change under this directory needs two named human reviewers and is never
auto-approved: see [`APPROVAL_POLICY.md`](APPROVAL_POLICY.md). It is also a
protected path (`src/payments/**`) in VulnFleet's policy.

The receipt preview route (`src/routes/receipts.ts`) is not a payment path: it
formats amounts but never touches card data or money movement.
