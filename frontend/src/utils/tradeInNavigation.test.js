import { canGoBackWithinValuation, valuationProgressStep } from './tradeInNavigation';

describe('trade-in navigation', () => {
  test('keeps every valuation question at step four until the offer', () => {
    expect(valuationProgressStep('storage')).toBe(3);
    expect(valuationProgressStep('question')).toBe(4);
    expect(valuationProgressStep('faults')).toBe(4);
    expect(valuationProgressStep('offer')).toBe(5);
    expect(valuationProgressStep('manual-offer')).toBe(5);
  });

  test('returns to the product list from the first MacBook question', () => {
    expect(canGoBackWithinValuation({ phase: 'question', steps: [], storageOptions: ['1TB'], isLaptop: true })).toBe(false);
  });

  test('returns to storage from the first phone question', () => {
    expect(canGoBackWithinValuation({ phase: 'question', steps: [], storageOptions: ['128GB'], isLaptop: false })).toBe(true);
  });

  test('moves back inside valuation after answering a question', () => {
    expect(canGoBackWithinValuation({ phase: 'question', steps: [{}], storageOptions: [], isLaptop: true })).toBe(true);
  });

  test('returns manual-review models to the product list', () => {
    expect(canGoBackWithinValuation({ phase: 'manual-offer', steps: [], storageOptions: [], isLaptop: true, isManualReviewProduct: true })).toBe(false);
  });
});
