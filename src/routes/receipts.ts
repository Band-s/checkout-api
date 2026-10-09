import { Router } from "express";
import { formatCents, renderTemplate } from "shared-utils";

export const receiptsRouter = Router();

const DEFAULT_RECEIPT = "Receipt for <%= order.id %>: <%= order.total %>";

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
  if (order.currency === null) {
    res.status(400).json({ error: "order.currency must be a valid ISO 4217 currency code" });
    return;
  }
  const html = renderTemplate(
    template ?? DEFAULT_RECEIPT,
    { order: { id: order.id, total: formatCents(order.totalCents, order.currency) } },
    options,
  );
  res.json({ html });
});
