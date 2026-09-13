import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowForwardRounded, ExpandMoreRounded } from '@mui/icons-material';

const asset = (name) => `/figma-home/${name}`;

const selectFields = [
  ['ბრენდი', 'Apple', true],
  ['მოდელი', 'აირჩიე მოდელი', false],
  ['მეხსიერება', '64GB', true],
  ['მდგომარეობა', 'როგორც ახალი', false],
];

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
  'გატეხილ ტელეფონს იბარებთ?',
  'რამდენ ხანში მივიღებ თანხას?',
  'შემიძლია Trade-in Gstore-ში?',
  'გარანტია როგორ მოწმდება?',
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

function SelectField({ label, value, active }) {
  return (
    <div className="zzv-figma-select-field">
      <span>{label}</span>
      <div className={`zzv-figma-select ${active ? '' : 'is-muted'}`}>
        <strong>{value}</strong>
        <ExpandMoreRounded />
      </div>
    </div>
  );
}

function BrandPair() {
  return (
    <div className="zzv-figma-brand-pair" aria-hidden="true">
      <img src={asset('imgZezvaBrandColor.svg')} alt="" />
      <span />
      <img src={asset('imgGstoreBrandColor.svg')} alt="" />
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
              {selectFields.map(([label, value, active]) => (
                <SelectField key={label} label={label} value={value} active={active} />
              ))}
            </div>
            <Link className="zzv-figma-estimate" to="/trade-in">
              შეაფასე
            </Link>
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

      <section className="zzv-figma-section zzv-figma-section--tight">
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
            <Link className="zzv-figma-mini-card" to="/shop">
              <span>მაღაზია</span>
              <strong>2,700+</strong>
              <small>ნაწილი მარაგში</small>
              <img src={asset('imgShop1.png')} alt="" />
            </Link>
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
        <div className="zzv-figma-status-widget">
          <div className="zzv-figma-tabs">
            <span>გარანტია</span>
            <span>სერვისი</span>
          </div>
          <div className="zzv-figma-widget-field">
            <label>გარანტიის კოდი</label>
            <div className="zzv-figma-input">WRN-XXXX-XXXX</div>
          </div>
          <div className="zzv-figma-widget-field">
            <label>შეიყვანე ნომერი</label>
            <div className="zzv-figma-input">5XX XXX XXX</div>
          </div>
          <Link className="zzv-figma-widget-submit" to="/warranty-service?tab=warranty">
            შემოწმება
          </Link>
          <small>კოდი SMS-ში მოგივიდა</small>
        </div>
      </section>

      <section className="zzv-figma-section">
        <div className="zzv-figma-wrap">
          <div className="zzv-figma-shop-head">
            <h2 className="zzv-figma-heading">მაღაზია</h2>
            <Link className="zzv-figma-shop-all" to="/shop">
              სრულად ნახვა
            </Link>
          </div>
          <div className="zzv-figma-category-row">
            <div className="zzv-figma-shop-feature">
              <strong>2,700+</strong>
              <span>ორიგინალი ნაწილი</span>
              <small>ნაწილები უშუალოდ მწარმოებლებისგან</small>
            </div>
            {partIcons.map(([label, icon, count]) => (
              <Link className="zzv-figma-part-card" key={label} to="/shop">
                <div>
                  <img src={asset(icon)} alt="" />
                  <strong>{count}</strong>
                </div>
                <span>{label}</span>
              </Link>
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
                <ButtonLink to="/warranty-service" variant="dark">
                  ნახე Gstore
                </ButtonLink>
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
            {faqItems.map((item) => (
              <button key={item} type="button">
                <span>{item}</span>
                <ArrowForwardRounded />
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="zzv-figma-footer">
        <div className="zzv-figma-wrap">
          <div className="zzv-figma-footer-cta">
            <span>2 წუთი და გაიგებ, რა ღირს შენი ტელეფონი</span>
            <ButtonLink to="/trade-in">დაიწყე შეფასება</ButtonLink>
          </div>
          <div className="zzv-figma-footer-bottom">
            <img src={asset('imgBrandMark.svg')} alt="ZEZVA" />
            <nav>
              {footerLinks.map(([label, to]) => (
                <Link key={label} to={to}>
                  {label}
                </Link>
              ))}
            </nav>
            <span>© 2026 ZEZVA</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;
