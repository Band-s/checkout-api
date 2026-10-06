# checkout-api

> **Security demo fixture.** This repository depends (via `shared-utils`) on a
> known-affected dependency version (`lodash@4.17.20`, CVE-2021-23337) for
> fix-verification testing in the VulnFleet demo. Not for production use.
> Northwind Commerce is fictional.

Northwind Commerce checkout API. Tier 0, internet-facing, PCI scope.

- `POST /api/receipts/preview`: preview a merchant-customised receipt. The
  total is shown in `order.currency` (ISO 4217, default USD).

```bash
npm install
npm test
```
