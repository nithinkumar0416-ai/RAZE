import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDiscount } from '../src/discount.ts';

describe('Discount Calculator - Standard Regression Suite', () => {
  it('applies normal discount correctly (20% off $100)', () => {
    const result = calculateDiscount(100, 20);
    assert.equal(result.originalPrice, 100);
    assert.equal(result.discountPercent, 20);
    assert.equal(result.discountAmount, 20);
    assert.equal(result.finalPrice, 80);
  });

  it('handles zero discount (0% off $50)', () => {
    const result = calculateDiscount(50, 0);
    assert.equal(result.discountAmount, 0);
    assert.equal(result.finalPrice, 50);
  });

  it('handles full 100% discount ($200 with 100% off)', () => {
    const result = calculateDiscount(200, 100);
    assert.equal(result.discountAmount, 200);
    assert.equal(result.finalPrice, 0);
  });

  it('handles fractional percentage (12.5% off $80)', () => {
    const result = calculateDiscount(80, 12.5);
    assert.equal(result.discountAmount, 10);
    assert.equal(result.finalPrice, 70);
  });
});
