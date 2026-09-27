import { Router } from "express";
import { formatCents, renderTemplate } from "shared-utils";

export const receiptsRouter = Router();

const DEFAULT_RECEIPT = "Receipt for <%= order.id %>: <%= order.total %>";

/** A plain JavaScript identifier, safe to use as a template `variable` name. */
const PLAIN_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Rejects template input that must not reach `_.template`.
 * Allows a `variable` option only when it is a plain identifier.
 * Rejects an `imports` option and values of the wrong type.
 */
export function validateTemplateInput(tpl: unknown, options?: unknown): void {
  if (typeof tpl !== "string") {
    throw new TypeError("Template must be a string");
  }
  if (options === undefined) {
    return;
  }
  if (typeof options !== "object" || options === null || Array.isArray(options)) {
    throw new TypeError("Template options must be a plain object");
  }
  const record = options as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(record, "imports")) {
    throw new Error("Invalid `imports` option passed into `_.template`");
  }
  if (Object.prototype.hasOwnProperty.call(record, "variable")) {
    const variable = record.variable;
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
    const message = err instanceof Error ? err.message : "Invalid template input";
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
