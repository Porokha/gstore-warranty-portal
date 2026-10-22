import { hydrateTradeInPricingCopy, isManualTradeInQuote, tradeInAnswerHelp, tradeInAnswerKa, tradeInAnswerText, tradeInConditionGrade, tradeInQuestionKa, tradeInQuestionText } from './tradeInQuoteLabels';

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

  it('uses editable pricing-tree copy before legacy display fallbacks', () => {
    const question = { label: 'condition', text: 'Condition?', text_ka: 'ჩემი კითხვა?' };
    const answer = { text: 'Excellent', text_ka: 'ჩემი პასუხი', tooltip: 'My help', tooltip_ka: 'ჩემი აღწერა' };
    expect(tradeInQuestionText(question, 'ka')).toBe('ჩემი კითხვა?');
    expect(tradeInAnswerText(question, answer, 'ka')).toBe('ჩემი პასუხი');
    expect(tradeInAnswerText(question, answer, 'en')).toBe('Excellent');
    expect(tradeInAnswerHelp(question, answer, 'ka')).toBe('ჩემი აღწერა');
    expect(tradeInAnswerHelp(question, answer, 'en')).toBe('My help');
    expect(tradeInConditionGrade(question, answer)).toBe('A');
  });

  it('assigns condition grades by answer order regardless of edited wording', () => {
    const answers = ['ახალი / Open Box', 'ძალიან კარგი', 'კარგი', 'დამაკმაყოფილებელი', 'დაზიანებული']
      .map((text) => ({ text }));
    const question = { label: 'condition', answers };
    expect(answers.map((answer) => tradeInConditionGrade(question, answer)))
      .toEqual(['Open Box', 'A', 'A-', 'B', 'C']);
    expect(tradeInConditionGrade({ label: 'storage_size', answers }, answers[0])).toBeNull();
  });

  it('prepopulates legacy display copy in the editable JSON tree', () => {
    const tree = [{ name: 'Condition', questions: [{ label: 'condition', text: 'Condition?', answers: [{ text: 'Excellent', value: 100 }] }] }];
    const [question] = hydrateTradeInPricingCopy(tree)[0].questions;
    expect(question.text_ka).toBe('რა მდგომარეობაშია?');
    expect(question.answers[0]).toMatchObject({
      text_ka: 'შესანიშნავი',
      tooltip: 'Minimal signs of use',
      tooltip_ka: 'მინიმალური ნახმარობის კვალი',
      value: 100,
    });
    expect(tree[0].questions[0].text_ka).toBeUndefined();
  });
});
