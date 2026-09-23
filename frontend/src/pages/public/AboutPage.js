import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CurrencyExchangeOutlined, BuildOutlined, ShoppingBagOutlined, VerifiedUserOutlined, ImageOutlined } from '@mui/icons-material';
import StaticPageFrame from './components/StaticPageFrame';

const AboutPage = () => {
  const { i18n } = useTranslation();
  const ka = i18n.language === 'ka';
  const stats = ka ? [
    ['შეფასებული მოწყობილობა', '18 400'], ['გარანტია ყველა რემონტზე', '6 თვე'],
    ['საშუალო ვადა', '48 სთ'], ['ნაწილი მარაგში', '2 700+'],
  ] : [
    ['Devices valued', '18,400'], ['Warranty on every repair', '6 months'],
    ['Average turnaround', '48 hours'], ['Parts in stock', '2,700+'],
  ];
  const services = [
    { icon: <CurrencyExchangeOutlined />, title: 'Trade-in', fact: '18 400', label: ka ? 'შეფასებული' : 'valued', to: '/trade-in' },
    { icon: <BuildOutlined />, title: ka ? 'სერვისი' : 'Service', fact: ka ? '6 თვე' : '6 months', label: ka ? 'გარანტია' : 'warranty', to: '/warranty-service?tab=case' },
    { icon: <ShoppingBagOutlined />, title: ka ? 'მაღაზია' : 'Shop', fact: '2 700+', label: ka ? 'ნაწილი' : 'parts', disabled: true },
    { icon: <VerifiedUserOutlined />, title: ka ? 'გარანტია' : 'Warranty', fact: ka ? '48 სთ' : '48 hours', label: ka ? 'საშუალო ვადა' : 'average time', to: '/warranty-service?tab=warranty' },
  ];

  return <StaticPageFrame title={ka ? 'ჩვენ შესახებ' : 'About us'}>
    <div className="zzv-about-intro">
      <div className="zzv-about-image"><ImageOutlined aria-hidden="true" /></div>
      <div className="zzv-about-info">
        <h2>{ka ? 'ტექნიკა, რომელსაც მეორე სიცოცხლე აქვს' : 'Technology with a second life'}</h2>
        <p>{ka ? '2019 წლიდან ვყიდულობთ, ვარემონტებთ და ვყიდით მოწყობილობებს. ერთი ფასი, ერთი გარანტია, ერთი პასუხისმგებელი.' : 'Since 2019, we have bought, repaired, and sold devices. One price, one warranty, one responsible team.'}</p>
        <div className="zzv-about-stats">{stats.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      </div>
    </div>
    <section className="zzv-about-services">
      <h2>{ka ? 'რას ვაკეთებთ' : 'What we do'}</h2>
      <div className="zzv-about-service-grid">{services.map((item) => {
        const content = <><span className="zzv-about-service-icon">{item.icon}</span><strong>{item.title}</strong><small><b>{item.fact}</b> {item.label}</small></>;
        return item.disabled ? <div key={item.title} className="zzv-about-service-card is-disabled">{content}</div> : <Link key={item.title} className="zzv-about-service-card" to={item.to}>{content}</Link>;
      })}</div>
    </section>
    <section className="zzv-about-partner">
      <div><img src="/figma-home/imgGstoreBrandColor.svg" alt="Gstore" /><h2>{ka ? 'ვმუშაობთ ბრენდებთან' : 'Working with brands'}</h2><p>{ka ? 'ZEZVA და Gstore ერთი ჯგუფია — შეფასება, სერვისი და ახალი ტექნიკა ერთ ადგილას.' : 'ZEZVA and Gstore are part of one group: valuation, service, and new technology in one place.'}</p></div>
      <a href="https://gstore.ge" target="_blank" rel="noreferrer">{ka ? 'გადასვლა Gstore-ზე' : 'Visit Gstore'}</a>
    </section>
  </StaticPageFrame>;
};

export default AboutPage;
