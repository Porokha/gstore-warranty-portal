import React, { useEffect, useState } from 'react';
import { Dialog, Switch } from '@mui/material';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'site_cookie_consent';

export const readCookieConsent = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'accepted') return { analytics: true, marketing: true };
    if (saved === 'necessary' || saved === 'dismissed') return { analytics: false, marketing: false };
    if (saved) {
      const parsed = JSON.parse(saved);
      return { analytics: Boolean(parsed.analytics), marketing: Boolean(parsed.marketing) };
    }
  } catch (error) {
    // Storage can be unavailable in private browsing.
  }
  return { analytics: false, marketing: false };
};

const CookieConsentBanner = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [choices, setChoices] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    try {
      setVisible(!window.localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      setVisible(true);
    }
  }, []);

  const persist = (next) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      // The choice still applies for this page session.
    }
    window.dispatchEvent(new CustomEvent('zezva:cookie-consent', { detail: next }));
    setSettingsOpen(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <aside className="zzv-cookie-bar" aria-label={t('public.cookieConsent.title')}>
        <div className="zzv-cookie-bar-inner">
          <div className="zzv-cookie-copy">
            <strong>{t('public.cookieConsent.title')}</strong>
            <p>{t('public.cookieConsent.description')}</p>
          </div>
          <div className="zzv-cookie-actions">
            <button type="button" className="zzv-cookie-settings-link" onClick={() => setSettingsOpen(true)}>{t('public.cookieConsent.settings')}</button>
            <button type="button" className="zzv-cookie-secondary" onClick={() => persist({ analytics: false, marketing: false })}>{t('public.cookieConsent.necessaryOnly')}</button>
            <button type="button" className="zzv-cookie-primary" onClick={() => persist({ analytics: true, marketing: true })}>{t('public.cookieConsent.accept')}</button>
          </div>
        </div>
      </aside>

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'zzv-cookie-dialog' }}>
        <div className="zzv-cookie-dialog-head">
          <h2>{t('public.cookieConsent.settingsTitle')}</h2>
          <button type="button" onClick={() => setSettingsOpen(false)} aria-label={t('public.cookieConsent.close')}>×</button>
        </div>
        <div className="zzv-cookie-dialog-body">
          <p>{t('public.cookieConsent.settingsIntro')}</p>
          {[
            ['necessary', true],
            ['analytics', choices.analytics],
            ['marketing', choices.marketing],
          ].map(([key, enabled]) => (
            <div className="zzv-cookie-choice" key={key}>
              <div>
                <strong>{t(`public.cookieConsent.${key}Title`)}</strong>
                <span>{t(`public.cookieConsent.${key}Description`)}</span>
              </div>
              <Switch
                checked={enabled}
                disabled={key === 'necessary'}
                onChange={(event) => setChoices((current) => ({ ...current, [key]: event.target.checked }))}
                inputProps={{ 'aria-label': t(`public.cookieConsent.${key}Title`) }}
              />
            </div>
          ))}
          <div className="zzv-cookie-dialog-actions">
            <button type="button" className="zzv-cookie-secondary" onClick={() => persist({ analytics: false, marketing: false })}>{t('public.cookieConsent.necessaryOnly')}</button>
            <button type="button" className="zzv-cookie-primary" onClick={() => persist(choices)}>{t('public.cookieConsent.save')}</button>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default CookieConsentBanner;
