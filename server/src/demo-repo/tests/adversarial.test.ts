import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDiscount } from '../src/discount.ts';

describe('Adversarial Boundary & Counterexample Tests', () => {
  it('rejects discount percentage exceeding 100% (150%)', () => {
    assert.throws(
      () => calculateDiscount(100, 150),
      /Discount percentage cannot exceed 100%/
    );
  });

  it('rejects negative discount percentage (-20%)', () => {
    assert.throws(
      () => calculateDiscount(100, -20),
      /Discount percentage cannot be negative/
    );
  });

  it('rejects negative base price (-50)', () => {
    assert.throws(
      () => calculateDiscount(-50, 10),
      /Price cannot be negative/
    );
  });

  it('rejects NaN discount percentage', () => {
    assert.throws(
      () => calculateDiscount(100, NaN),
      /Discount percentage must be a valid finite number/
    );
  });

  it('rejects NaN base price', () => {
    assert.throws(
      () => calculateDiscount(NaN, 15),
      /Price must be a valid finite number/
    );
  });

  it('rejects Infinity base price or discount', () => {
    assert.throws(
      () => calculateDiscount(100, Infinity),
      /Discount percentage must be a valid finite number/
    );
  });
});
