import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Drawer, IconButton } from '@mui/material';
import { ChatBubbleRounded as ChatBubbleRoundedIcon, ExpandMoreRounded } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import CookieConsentBanner, { readCookieConsent } from './CookieConsentBanner';

const CLARITY_PROJECT_ID = 'wf9ncn570j';
const GTM_CONTAINER_ID = 'GTM-567T4CBG';

const PublicLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState(null);
  const desktopNavRef = useRef(null);
  const [cookieConsent, setCookieConsent] = useState(readCookieConsent);

  useEffect(() => {
    const updateConsent = (event) => setCookieConsent(event.detail);
    window.addEventListener('zezva:cookie-consent', updateConsent);
    return () => window.removeEventListener('zezva:cookie-consent', updateConsent);
  }, []);

  const menuItems = [
    { label: t('public.menuTradeIn'), path: '/trade-in' },
    { label: t('public.menuShop'), path: '/shop' },
    { label: t('public.menuService'), path: '/warranty-service' },
    { label: t('public.menuAbout'), path: '/#about' },
    { label: t('public.menuTerms'), path: '/terms' },
    { label: t('public.menuPrivacy'), path: '/privacy' },
    { label: t('public.menuReviews'), path: '/reviews' },
  ];
  const headerItems = [menuItems[0], menuItems[2], menuItems[1], menuItems[3]];
  const desktopSubmenus = {
    '/#about': [
      { label: t('public.menuAbout'), path: '/#about' },
      { label: t('public.menuReviews'), path: '/reviews' },
      { label: t('public.menuTerms'), path: '/terms' },
      { label: t('public.menuPrivacy'), path: '/privacy' },
    ],
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setDesktopMenu(null);
    if (location.hash) {
      window.requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!desktopMenu) return undefined;
    const closeOutside = (event) => {
      if (!desktopNavRef.current?.contains(event.target)) setDesktopMenu(null);
    };
    const closeEscape = (event) => {
      if (event.key === 'Escape') setDesktopMenu(null);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [desktopMenu]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }
    if (!cookieConsent.analytics) return undefined;

    if (window.clarity || document.getElementById('clarity-script')) {
      return undefined;
    }

    (function installClarity(c, l, a, r, i) {
      c[a] =
        c[a] ||
        function clarityProxy() {
          (c[a].q = c[a].q || []).push(arguments);
        };
      const script = l.createElement(r);
      script.async = true;
      script.src = `https://www.clarity.ms/tag/${i}`;
      script.id = 'clarity-script';
      const firstScript = l.getElementsByTagName(r)[0];
      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        l.head.appendChild(script);
      }
    })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID);

    return undefined;
  }, [cookieConsent.analytics]);

  const openRespondChat = () => {
    if (typeof window === 'undefined') {
      return;
    }

    setMobileMenuOpen(false);

    let attempts = 0;
    const maxAttempts = 20;

    const tryOpen = () => {
      if (window.$respond?.do) {
        window.$respond.do('chat:open');
        return;
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        window.setTimeout(tryOpen, 150);
      }
    };

    tryOpen();
  };

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }
    if (!cookieConsent.analytics && !cookieConsent.marketing) return undefined;

    if (window.google_tag_manager || document.getElementById('gtm-script')) {
      return undefined;
    }

    (function installGtm(w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      const firstScript = d.getElementsByTagName(s)[0];
      const script = d.createElement(s);
      const dataLayerSuffix = l !== 'dataLayer' ? `&l=${l}` : '';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${i}${dataLayerSuffix}`;
      script.id = 'gtm-script';
      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        d.head.appendChild(script);
      }
    })(window, document, 'script', 'dataLayer', GTM_CONTAINER_ID);

    return undefined;
  }, [cookieConsent.analytics, cookieConsent.marketing]);

  return (
    <Box className="zzv-public-layout" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
          title="Google Tag Manager"
        />
      </noscript>

      <Box component="header" className="zzv-public-header">
        <div className="zzv-public-header-inner">
          <button type="button" className="zzv-public-header-logo" onClick={() => navigate('/')} aria-label="ZEZVA">
            <picture>
              <source media="(max-width: 920px)" srcSet="/figma-home/trade-nav-logo-mobile.svg" />
              <img src="/figma-home/trade-nav-logo.svg" alt="ZEZVA" />
            </picture>
          </button>
          <nav ref={desktopNavRef} className="zzv-public-header-nav" aria-label={t('common.menu')}>
            {headerItems.map((item) => (
              <div className="zzv-public-header-nav-item" key={item.path}>
                <button
                  type="button"
                  className={location.pathname === item.path || desktopMenu === item.path ? 'is-active' : ''}
                  aria-expanded={desktopSubmenus[item.path] ? desktopMenu === item.path : undefined}
                  onClick={() => desktopSubmenus[item.path] ? setDesktopMenu(desktopMenu === item.path ? null : item.path) : navigate(item.path)}
                >
                  {item.label}
                  {desktopSubmenus[item.path] && <ExpandMoreRounded className="zzv-public-nav-chevron" aria-hidden="true" />}
                </button>
                {desktopMenu === item.path && desktopSubmenus[item.path] && (
                  <div className="zzv-public-header-dropdown">
                    {desktopSubmenus[item.path].map((subitem) => (
                      <button key={subitem.path} type="button" onClick={() => { setDesktopMenu(null); navigate(subitem.path); }}>
                        {subitem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="zzv-public-header-actions">
            <span className="zzv-public-header-action" title={i18n.language === 'ka' ? 'ღია თემა' : 'Light theme'}>
              <img src="/figma-home/trade-nav-sun.svg" alt="" />
            </span>
            <button
              type="button"
              className="zzv-public-header-action"
              onClick={() => i18n.changeLanguage(i18n.language === 'ka' ? 'en' : 'ka')}
              aria-label={i18n.language === 'ka' ? 'Switch to English' : 'ქართულზე გადართვა'}
            >
              <img src={i18n.language === 'ka' ? '/figma-home/trade-nav-flag-ge.svg' : '/figma-home/trade-nav-flag-uk.svg'} alt="" />
            </button>
          </div>
          <button type="button" className="zzv-public-header-menu" aria-label={t('common.menu')} onClick={() => setMobileMenuOpen(true)}>
            <img src="/figma-home/trade-nav-menu.svg" alt="" />
          </button>
        </div>
      </Box>

      <Box sx={{ flex: 1, bgcolor: '#fbf9ff' }}>
        <Outlet />
      </Box>

      <Box
        sx={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 1201,
          '@media (max-width:920px)': {
            display: 'none',
          },
        }}
      >
        <IconButton
          aria-label="Open chat"
          onClick={openRespondChat}
          sx={{
            width: 60,
            height: 60,
            borderRadius: '999px',
            border: '1px solid #e2d4ff',
            bgcolor: '#744de0',
            color: '#ffffff',
            boxShadow: '0 18px 34px rgba(116, 77, 224, 0.24)',
            '&:hover': {
              bgcolor: '#653dd8',
            },
          }}
        >
          <ChatBubbleRoundedIcon sx={{ fontSize: 28 }} />
        </IconButton>
      </Box>

      <CookieConsentBanner />

      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{ className: 'zzv-public-mobile-drawer' }}
      >
        <div className="zzv-public-mobile-menu">
          <div className="zzv-public-mobile-menu-head">
            <img src="/figma-home/trade-nav-logo-mobile.svg" alt="ZEZVA" />
            <button type="button" aria-label={i18n.language === 'ka' ? 'დახურვა' : 'Close menu'} onClick={() => setMobileMenuOpen(false)}>
              <img src="/figma-home/menu-close.svg" alt="" />
            </button>
          </div>
          <div className="zzv-public-mobile-menu-body">
            <nav className="zzv-public-mobile-menu-tiles" aria-label={t('common.menu')}>
              {[
                { path: '/trade-in', icon: 'menu-repeat.svg', label: t('public.menuTradeIn'), detail: '2 წუთი' },
                { path: '/shop', icon: 'menu-shop.svg', label: t('public.menuShop'), detail: '2,700+' },
                { path: '/warranty-service?tab=case', icon: 'menu-service.svg', label: i18n.language === 'ka' ? 'შეკეთება' : 'Service', detail: '1,200+' },
                { path: '/warranty-service?tab=warranty', icon: 'menu-warranty.svg', label: i18n.language === 'ka' ? 'გარანტია' : 'Warranty', detail: '12 თვე' },
              ].map((item) => (
                <button key={item.path} type="button" onClick={() => { setMobileMenuOpen(false); navigate(item.path); }}>
                  <img src={`/figma-home/${item.icon}`} alt="" />
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </button>
              ))}
            </nav>
            <nav className="zzv-public-mobile-menu-links" aria-label={i18n.language === 'ka' ? 'დამატებითი' : 'More'}>
              <button type="button" onClick={() => { setMobileMenuOpen(false); navigate('/#about'); }}>{t('public.menuAbout')}</button>
              <button type="button" onClick={openRespondChat}>{i18n.language === 'ka' ? 'კონტაქტი' : 'Contact'}</button>
              <a href="https://gstore.ge" target="_blank" rel="noreferrer">Gstore ↗</a>
            </nav>
            <div className="zzv-public-mobile-menu-controls">
              <span>{i18n.language === 'ka' ? 'ენა' : 'Language'}</span>
              <div role="group" aria-label={i18n.language === 'ka' ? 'ენა' : 'Language'}>
                <button type="button" className={i18n.language === 'ka' ? 'is-active' : ''} aria-label="ქართული" aria-pressed={i18n.language === 'ka'} onClick={() => i18n.changeLanguage('ka')}><img src="/figma-home/trade-nav-flag-ge.svg" alt="" /></button>
                <button type="button" className={i18n.language === 'en' ? 'is-active' : ''} aria-label="English" aria-pressed={i18n.language === 'en'} onClick={() => i18n.changeLanguage('en')}><img src="/figma-home/trade-nav-flag-uk.svg" alt="" /></button>
              </div>
            </div>
          </div>
          <div className="zzv-public-mobile-menu-bottom">
            <button type="button" onClick={() => { setMobileMenuOpen(false); navigate('/trade-in'); }}>{i18n.language === 'ka' ? 'შეაფასე ტელეფონი' : 'Value your phone'}</button>
          </div>
        </div>
      </Drawer>
    </Box>
  );
};

export default PublicLayout;
