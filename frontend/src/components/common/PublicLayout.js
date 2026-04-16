import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Button } from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ZevaLogo from './ZevaLogo';

const PublicLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();

  const menuItems = [
    { label: t('public.menuShop'), path: '/' },
    { label: t('public.menuService'), path: '/warranty-service' },
    { label: t('public.menuTerms'), path: '/terms' },
  ];
  
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
            justifyContent: 'space-between',
            minHeight: '60px !important',
            px: 3,
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              flex: '0 0 220px',
              '&:hover': { opacity: 0.9 },
            }}
            onClick={() => navigate('/')}
          >
            <Box sx={{ '& img': { width: '110px !important', maxWidth: '110px' } }}>
              <ZevaLogo size="large" variant="default" />
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 1, md: 2.5 },
              flex: 1,
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
              flex: '0 0 80px',
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
    </Box>
  );
};

export default PublicLayout;
