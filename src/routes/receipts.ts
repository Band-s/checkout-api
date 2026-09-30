import { Router } from "express";
import { formatCents, renderTemplate } from "shared-utils";

export const receiptsRouter = Router();

const DEFAULT_RECEIPT = "Receipt for <%= order.id %>: <%= order.total %>";

/** A plain JavaScript identifier: "r", "data", "_value". */
const PLAIN_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Rejects template source and options that must not reach `_.template`.
 * `variable` must be a plain JavaScript identifier when present. An
 * `imports` option, a non-string template, and non-object options are rejected.
 */
export function validateTemplate(tpl: unknown, options?: unknown): void {
  if (typeof tpl !== "string") {
    throw new TypeError("Invalid template passed into `_.template`");
  }
  if (options === undefined) {
    return;
  }
  if (typeof options !== "object" || options === null || Array.isArray(options)) {
    throw new TypeError("Invalid options passed into `_.template`");
  }

  const opts = options as Record<string, unknown>;
  if (opts.imports !== undefined) {
    throw new Error("Invalid `imports` option passed into `_.template`");
  }
  if (opts.variable !== undefined) {
    if (typeof opts.variable !== "string" || !PLAIN_IDENTIFIER.test(opts.variable)) {
      throw new Error("Invalid `variable` option passed into `_.template`");
    }
  }
}

/**
 * POST /api/receipts/preview
 * Lets merchants preview a customised receipt before saving it.
 * Body: { template?: string, order: { id, totalCents }, options?: object }
 * No authentication: used by the public merchant onboarding flow.
 */
receiptsRouter.post("/preview", (req, res) => {
  const { template, order, options } = req.body ?? {};
  if (!order?.id || typeof order.totalCents !== "number") {
    res.status(400).json({ error: "order.id and order.totalCents are required" });
    return;
  }
  const source = template ?? DEFAULT_RECEIPT;
  try {
    validateTemplate(source, options);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid template";
    res.status(400).json({ error: message });
    return;
  }
  const html = renderTemplate(
    source,
    { order: { id: order.id, total: formatCents(order.totalCents) } },
    options,
  );
  res.json({ html });
});
