import { validatePricingTree } from './pricing-tree.validation';

const tree = () => [{
  name: 'Conditions',
  questions: [{ text: 'Condition?', answers: [{ text: 'Good', value: 100, result: 2, go_to: '2,1', value_enabled: 1 }] }],
}, {
  name: 'Details',
  questions: [{ text: 'Carrier?', answers: [{ text: 'Unlocked', value: 0, result: 0, value_enabled: 1 }] }],
}];

describe('validatePricingTree', () => {
  it('accepts editable labels and disabled questions', () => {
    const rules = tree();
    rules[1].questions.push({ text: 'Unused?', enabled: false, answers: [] } as any);
    (rules[1].questions[0] as any).text_ka = 'ოპერატორი?';
    expect(() => validatePricingTree(rules)).not.toThrow();
  });

  it('rejects malformed navigation and invalid prices', () => {
    const rules = tree();
    (rules[0].questions[0].answers[0] as any).go_to = 'later';
    expect(() => validatePricingTree(rules)).toThrow(/section,question target/);
    (rules[0].questions[0].answers[0] as any).go_to = '2,1';
    rules[0].questions[0].answers[0].value = Infinity;
    expect(() => validatePricingTree(rules)).toThrow(/invalid text or value/);
  });

  it('requires a usable entry question', () => {
    const rules = tree();
    (rules[0].questions[0] as any).enabled = false;
    expect(() => validatePricingTree(rules)).toThrow(/first section/);
  });

  it('accepts an explicit manual-review marker without a numeric offer', () => {
    const rules = [{ name: 'Manual Review', questions: [{ text: 'Pricing status', label: 'pricing_status', answers: [{
      text: 'Manual evaluation required', value: '', value_enabled: 0, result: 1,
      attributes: [{ key: 'pricing_status', value: '[manual-review]' }],
    }] }] }];
    expect(() => validatePricingTree(rules)).not.toThrow();
    rules[0].questions[0].answers[0].attributes = [];
    expect(() => validatePricingTree(rules)).toThrow(/enabled answer/);
  });
});
