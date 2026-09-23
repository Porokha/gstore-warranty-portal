import React from 'react';
import { useTranslation } from 'react-i18next';
import PolicyPage from './components/PolicyPage';

const PrivacyPage = () => {
  const { i18n, t } = useTranslation();
  const ka = i18n.language === 'ka';
  const sections = [
    [ka ? 'რა მონაცემებს ვაგროვებთ' : 'What information we collect',
      `${t('public.privacy.collectDescription')} ${[
        t('public.privacy.collectedItems.fullName'),
        t('public.privacy.collectedItems.phone'),
        t('public.privacy.collectedItems.email'),
        t('public.privacy.collectedItems.deliveryAddress'),
      ].join(', ')}.`],
    [ka ? 'რისთვის ვიყენებთ' : 'How we use it', t('public.privacy.useItems', { returnObjects: true }).join(' ')],
    [ka ? 'ვის ვუზიარებთ' : 'Who we share it with', t('public.privacy.protectionDescription')],
    [ka ? 'შენახვის ვადა' : 'Retention period'],
    [ka ? 'შენი უფლებები' : 'Your rights', `${t('public.privacy.rightsIntro')} ${t('public.privacy.rightsItems', { returnObjects: true }).join(' ')}`],
    [ka ? 'Cookie-ები' : 'Cookies', t('public.privacy.cookiesDescription')],
  ];

  return <PolicyPage title={ka ? 'კონფიდენციალურობა' : 'Privacy'} sections={sections} defaultOpen={0} />;
};

export default PrivacyPage;
