import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.js";

let server: Server;
let base: string;

before(() => {
  server = createApp().listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => server.close());

const preview = (body: unknown) =>
  fetch(`${base}/api/receipts/preview`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

test("renders the receipt total in the order's currency", async () => {
  const res = await preview({ order: { id: "ord_eu", totalCents: 4250, currency: "EUR" } });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { html: "Receipt for ord_eu: €42.50" });
});

test("defaults to USD when the order has no currency", async () => {
  const res = await preview({ order: { id: "ord_us", totalCents: 999 } });
  assert.deepEqual(await res.json(), { html: "Receipt for ord_us: $9.99" });
});
