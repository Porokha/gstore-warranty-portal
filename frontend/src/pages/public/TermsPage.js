import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/shop.css';

const shopJourney = [
  {
    step: '01',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7.25 4.75h9.5A2.25 2.25 0 0 1 19 7v10a2.25 2.25 0 0 1-2.25 2.25h-9.5A2.25 2.25 0 0 1 5 17V7a2.25 2.25 0 0 1 2.25-2.25Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 7.75h4M11 16.25h2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    step: '02',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="m17 17 3.5 3.5M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.25 10.5h4.5M10.5 8.25v4.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    step: '03',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3.75 4.5 7.5V12c0 4.35 2.95 8.31 7.5 9.45 4.55-1.14 7.5-5.1 7.5-9.45V7.5L12 3.75Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m9.25 12 1.75 1.75 3.75-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    step: '04',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3.75 7.75h11.5v7.5H3.75v-7.5ZM15.25 10h2.41c.45 0 .88.2 1.16.55l1.43 1.8c.19.24.3.53.3.83v2.07h-5.3V10Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.5 18.25a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM18.5 18.25a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM15.25 18.25H9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const TermsPage = () => {
  const { t } = useTranslation();

  const shopJourneyContent = useMemo(
    () =>
      shopJourney.map((item, index) => ({
        ...item,
        label: t(`shop.journey.${index}.label`),
        title: t(`shop.journey.${index}.title`),
        description: t(`shop.journey.${index}.description`),
      })),
    [t],
  );

  return (
    <div className="zpos-terms-page">
      <div className="zpos-shop-banner zpos-shop-banner--terms">
        <div className="zpos-shop-banner-copy">
          <h1>
            {t('shop.banner.titleLead')}
            <em>{t('shop.banner.titleEmphasis')}</em>
          </h1>
          <p>{t('shop.banner.description')}</p>
        </div>

        <div className="zpos-shop-banner-grid" aria-label={t('shop.aria.process')}>
          {shopJourneyContent.map((item, index) => (
            <article className="zpos-shop-step" key={item.step}>
              <div className="zpos-shop-step-mark">{item.step}</div>
              <div className="zpos-shop-step-icon">{item.icon}</div>
              <p className="zpos-shop-step-label">{item.label}</p>
              <h2>{item.title}</h2>
              <p className="zpos-shop-step-desc">{item.description}</p>
              {index < shopJourney.length - 1 ? (
                <span className="zpos-shop-step-connector" aria-hidden="true"></span>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
