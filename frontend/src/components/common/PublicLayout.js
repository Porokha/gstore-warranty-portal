import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Button, IconButton } from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ZevaLogo from './ZevaLogo';

const PublicLayout = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  
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
            minHeight: '70px !important',
            px: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': { opacity: 0.9 },
            }}
            onClick={() => navigate('/')}
          >
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
              fontSize: '14px',
              border: '1px solid #e3d7ff',
              borderRadius: '999px',
              px: 1.5,
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
