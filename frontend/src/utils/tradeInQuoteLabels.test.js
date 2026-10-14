import { isManualTradeInQuote, tradeInAnswerKa, tradeInQuestionKa } from './tradeInQuoteLabels';

describe('trade-in quote labels', () => {
  it('translates historical entries without Georgian fields', () => {
    expect(tradeInQuestionKa({ label: 'condition', question: 'What is the condition of the phone?' })).toBe('მოწყობილობის მდგომარეობა');
    expect(tradeInAnswerKa({ label: 'condition' }, { text: 'Excellent' })).toBe('შესანიშნავი');
    expect(tradeInQuestionKa({ label: 'manual_assessment', question: 'Manual assessment required' })).toBe('საჭიროა ადგილზე შემოწმება');
    expect(tradeInAnswerKa({ label: 'manual_assessment' }, { text: 'battery' })).toBe('ბატარეა სწრაფად ჯდება');
  });

  it('prefers approved Georgian text stored with the quote', () => {
    expect(tradeInQuestionKa({ label: 'condition', question_ka: 'მდგომარეობა' })).toBe('მდგომარეობა');
    expect(tradeInAnswerKa({}, { text: 'Excellent', text_ka: 'იდეალური' })).toBe('იდეალური');
  });

  it('recognizes requests pending manual assessment', () => {
    expect(isManualTradeInQuote({ pricing_path: [{ label: 'manual_assessment' }] })).toBe(true);
    expect(isManualTradeInQuote({ pricing_path: [{ label: 'condition' }] })).toBe(false);
  });
});
