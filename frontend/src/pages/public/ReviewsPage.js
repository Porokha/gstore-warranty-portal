import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StaticPageFrame from './components/StaticPageFrame';
import { googleMapsUrl } from './publicLinks';
import api from '../../services/api';

const ReviewsPage = () => {
  const { i18n } = useTranslation();
  const ka = i18n.language === 'ka';
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get('/public/reviews', { params: { lang: ka ? 'ka' : 'en' }, skipAuthRedirect: true })
      .then(({ data }) => { if (active) setPlace(data); })
      .catch(() => { if (active) setPlace(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [ka]);

  const reviews = place?.configured ? place.reviews : [];
  const sourceUrl = place?.googleMapsUri || googleMapsUrl;
  return <StaticPageFrame title={ka ? 'შეფასებები' : 'Reviews'}>
    <div className="zzv-reviews-head">
      <p>{ka ? 'ჩვენი მომხმარებლების შეფასებები' : 'What our customers say'}</p>
    </div>
    {place?.configured && <div className="zzv-reviews-summary">
      <div><strong>{place.rating ?? '—'}</strong><span aria-hidden="true">{'★'.repeat(Math.max(0, Math.min(5, Math.round(place.rating || 0))))}</span><small>{ka ? `${place.total} შეფასება` : `${place.total} reviews`}</small></div>
      <a href={sourceUrl} target="_blank" rel="noopener noreferrer" translate="no">Google Maps</a>
    </div>}
    {place?.attributions?.length > 0 && <div className="zzv-reviews-attributions" translate="no">{place.attributions.map((item, index) => item.uri ? <a key={index} href={item.uri} target="_blank" rel="noopener noreferrer">{item.provider}</a> : <span key={index}>{item.provider}</span>)}</div>}
    {reviews.length > 0 && <>
      <p className="zzv-reviews-disclosure">{ka ? 'Google Maps-ის მიერ შერჩეული მაქსიმუმ 5 შეფასება, დალაგებული რელევანტურობით.' : 'Up to 5 Google Maps reviews, selected and ordered by relevance.'}</p>
      <div className="zzv-reviews-list">
        {reviews.map((review, index) => <article className="zzv-review-card" key={review.id || index}>
          <div className="zzv-review-author">
            {review.author?.photoUri && <img src={review.author.photoUri} alt="" referrerPolicy="no-referrer" />}
            {review.author?.uri ? <a href={review.author.uri} target="_blank" rel="noopener noreferrer">{review.author.name || (ka ? 'მომხმარებელი' : 'Customer')}</a> : <strong>{review.author?.name || (ka ? 'მომხმარებელი' : 'Customer')}</strong>}
          </div>
          <div className="zzv-review-stars" aria-label={`${review.rating || 0} / 5`}>{'★'.repeat(Math.max(0, Math.min(5, review.rating || 0)))}</div>
          {review.text && <p>{review.text}</p>}
          <div className="zzv-review-card-foot">
            {review.publishedAt && <time dateTime={review.publishedAt}>{new Date(review.publishedAt).toLocaleDateString(ka ? 'ka-GE' : 'en-US', { year: 'numeric', month: 'long' })}</time>}
            <a href={review.googleMapsUri} target="_blank" rel="noopener noreferrer" translate="no">Google Maps ↗</a>
          </div>
        </article>)}
      </div>
    </>}
    {!loading && reviews.length === 0 && <div className="zzv-reviews-empty">
      <strong>{ka ? 'ნახე ჩვენი Google შეფასებები' : 'See our Google reviews'}</strong>
      <p>{ka ? 'შეფასებების ჩვენება აქ ჯერ მიუწვდომელია. სრული სია შეგიძლია Google Maps-ზე ნახო.' : 'Reviews are not available here yet. You can read the full list on Google Maps.'}</p>
      <a className="zzv-reviews-google-link" href={sourceUrl} target="_blank" rel="noopener noreferrer">{ka ? 'Google Maps-ზე ნახვა' : 'View on Google Maps'}</a>
    </div>}
    {loading && <div className="zzv-reviews-empty" role="status">{ka ? 'შეფასებები იტვირთება…' : 'Loading reviews…'}</div>}
    {reviews.length > 0 && <a className="zzv-reviews-google-link zzv-reviews-all-link" href={sourceUrl} target="_blank" rel="noopener noreferrer">{ka ? 'ყველა შეფასება Google Maps-ზე' : 'All reviews on Google Maps'}</a>}
  </StaticPageFrame>;
};

export default ReviewsPage;
