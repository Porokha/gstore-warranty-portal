import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import StaticPageFrame from './StaticPageFrame';

const PolicyPage = ({ title, sections, defaultOpen = null }) => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState(defaultOpen);
  const ka = i18n.language === 'ka';

  return <StaticPageFrame title={title} narrow>
    <p className="zzv-static-updated">{ka ? 'სამუშაო ვერსია · ტექსტი დასამტკიცებელია' : 'Draft · content pending approval'}</p>
    <div className="zzv-policy-list">
      {sections.map(([heading, body], index) => <section className="zzv-policy-item" key={heading}>
        <button type="button" aria-expanded={openIndex === index} onClick={() => setOpenIndex(openIndex === index ? null : index)}>
          <span>{heading}</span><span className="zzv-policy-mark" aria-hidden="true">{openIndex === index ? '−' : '+'}</span>
        </button>
        {openIndex === index && <p className={body ? '' : 'is-pending'}>
          {body || (ka ? 'ტექსტი დამტკიცების მოლოდინშია.' : 'Content awaiting approval.')}
        </p>}
      </section>)}
    </div>
  </StaticPageFrame>;
};

export default PolicyPage;
