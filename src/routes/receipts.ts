import { Router } from "express";
import { formatCents, renderTemplate } from "shared-utils";

export const receiptsRouter = Router();

const DEFAULT_RECEIPT = "Receipt for <%= order.id %>: <%= order.total %>";

const PLAIN_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Rejects template input before it can reach `_.template`.
 * A `variable` option must be a plain JavaScript identifier. An `imports`
 * option, a non-identifier `variable`, and wrong input types are rejected.
 */
export function validateTemplateInput(tpl: unknown, options?: unknown): void {
  if (typeof tpl !== "string") {
    throw new TypeError("Invalid template input");
  }
  if (options === undefined) {
    return;
  }
  if (typeof options !== "object" || options === null || Array.isArray(options)) {
    throw new TypeError("Invalid template options");
  }
  if (Object.hasOwn(options, "imports")) {
    throw new Error("Invalid template options");
  }
  if (Object.hasOwn(options, "variable")) {
    const variable = (options as { variable?: unknown }).variable;
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
  const source = template ?? DEFAULT_RECEIPT;
  try {
    validateTemplateInput(source, options);
  } catch {
    res.status(400).json({ error: "invalid template" });
    return;
  }
  const html = renderTemplate(
    source,
    { order: { id: order.id, total: formatCents(order.totalCents) } },
    options,
  );
  res.json({ html });
});
