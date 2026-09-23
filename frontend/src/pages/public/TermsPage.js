import React from 'react';
import { useTranslation } from 'react-i18next';
import PolicyPage from './components/PolicyPage';

const sections = {
  ka: [
    ['ზოგადი დებულებები', 'ZEZVA-ს სერვისით სარგებლობა ნიშნავს ამ პირობებთან თანხმობას. პირობები ვრცელდება როგორც მაღაზიაზე, ისე Trade-in-სა და სარემონტო სერვისზე. ცვლილება ძალაში შედის გამოქვეყნებიდან 7 დღეში.'],
    ['შეკვეთა და გადახდა'],
    ['გატანა ოფისიდან'],
    ['გარანტია და დაბრუნება'],
    ['პასუხისმგებლობის შეზღუდვა'],
    ['დავების გადაწყვეტა'],
  ],
  en: [
    ['General provisions', 'Using ZEZVA services means accepting these terms. They apply to the shop, Trade-in, and repair services. Changes take effect seven days after publication.'],
    ['Orders and payment'],
    ['Office pickup'],
    ['Warranty and returns'],
    ['Limitation of liability'],
    ['Dispute resolution'],
  ],
};

const TermsPage = () => {
  const { i18n } = useTranslation();
  const ka = i18n.language === 'ka';
  return <PolicyPage title={ka ? 'წესები და პირობები' : 'Terms and conditions'} sections={sections[ka ? 'ka' : 'en']} />;
};

export default TermsPage;
