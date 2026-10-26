/**
 * OpenGuard AI - Demonstration Repository Module
 * Defective Pricing & Discount Calculation Engine
 * 
 * Known Defects in Initial Snapshot:
 * 1. Allows discounts > 100% (leads to negative final price or shop payout)
 * 2. Allows negative discount percentage (causes price inflation)
 * 3. Allows negative base price
 * 4. Fails on NaN / Infinity inputs
 */

export interface DiscountResult {
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
}

export function calculateDiscount(price: number, discountPercent: number): DiscountResult {
  // Deliberately defective baseline implementation:
  // Missing boundary validation for price and discountPercent!
  const discountAmount = (price * discountPercent) / 100;
  const finalPrice = price - discountAmount;

  return {
    originalPrice: price,
    discountPercent,
    discountAmount,
    finalPrice
  };
}
