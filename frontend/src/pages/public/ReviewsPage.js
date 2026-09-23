import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticPageFrame from './components/StaticPageFrame';
import { googleMapsUrl } from './publicLinks';

const ReviewsPage = () => {
  const { i18n } = useTranslation();
  const ka = i18n.language === 'ka';
  return <StaticPageFrame title={ka ? 'შეფასებები' : 'Reviews'}>
    <div className="zzv-reviews-head">
      <p>{ka ? 'ჩვენი მომხმარებლების შეფასებები' : 'What our customers say'}</p>
    </div>
    <div className="zzv-reviews-empty">
      <strong>{ka ? 'ნახე ჩვენი Google შეფასებები' : 'See our Google reviews'}</strong>
      <p>{ka ? 'აქ სრული შეფასებების ჩვენებას Google Business Profile-ის დაკავშირების შემდეგ დავამატებთ.' : 'The full reviews feed will appear here after Google Business Profile is connected.'}</p>
      <a className="zzv-reviews-google-link" href={googleMapsUrl} target="_blank" rel="noopener noreferrer">{ka ? 'Google Maps-ზე ნახვა' : 'View on Google Maps'}</a>
    </div>
  </StaticPageFrame>;
};

export default ReviewsPage;
