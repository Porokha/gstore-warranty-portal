import React, { useEffect, useState } from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'site_cookie_consent';

const CookieConsentBanner = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let stored = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      stored = null;
    }
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const persist = (value) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      // ignore storage failures
    }
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        left: { xs: 10, md: 16 },
        right: { xs: 10, md: 16 },
        bottom: { xs: 10, md: 16 },
        zIndex: 1400,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          width: 'min(100%, 980px)',
          display: 'flex',
          alignItems: { xs: 'stretch', md: 'center' },
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1.5,
          justifyContent: 'space-between',
          p: { xs: 1.5, md: 2 },
          borderRadius: '22px',
          border: '1px solid rgba(91, 124, 255, 0.18)',
          background: 'rgba(15, 23, 42, 0.94)',
          boxShadow: '0 20px 48px rgba(2, 6, 23, 0.42)',
          backdropFilter: 'blur(18px)',
          pointerEvents: 'auto',
        }}
      >
        <Typography sx={{ color: 'rgba(255,255,255,0.88)', fontSize: { xs: '13px', md: '15px' }, lineHeight: 1.65 }}>
          {t('public.cookieConsent.message')}{' '}
          <Box
            component="button"
            type="button"
            onClick={() => navigate('/privacy')}
            sx={{
              border: 0,
              p: 0,
              m: 0,
              background: 'transparent',
              color: '#9fbcff',
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            {t('public.cookieConsent.linkLabel')}
          </Box>
          .
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, flex: '0 0 auto' }}>
          <Button
            type="button"
            onClick={() => persist('accepted')}
            sx={{
              minWidth: 'auto',
              px: 1.8,
              py: 1.2,
              borderRadius: '14px',
              background: '#5b7cff',
              color: '#fff',
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: '"BPG Banner Quadrosquare Caps", sans-serif',
              '&:hover': {
                background: '#4b6df4',
              },
            }}
          >
            {t('public.cookieConsent.accept')}
          </Button>
          <IconButton
            type="button"
            aria-label={t('public.cookieConsent.close')}
            onClick={() => persist('dismissed')}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '14px',
              border: '1px solid rgba(148, 163, 184, 0.4)',
              color: 'rgba(255,255,255,0.86)',
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default CookieConsentBanner;
