import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/shop-coming-soon.css';

const ShopComingSoonPage = () => {
  const { i18n } = useTranslation();
  const isGeorgian = i18n.language === 'ka';

  return (
    <main className="zzv-shop-soon">
      <div className="zzv-shop-soon-art" aria-hidden="true">
        <span className="zzv-shop-soon-orbit zzv-shop-soon-orbit--one" />
        <span className="zzv-shop-soon-orbit zzv-shop-soon-orbit--two" />
        <span className="zzv-shop-soon-mark">Z</span>
      </div>
      <div className="zzv-shop-soon-copy">
        <span className="zzv-shop-soon-eyebrow">ZEZVA / SHOP</span>
        <h1>{isGeorgian ? 'მაღაზია მალე გაიხსნება' : 'The shop is coming soon'}</h1>
        <p>{isGeorgian
          ? 'მაღაზიის გამოცდილებას ვამზადებთ. დაბრუნდი მალე.'
          : 'We are preparing the shop experience. Check back soon.'}</p>
      </div>
      <span className="zzv-shop-soon-foot">ZEZVA © 2026</span>
    </main>
  );
};

export default ShopComingSoonPage;
