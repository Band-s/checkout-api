import { Router } from "express";
import { formatCents, renderTemplate } from "shared-utils";

export const receiptsRouter = Router();

const DEFAULT_RECEIPT = "Receipt for <%= order.id %>: <%= order.total %>";

/** True when Intl.NumberFormat will accept the code (absent currency is handled by the caller). */
function isIso4217Currency(currency: unknown): currency is string {
  if (typeof currency !== "string" || !/^[A-Za-z]{3}$/.test(currency)) return false;
  try {
    new Intl.NumberFormat("en-US", { style: "currency", currency });
    return true;
  } catch {
    return false;
  }
}

/**
 * POST /api/receipts/preview
 * Lets merchants preview a customised receipt before saving it.
 * Body: { template?: string, order: { id, totalCents, currency? }, options?: object }
 * `order.currency` is the merchant's settlement currency (ISO 4217, default USD).
 * No authentication: used by the public merchant onboarding flow.
 */
receiptsRouter.post("/preview", (req, res) => {
  const { template, order, options } = req.body ?? {};
  if (!order?.id || typeof order.totalCents !== "number") {
    res.status(400).json({ error: "order.id and order.totalCents are required" });
    return;
  }
  // Missing currency stays undefined so formatCents defaults to USD. null, "", and non-ISO codes are invalid.
  if (order.currency !== undefined && !isIso4217Currency(order.currency)) {
    res.status(400).json({ error: "order.currency must be a 3-letter ISO 4217 code, e.g. EUR" });
    return;
  }
  const html = renderTemplate(
    template ?? DEFAULT_RECEIPT,
    { order: { id: order.id, total: formatCents(order.totalCents, order.currency) } },
    options,
  );
  res.json({ html });
});
