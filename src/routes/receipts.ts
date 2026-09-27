import { Router } from "express";
import { formatCents, renderTemplate } from "shared-utils";

export const receiptsRouter = Router();

const DEFAULT_RECEIPT = "Receipt for <%= order.id %>: <%= order.total %>";

/** A plain JavaScript identifier, such as "r" or "data". */
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Rejects template input that must not reach `_.template`: a non-string
 * template, options of the wrong type, an `imports` option, or a `variable`
 * that is not a plain JavaScript identifier.
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

  const opts = options as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(opts, "imports")) {
    throw new Error("Invalid `imports` option passed into `_.template`");
  }
  if (Object.prototype.hasOwnProperty.call(opts, "variable")) {
    const variable = opts.variable;
    if (typeof variable !== "string" || !IDENTIFIER.test(variable)) {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid template input";
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
