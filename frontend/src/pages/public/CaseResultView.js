import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowBack, ImageOutlined, SmartphoneOutlined } from '@mui/icons-material';
import '../../styles/warranty-result-figma.css';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date).replaceAll('/', '.');
};

const CaseResultView = ({ serviceCase, onBack }) => {
  const { i18n, t } = useTranslation();
  const ka = i18n.language === 'ka';
  const stage = Math.max(1, Math.min(4, Number(serviceCase.status_level) || 1));
  const stages = ka ? ['გახსნილი', 'კვლევა', 'მოლოდინში', 'დასრულებული'] : ['Opened', 'Investigation', 'Pending', 'Completed'];
  const productName = serviceCase.product_title || '—';
  const shortName = productName.split(/\b(?:128GB|256GB|512GB|1TB|Unlocked|Graphite)\b/i)[0].trim() || productName;
  const latestUpdate = serviceCase.status_history?.find((entry) => entry.note_public);
  const resultLabel = serviceCase.result_type
    ? t(`result.${serviceCase.result_type}`, { defaultValue: serviceCase.result_type })
    : stages[stage - 1];
  const rows = [
    [ka ? 'პროდუქტი' : 'Product', productName],
    [ka ? 'გახსნილი' : 'Opened', formatDate(serviceCase.opened_at)],
    [ka ? 'დასრულდება' : 'Due', formatDate(serviceCase.deadline_at)],
  ];

  return (
    <main className="zzv-warranty-result zzv-case-result">
      <div className="zzv-warranty-result-wrap">
        <button className="zzv-warranty-result-back" type="button" onClick={onBack}>
          <span><ArrowBack aria-hidden="true" /></span>
          {ka ? 'შეკეთება' : 'Service'}
        </button>

        <div className="zzv-warranty-result-layout">
          <section className="zzv-warranty-device" aria-label={ka ? 'მოწყობილობა' : 'Device'}>
            <div className="zzv-warranty-device-image"><ImageOutlined aria-hidden="true" /></div>
            <div className="zzv-warranty-device-copy">
              <h1>{shortName}</h1>
              <span>{serviceCase.case_number}</span>
            </div>
            <SmartphoneOutlined className="zzv-warranty-device-mobile-icon" aria-hidden="true" />
          </section>

          <div className="zzv-warranty-result-content">
            <section className="zzv-case-stage" aria-label={ka ? 'შეკეთების სტატუსი' : 'Service status'}>
              <div className="zzv-case-stage-top"><span>{stages[stage - 1]}</span><span>{stage} / 4</span></div>
              <div className="zzv-case-stage-track" aria-hidden="true">{stages.map((name, index) => <span key={name} className={index < stage ? 'is-filled' : ''} />)}</div>
              <div className="zzv-case-stage-description">
                <small>{ka ? 'შედეგი' : 'Result'}</small>
                <strong>{resultLabel}</strong>
                {latestUpdate?.note_public && <span>{latestUpdate.note_public}</span>}
              </div>
            </section>

            <section className="zzv-warranty-detail-card" aria-label={ka ? 'შეკეთების დეტალები' : 'Service details'}>
              {rows.map(([label, value]) => (
                <div className="zzv-warranty-detail-row" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </section>

            {serviceCase.customer_initial_note && <section className="zzv-case-customer-note">
              <small>{ka ? 'შენი შენიშვნა' : 'Your note'}</small>
              <p>{serviceCase.customer_initial_note}</p>
            </section>}

            {serviceCase.status_history?.length > 1 && <section className="zzv-case-updates">
              <h2>{ka ? 'განახლებები' : 'Updates'}</h2>
              {serviceCase.status_history.map((entry, index) => <div key={`${entry.created_at}-${index}`}>
                <time>{formatDate(entry.created_at)}</time>
                <p>{entry.note_public}</p>
              </div>)}
            </section>}
          </div>
        </div>
      </div>
    </main>
  );
};

export default CaseResultView;
