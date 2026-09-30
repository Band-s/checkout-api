import { Router } from "express";
import { formatCents, renderTemplate } from "shared-utils";

export const receiptsRouter = Router();

const DEFAULT_RECEIPT = "Receipt for <%= order.id %>: <%= order.total %>";

/** Plain JavaScript identifier, e.g. "r" or "data". */
const PLAIN_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Validates input before it reaches `_.template`.
 *
 * Two arguments are `(templateString, options)`. A single string is a
 * `variable` value. Any other single argument is an options object.
 * Rejects a non-identifier `variable`, an `imports` option, and wrong types.
 */
export function validateTemplateInput(templateOrVariable: unknown, options?: unknown): void {
  if (arguments.length >= 2) {
    if (typeof templateOrVariable !== "string") {
      throw new TypeError("Invalid template string passed into `_.template`");
    }
  } else if (typeof templateOrVariable === "string") {
    if (!PLAIN_IDENTIFIER.test(templateOrVariable)) {
      throw new Error("Invalid `variable` option passed into `_.template`");
    }
    return;
  } else {
    options = templateOrVariable;
  }

  if (options === undefined) {
    return;
  }
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Invalid template options passed into `_.template`");
  }

  const opts = options as { variable?: unknown; imports?: unknown };
  if (Object.prototype.hasOwnProperty.call(opts, "imports")) {
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
    validateTemplateInput(source, options);
  } catch {
    res.status(400).json({ error: "invalid template input" });
    return;
  }
  const html = renderTemplate(
    source,
    { order: { id: order.id, total: formatCents(order.totalCents) } },
    options,
  );
  res.json({ html });
});
