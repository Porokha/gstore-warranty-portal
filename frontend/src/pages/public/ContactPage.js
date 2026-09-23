import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlaceOutlined, PhoneOutlined, MailOutline, ChevronRight } from '@mui/icons-material';
import StaticPageFrame from './components/StaticPageFrame';

const ContactPage = () => {
  const { i18n } = useTranslation();
  const ka = i18n.language === 'ka';

  return <StaticPageFrame title={ka ? 'კონტაქტი' : 'Contact'}>
    <div className="zzv-contact-grid">
      <div className="zzv-contact-map" aria-label={ka ? 'რუკის ადგილი' : 'Map placeholder'}><PlaceOutlined aria-hidden="true" /></div>
      <div className="zzv-contact-info">
        <div className="zzv-contact-card"><strong>{ka ? 'ვაჟა-ფშაველას 76' : '76 Vazha-Pshavela Avenue'}</strong><span>{ka ? 'თბილისი, საქართველო' : 'Tbilisi, Georgia'}</span></div>
        <div className="zzv-contact-card zzv-contact-hours">
          <div><span>{ka ? 'ორშ—პარ' : 'Mon–Fri'}</span><strong>10:00–19:00</strong></div>
          <div><span>{ka ? 'შაბათი' : 'Saturday'}</span><strong>11:00–17:00</strong></div>
          <div><span>{ka ? 'კვირა' : 'Sunday'}</span><strong>{ka ? 'დაკეტილია' : 'Closed'}</strong></div>
        </div>
        <a className="zzv-contact-action" href="tel:+995322606060"><PhoneOutlined aria-hidden="true" /><span><strong>+995 322 60 60 60</strong><small>{ka ? 'დარეკვა' : 'Call us'}</small></span><ChevronRight aria-hidden="true" /></a>
        <a className="zzv-contact-action" href="https://www.google.com/maps/search/?api=1&query=Vazha-Pshavela+76+Tbilisi" target="_blank" rel="noreferrer"><PlaceOutlined aria-hidden="true" /><span><strong>{ka ? 'გვიპოვე რუკაზე' : 'Find us on the map'}</strong><small>{ka ? 'ვაჟა-ფშაველას 76' : '76 Vazha-Pshavela Avenue'}</small></span><ChevronRight aria-hidden="true" /></a>
        <a className="zzv-contact-action" href="mailto:hello@zezva.ge"><MailOutline aria-hidden="true" /><span><strong>hello@zezva.ge</strong><small>{ka ? 'პასუხი 1 სამუშაო დღეში' : 'Reply within one business day'}</small></span><ChevronRight aria-hidden="true" /></a>
        <div className="zzv-contact-social">
          <span>{ka ? 'სოციალურ ქსელებში' : 'Social media'}</span>
          <div aria-label={ka ? 'სოციალური ბმულები დაემატება' : 'Social links to be added'}>
            <span title="Facebook"><img src="/figma-home/figma-footer-facebook.svg" alt="" /></span>
            <span title="Instagram"><img src="/figma-home/figma-footer-instagram.svg" alt="" /></span>
            <span title="TikTok"><img src="/figma-home/figma-footer-tiktok.svg" alt="" /></span>
          </div>
        </div>
      </div>
    </div>
  </StaticPageFrame>;
};

export default ContactPage;
