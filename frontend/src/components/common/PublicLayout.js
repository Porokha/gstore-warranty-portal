import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Drawer, IconButton } from '@mui/material';
import { ChatBubbleRounded as ChatBubbleRoundedIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ZevaLogo from './ZevaLogo';
import CookieConsentBanner, { readCookieConsent } from './CookieConsentBanner';
import LanguageSwitcher from './LanguageSwitcher';

const CLARITY_PROJECT_ID = 'wf9ncn570j';
const GTM_CONTAINER_ID = 'GTM-567T4CBG';

const PublicLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const trustItems = [t('shop.banner.trust.0'), t('shop.banner.trust.1'), t('shop.banner.trust.2')];

  useEffect(() => {
    setMobileMenuOpen(false);
    if (location.hash) {
      window.requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
    }
  }, [location.pathname, location.hash]);

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
          <nav className="zzv-public-header-nav" aria-label={t('common.menu')}>
            {headerItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className={location.pathname === item.path ? 'is-active' : ''}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
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
              {i18n.language === 'ka' ? <img src="/figma-home/trade-nav-flag-ge.svg" alt="" /> : 'EN'}
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
        PaperProps={{
          sx: {
            width: '70vw',
            maxWidth: 320,
            minWidth: 260,
            p: 2,
            display: 'flex',
            background: 'rgba(255,255,255,0.94)',
            backdropFilter: 'blur(18px)',
            borderRight: '1px solid rgba(165,118,254,0.18)',
            '@media (min-width:921px)': {
              display: 'none',
            },
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1, minHeight: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pb: 1,
              borderBottom: '1px solid #efe8ff',
            }}
          >
            <Box sx={{ '& img': { width: '82px !important', maxWidth: '82px' } }}>
              <ZevaLogo size="large" variant="default" />
            </Box>
            <LanguageSwitcher compact />
          </Box>

          <Box sx={{ display: 'grid', gap: 0.5 }}>
            {menuItems.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

              return (
                <Button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    justifyContent: 'space-between',
                    color: isActive ? '#18181b' : '#5b5568',
                    textTransform: 'none',
                    fontWeight: isActive ? 800 : 700,
                    fontSize: '14px',
                    px: 1.25,
                    py: 1.1,
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: isActive ? '#d8c7ff' : '#ece6f8',
                    bgcolor: isActive ? '#f3ecff' : '#ffffff',
                    boxShadow: isActive ? '0 8px 18px rgba(140, 99, 255, 0.12)' : '0 2px 6px rgba(17,17,17,0.04)',
                    fontFamily: 'var(--font-platform-caps)',
                    '&::after': {
                      content: '""',
                      width: 6,
                      height: 6,
                      borderRadius: '999px',
                      bgcolor: isActive ? '#744de0' : '#d3c7eb',
                      flexShrink: 0,
                    },
                    '&:hover': {
                      bgcolor: '#f7f1ff',
                      borderColor: '#dccfff',
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          <Box sx={{ display: 'grid', gap: 1, pt: 1.5, borderTop: '1px solid #efe8ff' }}>
            {trustItems.map((item) => (
              <Box
                key={item}
                sx={{
                  px: 1.4,
                  py: 1.1,
                  borderRadius: '16px',
                  border: '1px solid #eee6fb',
                  bgcolor: '#faf7ff',
                  color: '#5d5670',
                  fontSize: '11px',
                  fontWeight: 700,
                  lineHeight: 1.35,
                  textAlign: 'center',
                }}
              >
                {item}
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 'auto',
              pt: 1.25,
              borderTop: '1px solid #efe8ff',
            }}
          >
            <Button
              onClick={openRespondChat}
              startIcon={<ChatBubbleRoundedIcon sx={{ fontSize: 22 }} />}
              sx={{
                minWidth: 0,
                px: 1.6,
                py: 1,
                gap: 0.75,
                borderRadius: '18px',
                border: '1px solid #e2d4ff',
                bgcolor: '#f5efff',
                color: '#744de0',
                fontWeight: 800,
                fontSize: '12px',
                textTransform: 'none',
                boxShadow: '0 12px 24px rgba(116, 77, 224, 0.12)',
                '&:hover': {
                  bgcolor: '#efe5ff',
                },
              }}
            >
              {i18n.language === 'ka' ? 'კითხვა გაქვს? მოგვწერე' : 'Chat with us'}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default PublicLayout;
