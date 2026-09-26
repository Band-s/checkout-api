import { Router } from "express";
import { formatCents, renderTemplate } from "shared-utils";

export const receiptsRouter = Router();

const DEFAULT_RECEIPT = "Receipt for <%= order.id %>: <%= order.total %>";

const PLAIN_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Rejects template input before it reaches `_.template`.
 * `variable` must be a plain JavaScript identifier. `imports` is rejected.
 * Wrong input types are rejected.
 */
export function validateTemplateInput(template: unknown, data: unknown, options?: unknown): void {
  if (typeof template !== "string") {
    throw new TypeError("Template must be a string");
  }
  if (data === null || typeof data !== "object") {
    throw new TypeError("Template data must be an object");
  }
  if (options === undefined) {
    return;
  }
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Template options must be a plain object");
  }

  const opts = options as Record<string, unknown>;
  if ("imports" in opts) {
    throw new Error("Invalid `imports` option passed into template");
  }
  if ("variable" in opts && opts.variable != null) {
    const variable = opts.variable;
    if (typeof variable !== "string" || !PLAIN_IDENTIFIER.test(variable)) {
      throw new Error("Invalid `variable` option passed into `_.template`");
    }
  }
  for (const key of ["escape", "evaluate", "interpolate"] as const) {
    if (key in opts && opts[key] != null && !(opts[key] instanceof RegExp)) {
      throw new TypeError(`Invalid \`${key}\` option passed into template`);
    }
  }
  if ("sourceURL" in opts && opts.sourceURL != null && typeof opts.sourceURL !== "string") {
    throw new TypeError("Invalid `sourceURL` option passed into template");
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
  const data = { order: { id: order.id, total: formatCents(order.totalCents) } };
  try {
    validateTemplateInput(source, data, options);
  } catch {
    res.status(400).json({ error: "invalid template" });
    return;
  }
  const html = renderTemplate(source, data, options);
  res.json({ html });
});
