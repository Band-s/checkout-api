import { Router } from "express";
import { formatCents, renderTemplate } from "shared-utils";

export const receiptsRouter = Router();

const DEFAULT_RECEIPT = "Receipt for <%= order.id %>: <%= order.total %>";

/** Plain JavaScript identifier: "r", "data", "$value", "_item". */
const PLAIN_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const REGEXP_OPTIONS = ["escape", "evaluate", "interpolate"] as const;

/**
 * Rejects template input that must not reach `_.template`.
 * The template must be a string. Options, when supplied, must be a plain
 * object whose `variable` is a plain identifier. An `imports` option and
 * values of the wrong type are rejected.
 */
export function validateTemplateInput(tpl: unknown, options?: unknown): void {
  if (typeof tpl !== "string") {
    throw new TypeError("Invalid template passed into `_.template`");
  }
  if (options === undefined) {
    return;
  }
  if (typeof options !== "object" || options === null || Array.isArray(options)) {
    throw new TypeError("Invalid options passed into `_.template`");
  }
  const prototype = Object.getPrototypeOf(options);
  if (prototype !== Object.prototype && prototype !== null) {
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

  for (const key of REGEXP_OPTIONS) {
    const value = opts[key];
    if (value != null && !(value instanceof RegExp)) {
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
  const tpl = template ?? DEFAULT_RECEIPT;
  try {
    validateTemplateInput(tpl, options);
  } catch {
    res.status(400).json({ error: "invalid template" });
    return;
  }
  const html = renderTemplate(
    tpl,
    { order: { id: order.id, total: formatCents(order.totalCents) } },
    options,
  );
  res.json({ html });
});
