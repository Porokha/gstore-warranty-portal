import React from 'react';
import { Box, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ compact = false }) => {
  const { i18n } = useTranslation();
  const current = i18n.language === 'en' ? 'en' : 'ka';

  const setLanguage = (lang) => {
    if (lang !== current) {
      i18n.changeLanguage(lang);
    }
  };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        p: '4px',
        borderRadius: compact ? '12px' : '14px',
        background: '#eef0f3',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
        gap: '2px',
      }}
    >
      {[
        { code: 'en', label: 'EN' },
        { code: 'ka', label: 'GE' },
      ].map((item) => {
        const active = current === item.code;

        return (
          <Button
            key={item.code}
            type="button"
            onClick={() => setLanguage(item.code)}
            sx={{
              minWidth: 'auto',
              px: compact ? 1.35 : 1.8,
              py: compact ? 0.7 : 0.9,
              borderRadius: compact ? '9px' : '10px',
              fontSize: compact ? '11px' : '12px',
              lineHeight: 1,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontFamily: '"BPG Banner Quadrosquare Caps", sans-serif',
              color: active ? '#5b7cff' : '#636e72',
              background: active ? '#ffffff' : 'transparent',
              boxShadow: active ? '0 2px 8px rgba(17, 24, 39, 0.08)' : 'none',
              '&:hover': {
                background: active ? '#ffffff' : 'rgba(255,255,255,0.55)',
              },
            }}
          >
            {item.label}
          </Button>
        );
      })}
    </Box>
  );
};

export default LanguageSwitcher;
