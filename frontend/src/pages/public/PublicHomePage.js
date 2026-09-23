import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PublicHomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(requestedTab === 'case' ? 'case' : 'warranty');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    setActiveTab(requestedTab === 'case' ? 'case' : 'warranty');
  }, [requestedTab]);

  const selectTab = (tab) => {
    setActiveTab(tab);
    setCode('');
    setSearchParams({ tab }, { replace: true });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!code.trim() || !phone.trim()) return;

    navigate(activeTab === 'case' ? '/search/case' : '/search/warranty', {
      state: activeTab === 'case'
        ? { caseNumber: code.trim(), phone: phone.trim() }
        : { warrantyId: code.trim(), phone: phone.trim() },
    });
  };

  return (
    <main className="zzv-status-search-page">
      <div className="zzv-status-search-panel">
        <h1>{t('public.statusLookup.title')}</h1>
        <p>{t('public.statusLookup.subtitle')}</p>

        <div className="zzv-status-search-tabs" role="tablist" aria-label={t('public.statusLookup.title')}>
          {['warranty', 'case'].map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={activeTab === tab ? 'is-active' : ''}
              onClick={() => selectTab(tab)}
            >
              {t(`public.statusLookup.${tab}`)}
            </button>
          ))}
        </div>

        <form className="zzv-status-search-form" onSubmit={handleSubmit}>
          <label className="zzv-status-search-field">
            <span>{t(activeTab === 'case' ? 'public.statusLookup.caseCode' : 'public.statusLookup.warrantyCode')}</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={activeTab === 'case' ? 'SCN-XXXXXX' : 'WRN-XXXX-XXXX'}
              autoComplete="off"
              required
            />
            {activeTab === 'warranty' && <small>{t('public.statusLookup.codeHint')}</small>}
          </label>
          <label className="zzv-status-search-field">
            <span>{t('public.statusLookup.phone')}</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="5XX XXX XXX"
              autoComplete="tel"
              required
            />
          </label>
          <button className="zzv-status-search-submit" type="submit">{t('public.statusLookup.submit')}</button>
        </form>
      </div>
    </main>
  );
};

export default PublicHomePage;
