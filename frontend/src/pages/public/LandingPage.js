import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AddRounded, ExpandMoreRounded, RemoveRounded } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { tradeInService } from '../../services/tradeInService';

const asset = (name) => `/figma-home/${name}`;

const kpis = [
  ['2,700+', 'ნაწილი'],
  ['1,200+', 'შეკეთება'],
  ['4.9', '218 შეფასება'],
];

const steps = [
  ['01', 'აირჩიე მოწყობილობა', 'მიუთითე მოდელი, მეხსიერება და მდგომარეობა.', 'imgImage347.png'],
  ['02', 'შეაფასე ონლაინ', 'ნახე ფასის დიაპაზონი მომენტალურად, ვიზიტის გარეშე.', 'imgImage348.png'],
  ['03', 'მიიღე შეთავაზება', 'გადაცვლე ტექნიკა ნაღდ ფულში ან ჯისთორის ახალ ტექნიკაში.', 'imgImage349.png'],
];

const partIcons = [
  ['ეკრანი', 'imgIconSmartphone.svg', '840'],
  ['ელემენტი', 'imgIconBattery.svg', '840'],
  ['კამერა', 'imgIconCamera.svg', '840'],
  ['დინამიკი', 'imgIconVolume2.svg', '840'],
  ['დედაპლატა', 'imgIconCpu.svg', '620'],
  ['დამტენი', 'imgIconPlug.svg', '620'],
];

const faqItems = [
  ['გატეხილ ტელეფონს იბარებთ?', 'დიახ, გატეხილ ტელეფონსაც ვიბარებთ.'],
  ['რამდენ ხანში მივიღებ თანხას?', 'ონლაინ შეფასების შემდეგ ჩვენი გუნდი დაგიკავშირდება. საბოლოო თანხასა და მიღების დროს მოწყობილობის შემოწმების შემდეგ დაგიდასტურებთ.'],
  ['ონლაინ ფასი საბოლოოა?', 'ონლაინ ფასი წინასწარი შეთავაზებაა. საბოლოო ფასი მოწყობილობის რეალური მდგომარეობის შემოწმების შემდეგ დასტურდება.'],
  ['რა დოკუმენტი მჭირდება?', 'მოწყობილობის ჩაბარებისას დაგჭირდება პირადობის დამადასტურებელი დოკუმენტი. დამატებით დეტალებს ჩვენი გუნდი დაგიდასტურებს.'],
];

const footerLinks = [
  ['Trade-in', '/trade-in'],
  ['მაღაზია', '/shop'],
  ['გარანტია', '/warranty-service?tab=warranty'],
  ['სერვისი', '/warranty-service?tab=case'],
];

function ButtonLink({ to, variant = 'primary', children }) {
  return (
    <Link className={`zzv-figma-btn zzv-figma-btn--${variant}`} to={to}>
      {children}
    </Link>
  );
}

function BrandPair() {
  return (
    <div className="zzv-figma-brand-pair" aria-hidden="true">
      <img src={asset('imgZezvaBrandColor.svg')} alt="" />
      <span>×</span>
      <img src={asset('imgGstoreBrandColor.svg')} alt="" />
    </div>
  );
}

