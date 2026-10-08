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

test("rejects a null order currency with a 400", async () => {
  const res = await preview({ order: { id: "ord_2", totalCents: 4250, currency: null } });
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error?: string };
  assert.equal(typeof body.error, "string");
  assert.match(body.error ?? "", /order\.currency/);
});
