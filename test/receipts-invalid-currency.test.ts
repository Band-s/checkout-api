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

async function assertCurrencyRejected(currency: unknown) {
  const res = await preview({ order: { id: "ord_2", totalCents: 4250, currency } });
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error?: unknown };
  assert.equal(typeof body.error, "string");
  assert.match(body.error as string, /order\.currency/);
}

test("rejects a null currency with a 400", async () => {
  await assertCurrencyRejected(null);
});

test("rejects an empty currency with a 400", async () => {
  await assertCurrencyRejected("");
});

test("rejects a non-ISO currency with a 400", async () => {
  await assertCurrencyRejected("EURO");
});
