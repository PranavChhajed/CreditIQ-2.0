import { describe, it, expect } from 'vitest';
import { computeOffer, loadPolicy } from './policy.js';

describe('computeOffer', () => {
  const policy = loadPolicy();

  it('offers the full requested amount when within the income multiplier and cap', () => {
    const offer = computeOffer({
      product: 'personal_loan', grade: 'A1', requestedAmount: 500000,
      requestedTenureMonths: 36, incomeVerified: 100000,
    }, policy);
    expect(offer.outcome).toBe('approve');
    expect(offer.amount).toBe(500000);
    expect(offer.reasonCode).toBeNull();
  });

  it('reduces the offer and flags POL_AMOUNT_REDUCED when eligibility is below the request', () => {
    const offer = computeOffer({
      product: 'personal_loan', grade: 'C1', requestedAmount: 1000000,
      requestedTenureMonths: 36, incomeVerified: 50000,
    }, policy);
    expect(offer.outcome).toBe('approve');
    expect(offer.amount).toBe(200000); // 4x * 50000
    expect(offer.reasonCode).toBe('POL_AMOUNT_REDUCED');
  });

  it('rejects with POL_BELOW_MIN_TICKET when eligible amount is below the product minimum', () => {
    const offer = computeOffer({
      product: 'personal_loan', grade: 'C3', requestedAmount: 100000,
      requestedTenureMonths: 12, incomeVerified: 10000,
    }, policy);
    expect(offer.outcome).toBe('reject');
    expect(offer.reasonCode).toBe('POL_BELOW_MIN_TICKET');
  });

  it('caps the offer at the product ceiling', () => {
    const offer = computeOffer({
      product: 'personal_loan', grade: 'A1', requestedAmount: 2000000,
      requestedTenureMonths: 36, incomeVerified: 500000,
    }, policy);
    expect(offer.amount).toBe(1500000);
  });
});
