export const valuationProgressStep = (phase) => {
  if (phase === 'storage') return 3;
  if (phase === 'question' || phase === 'faults') return 4;
  if (phase === 'range' || phase === 'offer' || phase === 'manual-offer') return 5;
  if (phase === 'contact') return 'contact';
  return null;
};

export const canGoBackWithinValuation = ({ phase, steps, storageOptions, isLaptop, isManualReviewProduct }) => {
  if (phase === 'storage') return false;
  if (phase === 'manual-offer' && isManualReviewProduct && !steps.length) return false;
  if (phase === 'question' && !steps.length && (isLaptop || !storageOptions.length)) return false;
  return true;
};
