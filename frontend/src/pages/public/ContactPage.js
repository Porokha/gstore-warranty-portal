import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlaceOutlined, PhoneOutlined, MailOutline, ChevronRight } from '@mui/icons-material';
import StaticPageFrame from './components/StaticPageFrame';
import { googleMapsUrl, socialLinks } from './publicLinks';

const googleMapsEmbedUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3268.8919459592576!2d44.8025947!3d41.7191106!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40440da6e283f8ad%3A0x9c27b195e6109042!2sZezva%20Service!5e1!3m2!1ska!2sge!4v1790189902073!5m2!1ska!2sge';

const ContactPage = () => {
  const { i18n } = useTranslation();
  const ka = i18n.language === 'ka';

  return <StaticPageFrame title={ka ? 'კონტაქტი' : 'Contact'}>
    <div className="zzv-contact-grid">
      <div className="zzv-contact-map">
        <iframe src={googleMapsEmbedUrl} title={ka ? 'ZEZVA Service-ის მდებარეობა Google Maps-ზე' : 'Zezva Service location on Google Maps'} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">{ka ? 'გახსენი Google Maps-ზე' : 'Open in Google Maps'}</a>
      </div>
      <div className="zzv-contact-info">
        <div className="zzv-contact-card"><strong>{ka ? 'ცოტნე დადიანის ქ. 7' : '7 Tsotne Dadiani Street'}</strong><span>{ka ? 'ქარვასლა, III სართული, B308/1 · თბილისი' : 'Karvasla, Floor III, B308/1 · Tbilisi'}</span></div>
        <div className="zzv-contact-card zzv-contact-hours">
          <div><span>{ka ? 'ორშ–პარ' : 'Mon–Fri'}</span><strong>10:00–20:00</strong></div>
          <div><span>{ka ? 'შაბ–კვი' : 'Sat–Sun'}</span><strong>{ka ? 'დაკეტილია' : 'Closed'}</strong></div>
        </div>
        <a className="zzv-contact-action" href="tel:+995511533522"><PhoneOutlined aria-hidden="true" /><span><strong>+995 511 533 522</strong><small>{ka ? 'დარეკვა' : 'Call us'}</small></span><ChevronRight aria-hidden="true" /></a>
        <a className="zzv-contact-action" href={googleMapsUrl} target="_blank" rel="noopener noreferrer"><PlaceOutlined aria-hidden="true" /><span><strong>{ka ? 'გვიპოვე რუკაზე' : 'Find us on the map'}</strong><small>{ka ? 'ცოტნე დადიანის ქ. 7 · ქარვასლა' : '7 Tsotne Dadiani St · Karvasla'}</small></span><ChevronRight aria-hidden="true" /></a>
        <a className="zzv-contact-action" href="mailto:contact@zezva.ge"><MailOutline aria-hidden="true" /><span><strong>contact@zezva.ge</strong><small>{ka ? 'მოგვწერე' : 'Email us'}</small></span><ChevronRight aria-hidden="true" /></a>
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