function HeroDropdown({ label, value, options, placeholder, onChange, disabled = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [open]);

  return (
    <div className={`zzv-figma-select-field zzv-figma-dropdown ${className}`} ref={rootRef}>
      <span>{label}</span>
      <button type="button" className={`zzv-figma-select${!value ? ' is-muted' : ''}`} aria-label={label} aria-expanded={open} aria-haspopup="listbox" disabled={disabled} onClick={() => setOpen(!open)}>
        <span>{options.find((option) => option.value === value)?.label || placeholder}</span>
        <ExpandMoreRounded aria-hidden="true" />
      </button>
      {open && (
        <div className="zzv-figma-dropdown-list" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button key={option.value} type="button" role="option" aria-selected={value === option.value} onClick={() => { onChange(option.value); setOpen(false); }}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StepCard({ step }) {
  return (
    <article className="zzv-figma-step">
      <span className="zzv-figma-step-number">{step[0]}</span>
      <div className="zzv-figma-step-visual">
        <img src={asset(step[3])} alt="" />
      </div>
      <div className="zzv-figma-step-caption">
        <strong>{step[1]}</strong>
        <span>{step[2]}</span>
      </div>
    </article>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const [lookupTab, setLookupTab] = useState('warranty');
  const [lookupCode, setLookupCode] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [heroBrand, setHeroBrand] = useState('');
  const [heroSearch, setHeroSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [heroProduct, setHeroProduct] = useState(null);
  const [heroStorage, setHeroStorage] = useState('');
  const [heroCondition, setHeroCondition] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const modelRef = useRef(null);
  const [openFaq, setOpenFaq] = useState(() => (typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches ? 0 : null));
  const brandsQuery = useQuery(['trade-in-brands', 'phone'], () => tradeInService.getBrands('phone'));
  const modelsQuery = useQuery(
    ['home-trade-in-models', heroBrand, debouncedSearch],
    () => tradeInService.getProducts({ category: 'phone', brand: heroBrand, q: debouncedSearch || undefined, page: 1, limit: 50 }),
    { enabled: Boolean(heroBrand && modelOpen) },
  );
  const productDetailQuery = useQuery(
    ['home-trade-in-product', heroProduct?.slug],
    () => tradeInService.getProduct(heroProduct.slug),
    { enabled: Boolean(heroProduct?.slug) },
  );
  const productTree = Array.isArray(productDetailQuery.data?.tree) ? productDetailQuery.data.tree : [];
  const questions = productTree.flatMap((set) => set.questions || []);
  const storageOptions = [...new Set(questions.filter((question) => question.label === 'storage_size')
    .flatMap((question) => (question.answers || []).filter((answer) => String(answer.value_enabled ?? 1) !== '0').map((answer) => answer.text)))].map((value) => ({ value, label: value }));
  const conditionLabels = { 'Brand New': 'ახალი, გაუხსნელი', Flawless: 'როგორც ახალი', 'Very Good': 'კარგი', Good: 'ნახმარი', Fair: 'დაზიანებული', Broken: 'გატეხილი' };
  const conditionOptions = (questions.find((question) => question.label === 'condition')?.answers || [])
    .filter((answer) => String(answer.value_enabled ?? 1) !== '0')
    .map((answer) => ({ value: answer.text, label: conditionLabels[answer.text] || answer.text }));

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(heroSearch.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [heroSearch]);

  useEffect(() => {
    if (!modelOpen) return undefined;
    const closeOutside = (event) => {
      if (!modelRef.current?.contains(event.target)) setModelOpen(false);
    };
    const closeEscape = (event) => {
      if (event.key === 'Escape') setModelOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [modelOpen]);

  const beginEstimate = () => navigate('/trade-in', {
    state: heroProduct
      ? { preselectedProduct: heroProduct, preselectedBrand: heroBrand, preselectedStorage: heroStorage, preselectedCondition: heroCondition }
      : { preselectedBrand: heroBrand },
  });

  const submitLookup = (event) => {
    event.preventDefault();
    if (!lookupCode.trim() || !lookupPhone.trim()) return;
    navigate(lookupTab === 'case' ? '/search/case' : '/search/warranty', {
      state: lookupTab === 'case'
        ? { caseNumber: lookupCode.trim(), phone: lookupPhone.trim() }
        : { warrantyId: lookupCode.trim(), phone: lookupPhone.trim() },
    });
  };

  return (
    <main className="zzv-figma-home">
      <section className="zzv-figma-hero">
        <div className="zzv-figma-pattern" aria-hidden="true" />
        <div className="zzv-figma-wrap zzv-figma-hero-grid">
          <div className="zzv-figma-hero-copy">
            <div className="zzv-figma-partner">
              <img src={asset('imgLayer1.svg')} alt="" />
              <span>ოფიციალური პარტნიორი</span>
            </div>
            <h1>
              ჩააბარე ძველი <span>მიიღე ახალი</span>
            </h1>
            <p>ან აიღე თანხა ხელზე — არჩევანი შენზეა, გატეხილსაც ვიბარებთ.</p>
            <div className="zzv-figma-actions">
              <ButtonLink to="/trade-in">დაიწყე შეფასება</ButtonLink>
              <ButtonLink to="/warranty-service" variant="secondary">
                სერვისი და გარანტია
              </ButtonLink>
            </div>
            <div className="zzv-figma-kpis">
              {kpis.map(([value, label], index) => (
                <React.Fragment key={value}>
                  {index > 0 && <i />}
                  <div>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <aside className="zzv-figma-selector">
            <h2>შეაფასე შენი მოწყობილობა</h2>
            <div className="zzv-figma-selector-grid">
              <HeroDropdown label="ბრენდი" value={heroBrand} options={(brandsQuery.data || []).map((item) => ({ value: item.brand, label: item.brand }))} placeholder="აირჩიე ბრენდი" onChange={(value) => { setHeroBrand(value); setHeroSearch(''); setHeroProduct(null); setHeroStorage(''); setHeroCondition(''); }} />
              <div className={`zzv-figma-select-field zzv-figma-model-field${!heroBrand ? ' is-mobile-pending' : ''}`} ref={modelRef}>
                <label htmlFor="home-hero-model">მოდელი</label>
                <input id="home-hero-model" className="zzv-figma-select" role="combobox" aria-autocomplete="list" aria-expanded={modelOpen} value={heroProduct ? heroProduct.name : heroSearch} disabled={!heroBrand} onFocus={() => { if (heroProduct) { setHeroProduct(null); setHeroSearch(''); setHeroStorage(''); setHeroCondition(''); } setModelOpen(true); }} onChange={(event) => { setHeroSearch(event.target.value); setHeroProduct(null); setHeroStorage(''); setHeroCondition(''); setModelOpen(true); }} placeholder="მოძებნე მოდელი" autoComplete="off" />
                {heroBrand && modelOpen && (
                  <div className="zzv-figma-model-results" role="listbox" aria-label="მოდელები">
                    {modelsQuery.isLoading || modelsQuery.isFetching ? <span>იტვირთება...</span> : (modelsQuery.data?.items || []).length ? (modelsQuery.data.items || []).map((item) => (
                      <button key={item.id} type="button" role="option" aria-selected="false" onClick={() => { setHeroProduct(item); setHeroSearch(''); setModelOpen(false); }}>{item.name}</button>
                    )) : <span>მოდელი ვერ მოიძებნა</span>}
                  </div>
                )}
              </div>
              <HeroDropdown label="მეხსიერება" value={heroStorage} options={storageOptions} placeholder={productDetailQuery.isLoading ? 'იტვირთება...' : 'აირჩიე მეხსიერება'} disabled={!heroProduct || !storageOptions.length} className={!heroProduct ? 'is-mobile-pending' : ''} onChange={(value) => { setHeroStorage(value); setHeroCondition(''); }} />
              <HeroDropdown label="მდგომარეობა" value={heroCondition} options={conditionOptions} placeholder={productDetailQuery.isLoading ? 'იტვირთება...' : 'აირჩიე მდგომარეობა'} disabled={!heroProduct || !conditionOptions.length || (storageOptions.length > 0 && !heroStorage)} className={!heroProduct || (storageOptions.length > 0 && !heroStorage) ? 'is-mobile-pending' : ''} onChange={setHeroCondition} />
            </div>
            <button className="zzv-figma-estimate" type="button" onClick={beginEstimate}>
              შეაფასე
            </button>
            <small>შეფასება სრულიად უფასოა</small>
          </aside>
        </div>
      </section>

      <section className="zzv-figma-section">
        <div className="zzv-figma-wrap">
          <div className="zzv-figma-section-head">
            <h2>როგორ ვმუშაობთ</h2>
            <ButtonLink to="/trade-in">დაიწყე შეფასება</ButtonLink>
          </div>
          <div className="zzv-figma-steps">
            {steps.map((step) => (
              <StepCard key={step[0]} step={step} />
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="zzv-figma-section zzv-figma-section--tight">
        <div className="zzv-figma-wrap">
          <h2 className="zzv-figma-heading">ჩვენი სერვისები</h2>
          <div className="zzv-figma-bento">
            <Link className="zzv-figma-trade-card" to="/trade-in">
              <span>Trade-in</span>
              <p>ძველი — თანხად ან ტექნიკად.</p>
              <strong>₾2,282</strong>
              <small>მაქსიმალური შეფასება</small>
              <img src={asset('imgImage350.png')} alt="" />
            </Link>
            <div className="zzv-figma-mini-card zzv-figma-shop-disabled" aria-disabled="true">
              <span>მაღაზია</span>
              <strong>მალე</strong>
              <small>მაღაზია მზადდება</small>
              <img src={asset('imgShop1.png')} alt="" />
            </div>
            <Link className="zzv-figma-mini-card" to="/warranty-service?tab=warranty">
              <span>გარანტია</span>
              <strong>12 თვე</strong>
              <small>დაცული შენაძენი</small>
              <img src={asset('imgShield1.png')} alt="" />
            </Link>
            <Link className="zzv-figma-wide-card" to="/warranty-service?tab=case">
              <span>სერვისი</span>
              <strong>1,200+</strong>
              <small>დასრულებული შეკეთება</small>
              <img src={asset('imgShield2.png')} alt="" />
            </Link>
          </div>
        </div>
      </section>

      <section className="zzv-figma-status zzv-figma-wrap">
        <div className="zzv-figma-status-copy">
          <BrandPair />
          <h2>შეამოწმე შენი მოწყობილობის სტატუსი ერთ წუთში</h2>
          <p>გარანტიის კოდით ან სერვისის ნომრით — რეგისტრაცია არ სჭირდება.</p>
          <ul>
            <li>
              <img src={asset('imgCheck.svg')} alt="" />
              <span>ნახავ, რა ეტაპზეა შეკეთება</span>
            </li>
            <li>
              <img src={asset('imgCheck.svg')} alt="" />
              <span>გარანტიის ვადა და დაფარვა</span>
            </li>
          </ul>
        </div>
        <form className="zzv-figma-status-widget" onSubmit={submitLookup}>
          <div className="zzv-figma-tabs" role="tablist" aria-label="სტატუსის ტიპი">
            <button type="button" role="tab" aria-selected={lookupTab === 'warranty'} className={lookupTab === 'warranty' ? 'is-active' : ''} onClick={() => { setLookupTab('warranty'); setLookupCode(''); }}>გარანტია</button>
            <button type="button" role="tab" aria-selected={lookupTab === 'case'} className={lookupTab === 'case' ? 'is-active' : ''} onClick={() => { setLookupTab('case'); setLookupCode(''); }}>სერვისი</button>
          </div>
          <div className="zzv-figma-widget-field">
            <label htmlFor="home-lookup-code">{lookupTab === 'case' ? 'სერვისის კოდი' : 'გარანტიის კოდი'}</label>
            <input id="home-lookup-code" className="zzv-figma-input" value={lookupCode} onChange={(event) => setLookupCode(event.target.value)} placeholder={lookupTab === 'case' ? 'SCN-XXXXXX' : 'WRN-XXXX-XXXX'} required />
          </div>
          <div className="zzv-figma-widget-field">
            <label htmlFor="home-lookup-phone">შეიყვანე ნომერი</label>
            <input id="home-lookup-phone" className="zzv-figma-input" type="tel" autoComplete="tel" value={lookupPhone} onChange={(event) => setLookupPhone(event.target.value)} placeholder="5XX XXX XXX" required />
          </div>
          <button className="zzv-figma-widget-submit" type="submit">
            შემოწმება
          </button>
          <small>კოდი SMS-ში მოგივიდა</small>
        </form>
      </section>

      <section className="zzv-figma-section">
        <div className="zzv-figma-wrap">
          <div className="zzv-figma-shop-head">
            <h2 className="zzv-figma-heading">მაღაზია</h2>
            <span className="zzv-figma-shop-all zzv-figma-shop-disabled" aria-disabled="true">მალე</span>
          </div>
          <div className="zzv-figma-category-row">
            <div className="zzv-figma-shop-feature">
              <strong>მალე</strong>
              <span>მაღაზია მზადდება</span>
              <small>ნაწილები მალე ხელმისაწვდომი იქნება</small>
            </div>
            {partIcons.map(([label, icon, count]) => (
              <div className="zzv-figma-part-card zzv-figma-shop-disabled" key={label} aria-disabled="true">
                <div>
                  <img src={asset(icon)} alt="" />
                  <strong>{count}</strong>
                </div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="zzv-figma-review-section">
        <div className="zzv-figma-wrap">
          <h2>რას ამბობენ</h2>
          <article className="zzv-figma-review-card">
            <div className="zzv-figma-review-quote">
              <div className="zzv-figma-stars" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, index) => (
                  <img key={index} src={asset('imgStateFilled.svg')} alt="" />
                ))}
              </div>
              <p>ეკრანი შემიცვალეს ორ დღეში, გარანტიაც მომცეს. ძველი ტელეფონიც ჩავაბარე — თანხა იმავე დღეს ავიღე.</p>
              <div className="zzv-figma-review-author">
                <span>თე</span>
                <div>
                  <strong>თამარ ეგუტიძე</strong>
                  <small>სერვისი და Trade-in · Google</small>
                </div>
              </div>
            </div>
            <div className="zzv-figma-review-score">
              <strong>4.9</strong>
              <span>218 შეფასება Google-ზე</span>
            </div>
          </article>
        </div>
      </section>

      <section className="zzv-figma-gstore-section">
        <div className="zzv-figma-wrap">
          <div className="zzv-figma-gstore">
            <div className="zzv-figma-gstore-copy">
              <BrandPair />
              <h2>Gstore-ში ნაყიდი ტექნიკა ჩვენ ვემსახურებით</h2>
              <p>ყველა Gstore-ის მოწყობილობა ავტომატურად რეგისტრირდება — შეამოწმე ტელეფონის ნომრით.</p>
              <div className="zzv-figma-gstore-actions">
                <ButtonLink to="/warranty-service" variant="primary">
                  შემოწმება
                </ButtonLink>
                <a className="zzv-figma-btn zzv-figma-btn--dark" href="https://gstore.ge" target="_blank" rel="noreferrer">
                  ნახე Gstore
                </a>
              </div>
            </div>

            <div className="zzv-figma-widget-stack" aria-hidden="true">
              <div className="zzv-figma-widget-card zzv-figma-widget-card--warranty">
                <div className="zzv-figma-widget-heading">
                  <h3>გარანტიის შემოწმება</h3>
                  <p>ნახე, აქტიურია თუ არა შენი გარანტია და როდის იწურება. Gstore-ში ნაყიდ ტექნიკასაც მოიცავს.</p>
                </div>
                <div className="zzv-figma-widget-detail zzv-figma-widget-detail--warranty">
                  <div className="zzv-figma-widget-record">
                    <div className="zzv-figma-widget-record-label">
                      <span>
                        <img src={asset('imgLandingShieldCheck.svg')} alt="" />
                      </span>
                      <div>
                        <strong>გარანტია</strong>
                        <small>WP-4809-5103</small>
                      </div>
                    </div>
                    <b>აქტიური</b>
                  </div>
                  <div className="zzv-figma-widget-row">
                    <span>შეძენის თარიღი</span>
                    <strong>12/2/2024</strong>
                  </div>
                  <div className="zzv-figma-widget-row">
                    <span>გარანტიის დაწყება</span>
                    <strong>12/2/2024</strong>
                  </div>
                  <div className="zzv-figma-widget-row">
                    <span>გარანტიის დასრულება</span>
                    <strong>12/2/2026</strong>
                  </div>
                </div>
              </div>

              <div className="zzv-figma-widget-card zzv-figma-widget-card--service">
                <div className="zzv-figma-widget-heading">
                  <h3>სერვისის შემოწმება</h3>
                  <p>თვალყური ადევნე შენს შეკეთებას — რა ეტაპზეა და როდის იქნება მზად.</p>
                </div>
                <div className="zzv-figma-widget-detail zzv-figma-widget-detail--service">
                  <div className="zzv-figma-widget-record">
                    <div className="zzv-figma-widget-record-label">
                      <span>
                        <img src={asset('imgLandingWrench.svg')} alt="" />
                      </span>
                      <div>
                        <strong>სერვისის სტატუსი</strong>
                        <small>Scn-000279</small>
                      </div>
                    </div>
                    <b>მიმდინარეობს</b>
                  </div>
                  <div className="zzv-figma-service-row">
                    <div>
                      <strong>ეკრანის შეცვლა</strong>
                      <span>მზად იქნება - ხვალ, 14:00</span>
                    </div>
                    <div>
                      <strong>მიღებულია</strong>
                      <span>19 ივლ · 11:20</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="zzv-figma-faq">
        <div className="zzv-figma-wrap">
          <h2>ხშირი კითხვები</h2>
          <div>
            {faqItems.map(([question, answer], index) => (
              <div className={`zzv-figma-faq-row${openFaq === index ? ' is-open' : ''}`} key={question}>
                <button type="button" aria-expanded={openFaq === index} aria-controls={`home-faq-answer-${index}`} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                  <span>{question}</span>
                  {openFaq === index ? <RemoveRounded aria-hidden="true" /> : <AddRounded aria-hidden="true" />}
                </button>
                {openFaq === index && <p id={`home-faq-answer-${index}`}>{answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="zzv-figma-footer">
        <div className="zzv-figma-wrap zzv-figma-footer-desktop">
          <div className="zzv-figma-footer-cta">
            <span>2 წუთი და გაიგებ, რა ღირს შენი ტელეფონი</span>
            <ButtonLink to="/trade-in">დაიწყე შეფასება</ButtonLink>
          </div>
          <div className="zzv-figma-footer-bottom">
            <img src={asset('imgBrandMark.svg')} alt="ZEZVA" />
            <nav>
              {footerLinks.map(([label, to]) => (
                to === '/shop' ? <span key={label} aria-disabled="true">{label} · მალე</span> : <Link key={label} to={to}>{label}</Link>
              ))}
            </nav>
            <span>© 2026 ZEZVA</span>
          </div>
        </div>
        <div className="zzv-figma-footer-mobile">
          <div className="zzv-figma-footer-mobile-cta">
            <div><strong>ჯერ არ შეგიფასებია?</strong><span>2 წუთი და გაიგებ, რა ღირს შენი ტელეფონი</span></div>
            <ButtonLink to="/trade-in">შეაფასე უფასოდ</ButtonLink>
          </div>
          <div className="zzv-figma-footer-mobile-brand">
            <img src={asset('imgBrandMark.svg')} alt="ZEZVA" />
            <p>ტელეფონის გადაცვლა, შეკეთება და ორიგინალი ნაწილები — ერთ ადგილას.</p>
            <div className="zzv-figma-footer-social" aria-hidden="true">
              <span><img src={asset('figma-footer-facebook.svg')} alt="" /></span>
              <span><img src={asset('figma-footer-instagram.svg')} alt="" /></span>
              <span><img src={asset('figma-footer-tiktok.svg')} alt="" /></span>
            </div>
          </div>
          <div className="zzv-figma-footer-mobile-links">
            <nav aria-label="სერვისები"><strong>სერვისები</strong><Link to="/trade-in">Trade-in</Link><Link to="/warranty-service?tab=case">შეკეთება</Link><span aria-disabled="true">მაღაზია · მალე</span><Link to="/warranty-service?tab=warranty">გარანტია</Link></nav>
            <nav aria-label="კომპანია"><strong>კომპანია</strong><a href="#about">ჩვენ შესახებ</a><a href="mailto:hello@zezva.ge">კონტაქტი</a><a href="https://gstore.ge" target="_blank" rel="noreferrer">Gstore</a></nav>
            <div className="zzv-figma-footer-mobile-contact"><strong>კონტაქტი</strong><span>ვაჟა-ფშაველას 76</span><a href="tel:+995322606060">+995 322 60 60 60</a><a href="mailto:hello@zezva.ge">hello@zezva.ge</a></div>
          </div>
          <div className="zzv-figma-footer-mobile-legal"><span>© 2026 ZEZVA</span><div><Link to="/terms">წესები</Link><Link to="/privacy">კონფიდენციალურობა</Link><button type="button" onClick={() => window.dispatchEvent(new Event('zezva:open-cookie-settings'))}>პარამეტრები</button></div></div>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;
