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

const quote = (body: unknown) =>
  fetch(`${base}/api/shipping/quote`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

test("charges standard shipping below the free-shipping threshold", async () => {
  const res = await quote({ merchandiseCents: 2500 });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    merchandiseCents: 2500,
    shippingCents: 599,
    freeShipping: false,
  });
});

test("waives shipping once the order is above the threshold", async () => {
  const res = await quote({ merchandiseCents: 7500 });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    merchandiseCents: 7500,
    shippingCents: 0,
    freeShipping: true,
  });
});

test("rejects a missing merchandise total", async () => {
  const res = await quote({});
  assert.equal(res.status, 400);
});
