import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Grade, Product } from '@creditiq/shared';

export interface Policy {
  version: string;
  products: Record<Product, { min_amount: number; max_amount: number; max_tenure_months: number; foir_cap: number }>;
  grades: Record<string, { income_multiplier: number; tenure_factor: number; rate_pct: number }>;
}

/** Loaded at runtime from config/policy/v1.json — never imported as a TS module (spec §7, PRD G5/N6). */
export function loadPolicy(): Policy {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = resolve(here, '../../../config/policy/v1.json');
  return JSON.parse(readFileSync(path, 'utf-8')) as Policy;
}

export interface OfferInput {
  product: Product;
  grade: Grade;
  requestedAmount: number;
  requestedTenureMonths: number;
  incomeVerified: number;
}

export interface OfferResult {
  outcome: 'approve' | 'reject';
  amount: number | null;
  tenureMonths: number | null;
  ratePct: number | null;
  reasonCode: 'POL_AMOUNT_REDUCED' | 'POL_BELOW_MIN_TICKET' | null;
}

export function computeOffer(input: OfferInput, policy: Policy): OfferResult {
  const productPolicy = policy.products[input.product];
  const gradePolicy = policy.grades[input.grade];
  if (!productPolicy || !gradePolicy) {
    return { outcome: 'reject', amount: null, tenureMonths: null, ratePct: null, reasonCode: 'POL_BELOW_MIN_TICKET' };
  }

  const eligible = input.incomeVerified * gradePolicy.income_multiplier;
  const uncapped = Math.min(input.requestedAmount, eligible);
  const amount = Math.min(uncapped, productPolicy.max_amount);

  if (amount < productPolicy.min_amount) {
    return { outcome: 'reject', amount: null, tenureMonths: null, ratePct: null, reasonCode: 'POL_BELOW_MIN_TICKET' };
  }

  const tenureMonths = Math.min(
    input.requestedTenureMonths,
    Math.round(productPolicy.max_tenure_months * gradePolicy.tenure_factor),
  );

  return {
    outcome: 'approve',
    amount,
    tenureMonths,
    ratePct: gradePolicy.rate_pct,
    reasonCode: amount < input.requestedAmount ? 'POL_AMOUNT_REDUCED' : null,
  };
}
