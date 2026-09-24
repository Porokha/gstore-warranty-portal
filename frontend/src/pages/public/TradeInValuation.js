import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { tradeInService } from '../../services/tradeInService';

const imageUrl = (value) => {
  if (!value || String(value).includes('image-not-found')) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const path = String(value).replace(/^(\.\.\/)+/, '/').replace(/^\/sell\/media\//, '/media/').replace(/^media\//, '/media/');
  return `/trade-in${path.startsWith('/') ? path : `/${path}`}`;
};

const resolvePointer = (tree, pointer) => {
  if (!pointer || tree?.[pointer.setIndex]?.enabled === false) return null;
  const questions = tree?.[pointer.setIndex]?.questions || [];
  const questionIndex = questions.findIndex((item, index) => index >= pointer.questionIndex && item?.enabled !== false);
  return questionIndex < 0 ? null : { setIndex: pointer.setIndex, questionIndex };
};
const getQuestion = (tree, pointer) => pointer ? tree?.[pointer.setIndex]?.questions?.[pointer.questionIndex] || null : null;
const getPointer = (goTo) => {
  const [setIndex, questionIndex] = String(goTo || '').split(',').map((part) => Number(part) - 1);
  return Number.isInteger(setIndex) && Number.isInteger(questionIndex) && setIndex >= 0 && questionIndex >= 0
    ? { setIndex, questionIndex }
    : null;
};
const amount = (answer) => Number(answer?.value ?? answer?.value_current ?? 0) || 0;
const available = (answer) => answer && ![0, false, '0'].includes(answer.value_enabled) && answer.text;
const money = (value) => `₾${Math.max(0, Math.round(value)).toLocaleString()}`;
const pathEntry = (question, answers, extras = {}) => ({
  question: question?.text,
  label: question?.label,
  answers: answers.map((answer) => ({ text: answer.text, value: amount(answer), attributes: answer.attributes || [] })),
  ...extras,
});

const gradeNames = {
  'brand new': { grade: 'A+', ka: 'ახალი, გაუხსნელი', en: 'Brand new', detailKa: 'ლუქი დაუზიანებელია', detailEn: 'Factory sealed' },
  flawless: { grade: 'A', ka: 'როგორც ახალი', en: 'Flawless', detailKa: 'ნახმარობის კვალის გარეშე', detailEn: 'No visible signs of use' },
  'very good': { grade: 'B', ka: 'კარგი', en: 'Very good', detailKa: 'მცირე ნაკაწრები', detailEn: 'Minor signs of use' },
  good: { grade: 'C', ka: 'ნახმარი', en: 'Good', detailKa: 'შესამჩნევი ნახმარობის კვალი', detailEn: 'Visible signs of use' },
  fair: { grade: 'D', ka: 'დაზიანებული', en: 'Fair', detailKa: 'მნიშვნელოვანი დაზიანებები', detailEn: 'Significant wear' },
  broken: { grade: 'E', ka: 'გატეხილი', en: 'Broken', detailKa: 'შეკეთებას საჭიროებს', detailEn: 'Needs repair' },
};

const answerNames = {
  'Original Box': 'ორიგინალი ყუთი',
  'New Original Headsets': 'ორიგინალი ყურსასმენი',
  'Powercable + Adapter': 'დამტენი და კაბელი',
  Unlocked: 'განბლოკილი',
  Locked: 'დაბლოკილი',
  'Other Carrier': 'სხვა ოპერატორი',
  Yes: 'დიახ',
  No: 'არა',
};

const faultOptions = [
  ['power', 'არ ირთვება', 'Does not turn on'],
  ['screen', 'ეკრანი გატეხილია', 'Screen is broken'],
  ['battery', 'ბატარეა სწრაფად ჯდება', 'Battery drains quickly'],
  ['camera', 'კამერა არ ფოკუსირდება', 'Camera does not focus'],
  ['speaker', 'დინამიკი ხრიალებს', 'Speaker is distorted'],
  ['port', 'დამტენის პორტი დაზიანებულია', 'Charging port is damaged'],
];

function SelectionRow({ selected, onClick, title, subtitle, value, badge, multiple = false, muted = false, icon }) {
  return (
    <button type="button" className={`zzv-trade-answer${selected ? ' is-selected' : ''}${muted ? ' is-muted' : ''}`} aria-pressed={selected} onClick={onClick}>
      {badge && <span className={`zzv-trade-answer-badge zzv-trade-grade-${badge.replace('+', 'plus').toLowerCase()}`}>{badge}</span>}
      {icon && <span className="zzv-trade-answer-icon"><img src={icon} alt="" /></span>}
      <span className="zzv-trade-answer-copy"><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</span>
      {value && <strong className="zzv-trade-answer-value">{value}</strong>}
      <span className={`zzv-trade-answer-control${multiple ? ' is-checkbox' : ''}`} aria-hidden="true" />
    </button>
  );
}

export default function TradeInValuation({ product, t, language, initialStorage = '', initialCondition = '', onProgressChange, backActionRef, onRestart }) {
  const productQuery = useQuery(['trade-in-product', product.slug], () => tradeInService.getProduct(product.slug));
  const gstoreProductsQuery = useQuery('trade-in-gstore-products', tradeInService.getGstoreProducts);
  const detail = productQuery.data || product;
  const tree = Array.isArray(detail.tree) ? detail.tree : [];
  const storageQuestions = tree.filter((set) => set.enabled !== false).flatMap((set) => set.questions || []).filter((question) => question.enabled !== false && question.label === 'storage_size');
  const storageOptions = [...new Set(storageQuestions.flatMap((question) => (question.answers || []).filter(available).map((answer) => answer.text)))];
  const [phase, setPhase] = useState(initialStorage ? 'question' : 'storage');
  const [storage, setStorage] = useState(initialStorage);
  const [pointer, setPointer] = useState({ setIndex: 0, questionIndex: 0 });
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [steps, setSteps] = useState([]);
  const [price, setPrice] = useState(0);
  const [faults, setFaults] = useState([]);
  const [method, setMethod] = useState('cash');
  const [selectedGstoreProductId, setSelectedGstoreProductId] = useState(null);
  const [form, setForm] = useState({ customer_name: '', customer_phone: '' });
  const [error, setError] = useState('');
  const [quote, setQuote] = useState(null);
  const [saving, setSaving] = useState(false);
  const [displayPrice, setDisplayPrice] = useState(0);
  const [manualAssessment, setManualAssessment] = useState(false);

  const question = getQuestion(tree, resolvePointer(tree, pointer));
  const answers = (question?.answers || []).filter(available);
  const isMulti = Number(question?.type || 0) > 0 || question?.type === 'multi' || question?.label === 'accessories';
  const isCondition = question?.label === 'condition';
  const isAccessories = question?.label === 'accessories';
  const cashPrice = Math.max(0, Math.round(price));
  const bonusPercent = Math.max(0, Number(detail.offer_policy?.bonus_percent) || 0);
  const bonusFixed = Math.max(0, Number(detail.offer_policy?.bonus_fixed) || 0);
  const gstoreProducts = gstoreProductsQuery.data || [];
  const selectedGstoreProduct = gstoreProducts.find((item) => item.id === selectedGstoreProductId);
  const gstoreBonus = Math.round(cashPrice * (selectedGstoreProduct?.bonus_percent ?? bonusPercent) / 100 + (selectedGstoreProduct?.bonus_fixed ?? bonusFixed));
  const gstorePrice = cashPrice + gstoreBonus;
  const chosenPrice = method === 'gstore' ? gstorePrice : cashPrice;
  const remainingPrice = selectedGstoreProduct ? Math.max(0, Number(selectedGstoreProduct.price_gel) - gstorePrice) : 0;
  const noExactPrice = manualAssessment;
  const conditionPreview = (answer) => {
    const branchQuestions = (tree[getPointer(answer?.go_to)?.setIndex]?.questions || []).filter((item) => item.enabled !== false);
    const storageAnswer = branchQuestions.find((item) => item.label === 'storage_size')?.answers?.find((item) => item.text === storage);
    return amount(answer) + amount(storageAnswer);
  };
  const pendingStorageAnswer = storage && !steps.some((step) => step.question?.label === 'storage_size')
    ? (tree[getPointer(steps.find((step) => step.question?.label === 'condition')?.answers?.[0]?.go_to)?.setIndex]?.questions || []).filter((item) => item.enabled !== false)
      .find((item) => item.label === 'storage_size')?.answers?.find((item) => item.text === storage)
    : null;
  const summaryPrice = isCondition && selectedIndexes.length
    ? conditionPreview(answers[selectedIndexes[0]])
    : cashPrice ? cashPrice + amount(pendingStorageAnswer) : Number(detail.max_price) || 0;

  useEffect(() => {
    if (question?.label !== 'condition' || !initialCondition) return;
    const index = answers.findIndex((answer) => answer.text === initialCondition);
    if (index >= 0) setSelectedIndexes((current) => current.length ? current : [index]);
  }, [productQuery.data, question?.label, initialCondition]);

  useEffect(() => {
    if (!productQuery.isLoading && !storageOptions.length && phase === 'storage') setPhase('question');
  }, [productQuery.isLoading, storageOptions.length, phase]);

  useEffect(() => {
    const step = phase === 'storage' ? 3 : phase === 'question' && isCondition ? 4 : phase === 'question' ? 5 : phase === 'faults' ? 4 : phase === 'range' ? 5 : phase === 'contact' ? 'contact' : null;
    onProgressChange(step);
  }, [phase, isCondition, onProgressChange]);

  useEffect(() => {
    if (phase !== 'offer') return undefined;
    let frame;
    const started = performance.now();
    const tick = (time) => {
      const progress = Math.min(1, (time - started) / 650);
      setDisplayPrice(Math.round(cashPrice * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    setDisplayPrice(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [cashPrice, phase]);

  const storagePreview = (choice) => {
    const condition = tree.filter((set) => set.enabled !== false).flatMap((set) => set.questions || []).find((item) => item.enabled !== false && item.label === 'condition');
    const candidates = (condition?.answers || []).filter(available).map((answer) => {
      const branch = getPointer(answer.go_to);
      const branchQuestions = (tree[branch?.setIndex]?.questions || []).filter((item) => item.enabled !== false);
      const storageAnswer = branchQuestions.find((item) => item.label === 'storage_size')?.answers?.find((item) => item.text === choice);
      return amount(answer) + amount(storageAnswer);
    });
    return candidates.length ? Math.max(...candidates) : null;
  };

  const possibleConditionPrices = (tree.filter((set) => set.enabled !== false).flatMap((set) => set.questions || []).find((item) => item.enabled !== false && item.label === 'condition')?.answers || [])
    .filter(available)
    .map((answer) => {
      const branchQuestions = (tree[getPointer(answer.go_to)?.setIndex]?.questions || []).filter((item) => item.enabled !== false);
      const storageAnswer = branchQuestions.find((item) => item.label === 'storage_size')?.answers?.find((item) => item.text === storage);
      return amount(answer) + amount(storageAnswer);
    })
    .filter((value) => value > 0);
  const rangeMinimum = possibleConditionPrices.length ? Math.min(...possibleConditionPrices) : 0;
  const rangeMaximum = possibleConditionPrices.length ? Math.max(...possibleConditionPrices) : 0;

  const advance = (chosenAnswers, indexes) => {
    if (!question) return;
    if (question.label === 'storage_size' && chosenAnswers[0]) setStorage(chosenAnswers[0].text);
    setManualAssessment(false);
    let currentPointer = resolvePointer(tree, pointer);
    let currentPrice = price;
    const addedSteps = [];
    let currentAnswers = chosenAnswers;
    let currentIndexes = indexes;
    let nextPointer = null;
    let ending = false;
    let manual = false;

    for (let attempts = 0; attempts < 3; attempts += 1) {
      const currentQuestion = getQuestion(tree, currentPointer);
      const first = currentAnswers[0];
      const result = Number(first?.result ?? 1);
      const before = currentPrice;
      currentPrice = result === 4 ? amount(first) : currentPrice + currentAnswers.reduce((sum, answer) => sum + amount(answer), 0);
      addedSteps.push({ pointer: currentPointer, indexes: currentIndexes, priceBefore: before, question: currentQuestion, answers: currentAnswers, auto: attempts > 0 });
      manual = result === 3;
      nextPointer = result === 1 || !first
        ? { setIndex: currentPointer.setIndex, questionIndex: currentPointer.questionIndex + 1 }
        : result === 2 ? getPointer(first.go_to) : null;
      nextPointer = resolvePointer(tree, nextPointer);
      const nextQuestion = getQuestion(tree, nextPointer);
      ending = !nextQuestion || result === 0 || result === 3 || result === 4;
      if (ending || nextQuestion.label !== 'storage_size' || !storage) break;
      const storageAnswer = (nextQuestion.answers || []).find((answer) => available(answer) && answer.text === storage);
      if (!storageAnswer) break;
      currentPointer = nextPointer;
      currentAnswers = [storageAnswer];
      currentIndexes = [(nextQuestion.answers || []).filter(available).findIndex((answer) => answer.text === storage)];
    }

    setSteps((current) => [...current, ...addedSteps]);
    setPrice(currentPrice);
    setSelectedIndexes([]);
    setError('');
    if (ending) {
      setManualAssessment(manual || currentPrice <= 0);
      setPhase(manual || currentPrice <= 0 ? 'manual-offer' : 'offer');
    }
    else setPointer(nextPointer);
  };

  const previous = () => {
    setError('');
    if (phase === 'contact') return setPhase(noExactPrice ? (faults.length ? 'range' : 'manual-offer') : 'offer');
    if (phase === 'range') return setPhase('faults');
    if (phase === 'faults') return setPhase('question');
    if (phase === 'storage') return;
    if (!steps.length) return setPhase(storageOptions.length ? 'storage' : 'question');
    let lastVisibleIndex = steps.length - 1;
    while (lastVisibleIndex >= 0 && steps[lastVisibleIndex].auto) lastVisibleIndex -= 1;
    const last = steps[lastVisibleIndex];
    if (!last) return setPhase(storageOptions.length ? 'storage' : 'question');
    setSteps(steps.slice(0, lastVisibleIndex));
    setPointer(last.pointer);
    setSelectedIndexes(last.indexes);
    setPrice(last.priceBefore);
    setManualAssessment(false);
    setPhase('question');
  };

  const restart = () => {
    setPhase(initialStorage ? 'question' : 'storage');
    setStorage(initialStorage);
    setPointer({ setIndex: 0, questionIndex: 0 });
    setSelectedIndexes([]);
    setSteps([]);
    setPrice(0);
    setFaults([]);
    setMethod('cash');
    setSelectedGstoreProductId(null);
    setManualAssessment(false);
    setError('');
  };

  useEffect(() => {
    if (!backActionRef) return undefined;
    backActionRef.current = () => {
      if (phase === 'storage') return false;
      previous();
      return true;
    };
    return () => { backActionRef.current = null; };
  });

  const submit = async (event) => {
    event.preventDefault();
    const name = form.customer_name.trim();
    const phone = form.customer_phone.replace(/\s+/g, '');
    if (!name || !/^(?:\+?995)?5\d{8}$/.test(phone)) {
      setError(language === 'ka' ? 'შეიყვანე სახელი, გვარი და სწორი ტელეფონის ნომერი.' : 'Enter your full name and a valid phone number.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const pricingPath = steps.map((step) => pathEntry(step.question, step.answers));
      if (storage && !pricingPath.some((step) => step.label === 'storage_size')) {
        pricingPath.push({ question: 'Storage selected for manual review', label: 'storage_size', answers: [{ text: storage, value: 0, attributes: [] }] });
      }
      if (noExactPrice) pricingPath.push({ question: 'Manual assessment required', label: 'manual_assessment', answers: faults.map((key) => ({ text: key, value: 0, attributes: [] })) });
      pricingPath.push({ question: 'Fulfillment', label: 'fulfillment_method', answers: [{ text: method, value: method === 'gstore' ? gstoreBonus : 0, attributes: [] }] });
      const result = await tradeInService.createQuote({
        product_slug: detail.slug,
        final_price: noExactPrice ? 0 : cashPrice,
        gstore_product_id: method === 'gstore' ? selectedGstoreProduct?.id : undefined,
        customer_name: name,
        customer_phone: phone,
        pricing_path: pricingPath,
      });
      setQuote(result);
      setPhase('success');
    } catch (submitError) {
      setError(t('public.tradeIn.quoteError'));
    } finally {
      setSaving(false);
    }
  };

  if (productQuery.isLoading) return <div className="zzv-trade-flow-loading">{language === 'ka' ? 'მოწყობილობა იტვირთება...' : 'Loading device...'}</div>;
  if (productQuery.isError || !tree.length) return <div className="zzv-trade-flow-loading">{language === 'ka' ? 'ამ მოწყობილობის შეფასება დროებით მიუწვდომელია.' : 'Valuation is temporarily unavailable for this device.'}</div>;

  if (phase === 'success') return (
    <div className="zzv-trade-success">
      <div className="zzv-trade-success-mark">✓</div>
      <h1>{language === 'ka' ? 'მოთხოვნა მიღებულია' : 'Request received'}</h1>
      <p>{language === 'ka' ? 'დაგირეკავთ სამუშაო საათებში და ერთად შევათანხმებთ დროსა და ფილიალს.' : 'We will call during business hours to arrange a time and location.'}</p>
      <div className="zzv-trade-success-details">
        <div><span>{language === 'ka' ? 'მოწყობილობა' : 'Device'}</span><strong>{detail.name}</strong></div>
        <div><span>{language === 'ka' ? 'შეთავაზება' : 'Offer'}</span><strong>{noExactPrice ? (language === 'ka' ? 'შემოწმების შემდეგ' : 'After inspection') : money(quote?.offer_credit ?? chosenPrice)}</strong></div>
        <div><span>{language === 'ka' ? 'მიღების ფორმა' : 'Preferred option'}</span><strong>{method === 'gstore' ? 'Gstore Trade-in' : (language === 'ka' ? 'თანხა ხელზე' : 'Cash')}</strong></div>
        {selectedGstoreProduct && <div><span>{language === 'ka' ? 'არჩეული პროდუქტი' : 'Selected product'}</span><strong>{selectedGstoreProduct.name}</strong></div>}
        {selectedGstoreProduct && <div><span>{language === 'ka' ? 'დამატებით გადასახდელი' : 'Remaining to pay'}</span><strong>{money(quote?.remaining_price ?? remainingPrice)}</strong></div>}
        <div><span>{language === 'ka' ? 'სახელი და გვარი' : 'Name'}</span><strong>{form.customer_name}</strong></div>
        <div><span>{language === 'ka' ? 'ტელეფონი' : 'Phone'}</span><strong>{form.customer_phone}</strong></div>
        {quote?.quote_number && <div><span>{language === 'ka' ? 'მოთხოვნის №' : 'Request no.'}</span><strong>{quote.quote_number}</strong></div>}
      </div>
      <a className="zzv-trade-primary" href="https://www.google.com/maps/search/?api=1&query=ZEZVA+Tbilisi" target="_blank" rel="noreferrer">{language === 'ka' ? 'რუკაზე ნახვა' : 'View on map'}</a>
      <Link className="zzv-trade-text-button" to="/">{language === 'ka' ? 'მთავარზე დაბრუნება' : 'Back to home'}</Link>
    </div>
  );

  return (
    <div className={`zzv-trade-flow zzv-trade-flow--${phase}${isCondition && phase === 'question' ? ' zzv-trade-flow--condition' : ''}${isAccessories && phase === 'question' ? ' zzv-trade-flow--accessories' : ''}`}>
      {phase === 'offer' && <h1 className="zzv-trade-mobile-offer-title">{language === 'ka' ? 'შენი შეთავაზება' : 'Your offer'}</h1>}
      <aside className="zzv-trade-summary">
        <div className="zzv-trade-summary-image">{imageUrl(detail.image_src) && <img src={imageUrl(detail.image_src)} alt={detail.name} />}</div>
        <h2>{detail.name}</h2>
        <p>{detail.brand}</p>
        {storage && <span className="zzv-trade-summary-badge">{storage}</span>}
        {!noExactPrice && <div className="zzv-trade-summary-price"><span>{language === 'ka' ? 'მიმდინარე შეფასება' : 'Current estimate'}</span><strong>{money(summaryPrice)}</strong></div>}
      </aside>
      <section className="zzv-trade-flow-panel">
        {phase === 'storage' && <>
          <h1>{language === 'ka' ? storageQuestions[0]?.text_ka || 'რამდენი აქვს მეხსიერება?' : storageQuestions[0]?.text || 'How much storage does it have?'}</h1>
          <div className="zzv-trade-answer-list">
            {storageOptions.map((choice) => <SelectionRow key={choice} selected={storage === choice} onClick={() => setStorage(choice)} title={choice} value={storagePreview(choice) === null ? null : `${t('public.tradeIn.upTo')} ${money(storagePreview(choice))}`} />)}
          </div>
          {error && <p className="zzv-trade-error">{error}</p>}
          <button className="zzv-trade-primary" type="button" onClick={() => storage ? (setError(''), setPhase('question')) : setError(t('public.tradeIn.answerRequired'))}>{t('public.tradeIn.continue')}</button>
        </>}

        {phase === 'question' && question && <>
          <h1>{language === 'ka' ? question.text_ka || (isCondition ? 'რა მდგომარეობაშია?' : isAccessories ? 'რა მოყვება?' : ({ carrier: 'რომელ ქსელზე მუშაობს?', carrier_lock: 'განბლოკილია მოწყობილობა?', fully_functional: 'სრულად მუშაობს მოწყობილობა?' })[question.label] || question.text) : question.text}</h1>
          {isAccessories && <p className="zzv-trade-flow-hint">{language === 'ka' ? 'მონიშნე ყველაფერი, რაც მოყვება. შეგიძლია არცერთი არ მონიშნო.' : 'Select everything included, or continue without selecting any.'}</p>}
          {isCondition && <small className="zzv-trade-group-label">{language === 'ka' ? 'მდგომარეობა' : 'Condition'}</small>}
          <div className="zzv-trade-answer-list">
            {answers.map((answer, index) => {
              const grade = isCondition ? gradeNames[answer.text.toLowerCase()] : null;
              const accessoryIcon = isAccessories ? (/box/i.test(answer.text) ? '/figma-home/trade-accessory-box.svg' : /cable|adapter/i.test(answer.text) ? '/figma-home/imgIconPlug.svg' : '/figma-home/imgIconSmartphone.svg') : null;
              return <SelectionRow key={`${answer.text}-${index}`} selected={selectedIndexes.includes(index)} onClick={() => setSelectedIndexes((current) => isMulti ? current.includes(index) ? current.filter((item) => item !== index) : [...current, index] : [index])} title={language === 'ka' ? answer.text_ka || (grade ? grade.ka : answerNames[answer.text] || answer.text) : grade ? grade.en : answer.text} subtitle={language === 'ka' ? answer.tooltip_ka || (grade ? grade.detailKa : answer.tooltip) : answer.tooltip || (grade ? grade.detailEn : null)} badge={grade?.grade} icon={accessoryIcon} multiple={isMulti} value={isCondition ? money(conditionPreview(answer)) : amount(answer) ? `${amount(answer) > 0 ? '+' : '-'}${money(Math.abs(amount(answer)))}` : null} />;
            })}
            {isCondition && <SelectionRow selected={false} onClick={() => { setFaults([]); setManualAssessment(true); setPhase('faults'); }} title={language === 'ka' ? 'არ ვიცი — ჩვენ შევაფასებთ' : 'Not sure — we will assess it'} subtitle={language === 'ka' ? 'ფასის დიაპაზონს მიიღებ' : 'Get an estimated price range'} muted />}
          </div>
          {error && <p className="zzv-trade-error">{error}</p>}
          <button className="zzv-trade-primary" type="button" onClick={() => { if (!selectedIndexes.length && !isMulti) return setError(t('public.tradeIn.answerRequired')); advance(selectedIndexes.map((index) => answers[index]).filter(Boolean), selectedIndexes); }}>{isAccessories ? (language === 'ka' ? 'შეაფასე' : 'See estimate') : t('public.tradeIn.continue')}</button>
          {steps.length > 0 && <button className="zzv-trade-text-button" type="button" onClick={previous}>{t('public.tradeIn.previous')}</button>}
        </>}

        {phase === 'faults' && <>
          <h1>{language === 'ka' ? 'რა არ მუშაობს?' : 'What does not work?'}</h1>
          <p className="zzv-trade-flow-hint">{language === 'ka' ? 'მონიშნე ყველაფერი, რაც არ მუშაობს. თუ ყველაფერი წესრიგშია — არაფერი მონიშნო.' : 'Select everything that does not work. If everything works, leave all unchecked.'}</p>
          <div className="zzv-trade-answer-list">{faultOptions.map(([key, ka, en]) => <SelectionRow key={key} title={language === 'ka' ? ka : en} multiple selected={faults.includes(key)} onClick={() => setFaults((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])} />)}</div>
          <p className="zzv-trade-flow-hint">{language === 'ka' ? 'სია დროებითია — საბოლოო შეფასება დათვალიერების შემდეგ ხდება.' : 'This is preliminary. Final assessment follows inspection.'}</p>
          <button className="zzv-trade-primary" type="button" onClick={() => setPhase('range')}>{t('public.tradeIn.continue')}</button>
          <button className="zzv-trade-text-button" type="button" onClick={previous}>{t('public.tradeIn.previous')}</button>
        </>}

        {phase === 'range' && <>
          <h1>{language === 'ka' ? 'შენი ტელეფონი ღირს' : 'Your phone could be worth'}</h1>
          {rangeMaximum > 0 && <div className="zzv-trade-range"><strong>{money(rangeMinimum)}</strong><strong>{money(rangeMaximum)}</strong><span className="zzv-trade-range-bar" /><small>{language === 'ka' ? 'მინიმუმი' : 'Minimum'}</small><small>{language === 'ka' ? 'მაქსიმუმი' : 'Maximum'}</small></div>}
          <p className="zzv-trade-flow-hint">{language === 'ka' ? 'ეს მხოლოდ სავარაუდო დიაპაზონია. ზუსტ თანხას მოწყობილობის დათვალიერების შემდეგ დაგიდასტურებთ.' : 'This is only an indicative range. We confirm the amount after inspecting the device.'}</p>
          <div className="zzv-trade-range-actions"><button className="zzv-trade-primary" type="button" onClick={() => setPhase('contact')}>{language === 'ka' ? 'მიიღე შეთავაზება' : 'Request an offer'}</button><button className="zzv-trade-secondary" type="button" onClick={previous}>{t('public.tradeIn.changeAnswers')}</button></div>
        </>}

        {phase === 'manual-offer' && <>
          <h1>{language === 'ka' ? 'შეფასებას ერთად დავასრულებთ' : 'Let us complete the assessment together'}</h1>
          <p className="zzv-trade-flow-hint">{language === 'ka' ? 'ზუსტ თანხას მოწყობილობის შემოწმების შემდეგ დაგიდასტურებთ. დატოვე ნომერი და კონსულტანტი დაგიკავშირდება.' : 'We will confirm the exact amount after inspecting the device. Leave your number and we will call you.'}</p>
          <button className="zzv-trade-primary" type="button" onClick={() => setPhase('contact')}>{language === 'ka' ? 'მიიღე შეთავაზება' : 'Request an offer'}</button>
          <button className="zzv-trade-text-button" type="button" onClick={previous}>{t('public.tradeIn.changeAnswers')}</button>
        </>}

        {phase === 'offer' && <>
          <h1>{language === 'ka' ? 'შენი შეთავაზება' : 'Your offer'}</h1>
          <button type="button" aria-pressed={method === 'cash'} className={`zzv-trade-cash-offer${method === 'cash' ? ' is-selected' : ''}`} onClick={() => { setMethod('cash'); setSelectedGstoreProductId(null); }}><span>{language === 'ka' ? 'მიიღებ ხელზე' : 'Cash in hand'}</span><strong>{money(displayPrice)}</strong><small>{language === 'ka' ? 'ფილიალში, შემოწმების შემდეგ' : 'After inspection in store'}</small></button>
          <div className={`zzv-trade-gstore-offer${method === 'gstore' ? ' is-selected' : ''}`}>
            <div className="zzv-trade-gstore-head"><img src="/figma-home/imgGstoreBrandColor.svg" alt="Gstore" /><span>{language === 'ka' ? 'ან ახალ ტექნიკაში' : 'Or toward a new device'}</span><div className="zzv-trade-gstore-credit"><strong>{money(gstorePrice)}</strong>{gstoreBonus > 0 && <small>+{money(gstoreBonus)}</small>}</div></div>
            {gstoreProductsQuery.isLoading ? <p className="zzv-trade-gstore-loading">{language === 'ka' ? 'პროდუქტები იტვირთება...' : 'Loading products...'}</p> : gstoreProducts.length ? <div className="zzv-trade-gstore-products">{gstoreProducts.map((item) => <button type="button" key={item.id} aria-pressed={selectedGstoreProductId === item.id} className={`zzv-trade-gstore-product${selectedGstoreProductId === item.id ? ' is-selected' : ''}`} onClick={() => { setMethod('gstore'); setSelectedGstoreProductId(item.id); }}><span className="zzv-trade-gstore-product-image"><img src={item.image_url} alt="" /></span><strong>{item.name}</strong>{item.subtitle && <small>{item.subtitle}</small>}<span className="zzv-trade-gstore-product-price">{money(item.price_gel)}</span></button>)}</div> : gstoreProductsQuery.isError ? <p className="zzv-trade-gstore-loading">{language === 'ka' ? 'პროდუქტები დროებით მიუწვდომელია' : 'Products are temporarily unavailable'}</p> : <button type="button" className="zzv-trade-gstore-generic" onClick={() => setMethod('gstore')}>{language === 'ka' ? 'Gstore კრედიტის არჩევა' : 'Choose Gstore credit'}</button>}
            {selectedGstoreProduct && <p className="zzv-trade-gstore-remaining">{language === 'ka' ? 'პროდუქტის ფასი' : 'Product price'} {money(selectedGstoreProduct.price_gel)} · {language === 'ka' ? 'დამატებით გადასახდელი' : 'Remaining to pay'} <strong>{money(remainingPrice)}</strong></p>}
          </div>
          <div className="zzv-trade-offer-actions"><button className="zzv-trade-primary" type="button" onClick={() => setPhase('contact')}>{t('public.tradeIn.getThisOffer')}</button><button className="zzv-trade-secondary" type="button" onClick={onRestart || restart}>{language === 'ka' ? 'დაიწყე თავიდან' : 'Start over'}</button></div>
        </>}

        {phase === 'contact' && <form className="zzv-trade-contact" onSubmit={submit}>
          <h1>{language === 'ka' ? 'დაგვიტოვე ნომერი' : 'Leave your number'}</h1>
          <p className="zzv-trade-flow-hint">{language === 'ka' ? 'კონსულტანტი დაგირეკავს და ერთად შევათანხმებთ დროსა და ფილიალს.' : 'A consultant will call you to arrange a time and location.'}</p>
          <div className="zzv-trade-contact-total"><div><span>{language === 'ka' ? 'მოწყობილობა' : 'Device'}</span><strong>{detail.name}{storage ? ` · ${storage}` : ''}</strong></div><div><span>{language === 'ka' ? 'შეთავაზება' : 'Offer'}</span><strong>{noExactPrice ? (language === 'ka' ? 'შემოწმების შემდეგ' : 'After inspection') : money(chosenPrice)}</strong></div>{selectedGstoreProduct && <div><span>{selectedGstoreProduct.name}</span><strong>{language === 'ka' ? 'დამატებით' : 'Remaining'} {money(remainingPrice)}</strong></div>}</div>
          <div className="zzv-trade-contact-fields"><label>{t('public.tradeIn.fullName')}<input value={form.customer_name} onChange={(event) => setForm((current) => ({ ...current, customer_name: event.target.value }))} placeholder={language === 'ka' ? 'სახელი გვარი' : 'Full name'} autoComplete="name" required /></label><label>{t('public.tradeIn.phone')}<input value={form.customer_phone} onChange={(event) => setForm((current) => ({ ...current, customer_phone: event.target.value }))} placeholder="5XX XXX XXX" autoComplete="tel" type="tel" required /></label></div>
          {error && <p className="zzv-trade-error" role="alert">{error}</p>}
          <button className="zzv-trade-primary" type="submit" disabled={saving}>{saving ? (language === 'ka' ? 'იგზავნება...' : 'Sending...') : (language === 'ka' ? 'გაგზავნა' : 'Send request')}</button>
          <button className="zzv-trade-text-button" type="button" onClick={previous}>{t('public.tradeIn.previous')}</button>
        </form>}
      </section>
    </div>
  );
}
