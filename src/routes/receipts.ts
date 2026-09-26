import { Router } from "express";
import { formatCents, renderTemplate } from "shared-utils";

export const receiptsRouter = Router();

const DEFAULT_RECEIPT = "Receipt for <%= order.id %>: <%= order.total %>";

/** Plain JavaScript identifier, e.g. `r` or `data`. */
const PLAIN_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Rejects template input that must not reach `_.template`.
 * The template must be a string. Options, when supplied, must be a plain
 * object: `variable` must be a plain identifier, `imports` is forbidden,
 * and known option fields must have the right type.
 */
export function validateTemplateInput(template: unknown, options?: unknown): void {
  if (typeof template !== "string") {
    throw new TypeError("Invalid template");
  }
  if (options === undefined) {
    return;
  }
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
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

  for (const key of ["escape", "evaluate", "interpolate"] as const) {
    const value = opts[key];
    if (value !== undefined && !(value instanceof RegExp)) {
      throw new TypeError(`Invalid \`${key}\` option passed into \`_.template\``);
    }
  }

  if (opts.sourceURL !== undefined && typeof opts.sourceURL !== "string") {
    throw new TypeError("Invalid `sourceURL` option passed into `_.template`");
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
    validateTemplateInput(source, options);
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
