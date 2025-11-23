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
          bgcolor: '#f4e7d3',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
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
              color: '#1e293b',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '14px',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            {i18n.language === 'en' ? 'EN' : 'KA'}
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ flex: 1, bgcolor: '#fcf4e8' }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default PublicLayout;
