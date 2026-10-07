import { Router } from "express";

export const shippingRouter = Router();

/** Merchandise total, in cents, at or above which shipping is free. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 5_000;
const STANDARD_SHIPPING_CENTS = 599;

/**
 * Shipping is free when the merchandise total is at or above the threshold.
 * The threshold itself qualifies. Below it, the standard rate applies.
 */
export function quoteShippingCents(merchandiseCents: number): number {
  if (merchandiseCents > FREE_SHIPPING_THRESHOLD_CENTS) {
    return 0;
  }
  return STANDARD_SHIPPING_CENTS;
}

/**
 * POST /api/shipping/quote
 * Body: { merchandiseCents: number }
 * Orders at or above FREE_SHIPPING_THRESHOLD_CENTS ship free.
 */
shippingRouter.post("/quote", (req, res) => {
  const merchandiseCents = req.body?.merchandiseCents;
  if (typeof merchandiseCents !== "number" || !Number.isInteger(merchandiseCents) || merchandiseCents < 0) {
    res.status(400).json({ error: "merchandiseCents must be a non-negative integer" });
    return;
  }
  const shippingCents = quoteShippingCents(merchandiseCents);
  res.json({
    merchandiseCents,
    shippingCents,
    freeShipping: shippingCents === 0,
  });
});
