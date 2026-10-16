const questionLabelsKa = {
  condition: 'მოწყობილობის მდგომარეობა',
  sim_type: 'SIM-ის ტიპი',
  storage_size: 'მეხსიერების მოცულობა',
  fully_functional: 'მოწყობილობის დანარჩენი ფუნქციები მუშაობს?',
  manual_assessment: 'საჭიროა ადგილზე შემოწმება',
  carrier: 'რომელ ქსელზე მუშაობს?',
  carrier_lock: 'განბლოკილია მოწყობილობა?',
  accessories: 'კომპლექტაცია',
  color: 'ფერი',
  battery_health: 'ბატარეის მდგომარეობა',
};

const answerLabelsKa = {
  'brand new': 'ახალი, გაუხსნელი',
  flawless: 'როგორც ახალი',
  excellent: 'შესანიშნავი',
  'very good': 'კარგი',
  good: 'ნახმარი',
  fair: 'დაზიანებული',
  broken: 'გატეხილი',
  yes: 'დიახ',
  no: 'არა',
  unlocked: 'განბლოკილი',
  locked: 'დაბლოკილი',
  'other carrier': 'სხვა ოპერატორი',
  sim: 'SIM',
  esim: 'eSIM',
  battery: 'ბატარეა სწრაფად ჯდება',
  power: 'არ ირთვება',
  screen: 'ეკრანი გატეხილია',
  camera: 'კამერა არ ფოკუსირდება',
  speaker: 'დინამიკი ხრიალებს',
  port: 'დამტენის პორტი დაზიანებულია',
  'original box': 'ორიგინალი ყუთი',
  'new original headsets': 'ორიგინალი ყურსასმენი',
  'powercable + adapter': 'დამტენი და კაბელი',
};

const questionDisplayLabelsKa = {
  condition: 'რა მდგომარეობაშია?',
  accessories: 'რა მოყვება?',
  storage_size: 'რამდენი აქვს მეხსიერება?',
  carrier: 'რომელ ქსელზე მუშაობს?',
  carrier_lock: 'განბლოკილია მოწყობილობა?',
  fully_functional: 'სრულად მუშაობს მოწყობილობა?',
  sim_type: 'რომელი SIM ტიპისაა?',
};

const conditionDisplay = {
  'brand new': { grade: 'A+', helpKa: 'ლუქი დაუზიანებელია', helpEn: 'Factory sealed' },
  flawless: { grade: 'A+', helpKa: 'ნახმარობის კვალის გარეშე', helpEn: 'No visible signs of use' },
  excellent: { grade: 'A', helpKa: 'მინიმალური ნახმარობის კვალი', helpEn: 'Minimal signs of use' },
  'very good': { grade: 'B', helpKa: 'მცირე ნაკაწრები', helpEn: 'Minor signs of use' },
  good: { grade: 'C', helpKa: 'შესამჩნევი ნახმარობის კვალი', helpEn: 'Visible signs of use' },
  fair: { grade: 'D', helpKa: 'მნიშვნელოვანი დაზიანებები', helpEn: 'Significant wear' },
  broken: { grade: 'E', helpKa: 'შეკეთებას საჭიროებს', helpEn: 'Needs repair' },
};

export const tradeInConditionGrade = (question, answer) => question?.label === 'condition'
  ? conditionDisplay[String(answer?.text || '').trim().toLowerCase()]?.grade || null
  : null;

export const tradeInQuestionText = (question, language) => language === 'ka'
  ? question?.text_ka || questionDisplayLabelsKa[question?.label] || question?.text || ''
  : question?.text || '';

export const tradeInAnswerText = (question, answer, language) => language === 'ka'
  ? tradeInAnswerKa(question, answer)
  : answer?.text || '';

export const tradeInAnswerHelp = (question, answer, language) => {
  const condition = question?.label === 'condition'
    ? conditionDisplay[String(answer?.text || '').trim().toLowerCase()]
    : null;
  return language === 'ka'
    ? answer?.tooltip_ka || condition?.helpKa || answer?.tooltip || ''
    : answer?.tooltip || condition?.helpEn || '';
};

// Make legacy display fallbacks visible and editable in the product pricing editor.
export const hydrateTradeInPricingCopy = (tree) => tree.map((section) => ({
  ...section,
  questions: (section.questions || []).map((question) => ({
    ...question,
    text_ka: question.text_ka || tradeInQuestionText(question, 'ka'),
    answers: (question.answers || []).map((answer) => ({
      ...answer,
      text_ka: answer.text_ka || tradeInAnswerText(question, answer, 'ka'),
      tooltip: answer.tooltip || tradeInAnswerHelp(question, answer, 'en'),
      tooltip_ka: answer.tooltip_ka || tradeInAnswerHelp(question, answer, 'ka'),
    })),
  })),
}));

export const tradeInQuestionKa = (entry) => entry?.question_ka || questionLabelsKa[entry?.label] || entry?.question || entry?.label || '';

export const tradeInAnswerKa = (entry, answer) => answer?.text_ka
  || answerLabelsKa[String(answer?.text || '').trim().toLowerCase()]
  || answer?.text || '';

export const isManualTradeInQuote = (quote) => Array.isArray(quote?.pricing_path)
  && quote.pricing_path.some((entry) => entry?.label === 'manual_assessment');
