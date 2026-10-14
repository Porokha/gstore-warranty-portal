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

export const tradeInQuestionKa = (entry) => entry?.question_ka || questionLabelsKa[entry?.label] || entry?.question || entry?.label || '';

export const tradeInAnswerKa = (entry, answer) => answer?.text_ka
  || answerLabelsKa[String(answer?.text || '').trim().toLowerCase()]
  || answer?.text || '';

export const isManualTradeInQuote = (quote) => Array.isArray(quote?.pricing_path)
  && quote.pricing_path.some((entry) => entry?.label === 'manual_assessment');
