import { Router } from "express";
import { formatCents, renderTemplate } from "shared-utils";

export const receiptsRouter = Router();

const DEFAULT_RECEIPT = "Receipt for <%= order.id %>: <%= order.total %>";

/** A plain JavaScript binding identifier, such as "r" or "data". */
const PLAIN_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Rejects template input that must not be compiled by `_.template`.
 * A `variable` option must be a plain identifier. An `imports` option and
 * values of the wrong type are rejected.
 */
export function validateTemplateInput(tpl: unknown, options?: unknown): void {
  if (typeof tpl !== "string") {
    throw new TypeError("Invalid template string");
  }
  if (options == null) {
    return;
  }
  if (typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Invalid template options");
  }
  const opts = options as Record<string, unknown>;
  if ("imports" in opts) {
    throw new Error("Invalid `imports` option passed into `_.template`");
  }
  if ("variable" in opts) {
    const variable = opts.variable;
    if (typeof variable !== "string" || !PLAIN_IDENTIFIER.test(variable)) {
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
  const tpl = template ?? DEFAULT_RECEIPT;
  try {
    validateTemplateInput(tpl, options);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid template";
    res.status(400).json({ error: message });
    return;
  }
  const html = renderTemplate(
    tpl,
    { order: { id: order.id, total: formatCents(order.totalCents) } },
    options,
  );
  res.json({ html });
});
