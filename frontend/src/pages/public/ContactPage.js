import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlaceOutlined, PhoneOutlined, MailOutline, ChevronRight } from '@mui/icons-material';
import StaticPageFrame from './components/StaticPageFrame';
import { googleMapsUrl, socialLinks } from './publicLinks';

const ContactPage = () => {
  const { i18n } = useTranslation();
  const ka = i18n.language === 'ka';

  return <StaticPageFrame title={ka ? 'კონტაქტი' : 'Contact'}>
    <div className="zzv-contact-grid">
      <a className="zzv-contact-map" href={googleMapsUrl} target="_blank" rel="noopener noreferrer" aria-label={ka ? 'ZEZVA Service-ის ნახვა Google Maps-ზე' : 'View Zezva Service on Google Maps'}><PlaceOutlined aria-hidden="true" /><span>{ka ? 'გახსენი Google Maps-ზე' : 'Open in Google Maps'}</span></a>
      <div className="zzv-contact-info">
        <div className="zzv-contact-card"><strong>{ka ? 'ცოტნე დადიანის ქ. 7' : '7 Tsotne Dadiani Street'}</strong><span>{ka ? 'ქარვასლა, III სართული, B308/1 · თბილისი' : 'Karvasla, Floor III, B308/1 · Tbilisi'}</span></div>
        <div className="zzv-contact-card zzv-contact-hours">
          <div><span>{ka ? 'ორშ—პარ' : 'Mon–Fri'}</span><strong>10:00–19:00</strong></div>
          <div><span>{ka ? 'შაბათი' : 'Saturday'}</span><strong>11:00–17:00</strong></div>
          <div><span>{ka ? 'კვირა' : 'Sunday'}</span><strong>{ka ? 'დაკეტილია' : 'Closed'}</strong></div>
        </div>
        <a className="zzv-contact-action" href="tel:+995322606060"><PhoneOutlined aria-hidden="true" /><span><strong>+995 322 60 60 60</strong><small>{ka ? 'დარეკვა' : 'Call us'}</small></span><ChevronRight aria-hidden="true" /></a>
        <a className="zzv-contact-action" href={googleMapsUrl} target="_blank" rel="noopener noreferrer"><PlaceOutlined aria-hidden="true" /><span><strong>{ka ? 'გვიპოვე რუკაზე' : 'Find us on the map'}</strong><small>{ka ? 'ცოტნე დადიანის ქ. 7 · ქარვასლა' : '7 Tsotne Dadiani St · Karvasla'}</small></span><ChevronRight aria-hidden="true" /></a>
        <a className="zzv-contact-action" href="mailto:hello@zezva.ge"><MailOutline aria-hidden="true" /><span><strong>hello@zezva.ge</strong><small>{ka ? 'პასუხი 1 სამუშაო დღეში' : 'Reply within one business day'}</small></span><ChevronRight aria-hidden="true" /></a>
        <div className="zzv-contact-social">
          <span>{ka ? 'სოციალურ ქსელებში' : 'Social media'}</span>
          <div aria-label={ka ? 'სოციალური ბმულები' : 'Social links'}>
            {socialLinks.map(({ name, url, icon }) => <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name}><img src={`/figma-home/${icon}`} alt="" /></a>)}
          </div>
        </div>
      </div>
    </div>
  </StaticPageFrame>;
};

export default ContactPage;
