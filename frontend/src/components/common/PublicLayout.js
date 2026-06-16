import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Button, Drawer, IconButton } from '@mui/material';
import { Menu as MenuIcon, ChatBubbleRounded as ChatBubbleRoundedIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ZevaLogo from './ZevaLogo';
import CookieConsentBanner from './CookieConsentBanner';
import LanguageSwitcher from './LanguageSwitcher';

const CLARITY_PROJECT_ID = 'wf9ncn570j';
const GTM_CONTAINER_ID = 'GTM-567T4CBG';

const PublicLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: t('public.menuShop'), path: '/shop' },
    { label: t('public.menuService'), path: '/warranty-service' },
    { label: t('public.menuTerms'), path: '/terms' },
    { label: t('public.menuPrivacy'), path: '/privacy' },
    { label: t('public.menuReviews'), path: '/reviews' },
  ];

  const trustItems = [t('shop.banner.trust.0'), t('shop.banner.trust.1'), t('shop.banner.trust.2')];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

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
  }, []);

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
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
          title="Google Tag Manager"
        />
      </noscript>

      <AppBar
        position="sticky"
        sx={{
          bgcolor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 8px 30px rgba(17, 17, 17, 0.06)',
          zIndex: 1000,
        }}
      >
        <Toolbar
          sx={{
            minHeight: '60px !important',
            px: { xs: 1.25, sm: 2, md: 3 },
            gap: 2,
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            '@media (max-width:920px)': {
              minHeight: '52px !important',
              gap: 0.75,
              gridTemplateColumns: '76px minmax(0, 1fr) 76px',
            },
          }}
        >
          <Box
            sx={{
              display: 'none',
              justifySelf: 'start',
              '@media (max-width:920px)': {
                display: 'inline-flex',
                width: '76px',
              },
            }}
          >
            <IconButton
              aria-label={t('common.menu')}
              onClick={() => setMobileMenuOpen(true)}
              sx={{
                color: '#18181b',
                border: '1px solid #e3d7ff',
                borderRadius: '14px',
                width: 38,
                height: 38,
              }}
            >
              <MenuIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              justifySelf: 'start',
              cursor: 'pointer',
              '@media (max-width:920px)': {
                justifyContent: 'center',
                justifySelf: 'center',
                width: '100%',
              },
              '&:hover': { opacity: 0.9 },
            }}
            onClick={() => navigate('/')}
          >
            <Box
              sx={{
                '& img': { width: '110px !important', maxWidth: '110px' },
                '@media (max-width:920px)': {
                  '& img': { width: '94px !important', maxWidth: '94px' },
                },
              }}
            >
              <ZevaLogo size="large" variant="default" />
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 1, md: 2.5 },
              justifySelf: 'center',
              '@media (max-width:920px)': {
                display: 'none',
              },
            }}
          >
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
                    color: isActive ? '#18181b' : '#5b5568',
                    textTransform: 'none',
                    fontWeight: isActive ? 800 : 700,
                    fontSize: { xs: '13px', md: '14px' },
                    minWidth: 'auto',
                    px: 1,
                    borderRadius: 999,
                    '&:hover': {
                      bgcolor: '#f3ecff',
                      color: '#18181b',
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          <Box
            sx={{
              justifySelf: 'end',
              '@media (max-width:920px)': {
                width: '76px',
                display: 'flex',
                justifyContent: 'flex-end',
              },
            }}
          >
            <LanguageSwitcher compact />
          </Box>
        </Toolbar>
      </AppBar>

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
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(14px)',
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
