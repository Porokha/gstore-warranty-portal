import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const PublicHomePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(requestedTab === 'case' ? 'case' : 'warranty');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setActiveTab(requestedTab === 'case' ? 'case' : 'warranty');
  }, [requestedTab]);

  const selectTab = (tab) => {
    setActiveTab(tab);
    setCode('');
    setError('');
    setSearchParams({ tab }, { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!code.trim() || !phone.trim() || loading) return;

    setLoading(true);
    setError('');
    try {
      const response = await api.post(activeTab === 'case' ? '/public/search/case' : '/public/search/warranty', activeTab === 'case'
        ? { case_number: code.trim(), phone: phone.trim() }
        : { warranty_id: code.trim(), phone: phone.trim() });

      navigate(activeTab === 'case' ? '/search/case' : '/search/warranty', {
        state: activeTab === 'case'
          ? { caseNumber: code.trim(), phone: phone.trim(), result: response.data }
          : { warrantyId: code.trim(), phone: phone.trim(), result: response.data },
      });
    } catch (err) {
      setError([401, 404].includes(err.response?.status) ? 'not-found' : 'unavailable');
    } finally {
      setLoading(false);
    }
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
              onChange={(event) => { setCode(event.target.value); setError(''); }}
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
              onChange={(event) => { setPhone(event.target.value); setError(''); }}
              placeholder="5XX XXX XXX"
              autoComplete="tel"
              required
            />
          </label>
          {error && <div className="zzv-status-search-error" role="alert">
            <strong>{error === 'not-found'
              ? (i18n.language === 'ka' ? 'ასეთი ჩანაწერი ვერ ვიპოვეთ' : 'We could not find that record')
              : (i18n.language === 'ka' ? 'შემოწმება ვერ მოხერხდა' : 'We could not check right now')}</strong>
            <span>{error === 'not-found'
              ? (i18n.language === 'ka' ? 'შეამოწმე კოდი და ნომერი, ან დაგვირეკე' : 'Check the code and phone number, or call us')
              : (i18n.language === 'ka' ? 'სცადე ხელახლა ან დაგვირეკე' : 'Please try again or call us')}</span>
          </div>}
          {error && <a className="zzv-status-search-call" href="tel:+995322606060"><span>☎</span><span><strong>+995 322 60 60 60</strong><small>{i18n.language === 'ka' ? 'ორშ–შაბ 10:00–19:00' : 'Mon–Sat 10:00–19:00'}</small></span><span aria-hidden="true">›</span></a>}
          <button className="zzv-status-search-submit" type="submit" disabled={loading}>{loading ? (i18n.language === 'ka' ? 'მოწმდება…' : 'Checking…') : t('public.statusLookup.submit')}</button>
        </form>
      </div>
    </main>
  );
};

export default PublicHomePage;
