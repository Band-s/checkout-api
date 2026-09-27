import { Router } from "express";
import { formatCents, renderTemplate } from "shared-utils";

export const receiptsRouter = Router();

const DEFAULT_RECEIPT = "Receipt for <%= order.id %>: <%= order.total %>";

/** A plain JavaScript identifier, such as "r" or "data". */
const PLAIN_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const REGEXP_OPTIONS = ["escape", "evaluate", "interpolate"] as const;

/**
 * Rejects template input that must not reach `_.template`.
 * Allows a `variable` option only when it is a plain identifier.
 * Rejects an `imports` option and values of the wrong type.
 */
export function validateTemplateInput(tpl: unknown, options?: unknown): void {
  if (typeof tpl !== "string") {
    throw new TypeError("Invalid template string passed into `_.template`");
  }

  if (options === undefined) {
    return;
  }

  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Invalid options passed into `_.template`");
  }

  const proto = Object.getPrototypeOf(options);
  if (proto !== Object.prototype && proto !== null) {
    throw new TypeError("Invalid options passed into `_.template`");
  }

  const opts = options as Record<string, unknown>;

  if (Object.prototype.hasOwnProperty.call(opts, "imports")) {
    throw new Error("Invalid `imports` option passed into `_.template`");
  }

  if (Object.prototype.hasOwnProperty.call(opts, "variable")) {
    const variable = opts.variable;
    if (typeof variable !== "string" || !PLAIN_IDENTIFIER.test(variable)) {
      throw new Error("Invalid `variable` option passed into `_.template`");
    }
  }

  for (const key of REGEXP_OPTIONS) {
    if (!Object.prototype.hasOwnProperty.call(opts, key)) {
      continue;
    }
    const value = opts[key];
    if (value != null && !(value instanceof RegExp)) {
      throw new TypeError(`Invalid \`${key}\` option passed into \`_.template\``);
    }
  }

  if (Object.prototype.hasOwnProperty.call(opts, "sourceURL")) {
    const sourceURL = opts.sourceURL;
    if (sourceURL != null && typeof sourceURL !== "string") {
      throw new TypeError("Invalid `sourceURL` option passed into `_.template`");
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
