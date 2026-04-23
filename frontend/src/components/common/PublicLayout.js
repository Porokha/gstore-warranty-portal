import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Button, Drawer, IconButton } from '@mui/material';
import { Language as LanguageIcon, Menu as MenuIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ZevaLogo from './ZevaLogo';
import CookieConsentBanner from './CookieConsentBanner';

const PublicLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: t('public.menuShop'), path: '/' },
    { label: t('public.menuService'), path: '/warranty-service' },
    { label: t('public.menuTerms'), path: '/terms' },
    { label: t('public.menuPrivacy'), path: '/privacy' },
    { label: t('public.menuReviews'), path: '/reviews' },
  ];

  const trustItems = [t('shop.banner.trust.0'), t('shop.banner.trust.1'), t('shop.banner.trust.2')];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
              gridTemplateColumns: 'auto 1fr auto',
            },
          }}
        >
          <Box
            sx={{
              display: 'none',
              justifySelf: 'start',
              '@media (max-width:920px)': {
                display: 'inline-flex',
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

          <Button
            onClick={() => {
              const newLang = i18n.language === 'en' ? 'ka' : 'en';
              i18n.changeLanguage(newLang);
            }}
            startIcon={<LanguageIcon />}
            sx={{
              color: '#18181b',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '14px',
              border: '1px solid #e3d7ff',
              borderRadius: '999px',
              px: 1.5,
              justifySelf: 'end',
              minWidth: 'auto',
              '@media (max-width:920px)': {
                fontSize: '11px',
                px: 0.85,
                '& .MuiButton-startIcon': {
                  marginRight: 0.35,
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '14px',
                },
              },
              '&:hover': {
                bgcolor: '#f3ecff',
              },
            }}
          >
            {i18n.language === 'en' ? 'EN' : 'KA'}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, bgcolor: '#fbf9ff' }}>
        <Outlet />
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
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(14px)',
            '@media (min-width:921px)': {
              display: 'none',
            },
          },
        }}
      >
        <Box sx={{ display: 'grid', gap: 1.5, pt: 1 }}>
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
            <Button
              onClick={() => {
                const newLang = i18n.language === 'en' ? 'ka' : 'en';
                i18n.changeLanguage(newLang);
              }}
              startIcon={<LanguageIcon />}
              sx={{
                color: '#18181b',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '11px',
                border: '1px solid #e3d7ff',
                borderRadius: '999px',
                px: 1,
                minWidth: 'auto',
                '& .MuiButton-startIcon': {
                  marginRight: 0.35,
                },
              }}
            >
              {i18n.language === 'en' ? 'EN' : 'KA'}
            </Button>
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
        </Box>
      </Drawer>
    </Box>
  );
};

export default PublicLayout;
