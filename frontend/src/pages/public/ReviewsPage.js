import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import StaticPageFrame from './components/StaticPageFrame';

const ReviewsPage = () => {
  const { i18n } = useTranslation();
  const ka = i18n.language === 'ka';
  const [filter, setFilter] = useState('all');
  const filters = [
    ['all', ka ? 'ყველა' : 'All'],
    ['service', ka ? 'სერვისი' : 'Service'],
    ['trade', 'Trade-in'],
    ['shop', ka ? 'მაღაზია' : 'Shop'],
  ];

  return <StaticPageFrame title={ka ? 'შეფასებები' : 'Reviews'}>
    <div className="zzv-reviews-head">
      <p>{ka ? 'ჩვენი მომხმარებლების შეფასებები' : 'What our customers say'}</p>
      <div className="zzv-reviews-filters" role="group" aria-label={ka ? 'შეფასებების ფილტრი' : 'Review filter'}>
        {filters.map(([key, label]) => <button type="button" key={key} className={filter === key ? 'is-active' : ''} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}
      </div>
    </div>
    <div className="zzv-reviews-empty">
      <strong>{ka ? 'შეფასებები მალე გამოჩნდება' : 'Reviews are coming soon'}</strong>
      <p>{ka ? 'ნამდვილი შეფასებების წყაროს დაკავშირების შემდეგ ისინი აქ გამოჩნდება.' : 'Verified customer reviews will appear here once the reviews source is connected.'}</p>
    </div>
  </StaticPageFrame>;
};

export default ReviewsPage;
