import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const PrivacyPage = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ width: 'min(90vw, 2000px)', mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 4, md: 6 } }}>
      <Typography
        variant="h3"
        sx={{
          fontSize: { xs: '32px', md: '48px' },
          lineHeight: 1,
          mb: 2,
          fontFamily: '"BPG Banner Quadrosquare Caps", sans-serif',
        }}
      >
        {t('public.menuPrivacy')}
      </Typography>
      <Typography sx={{ color: '#5B5568', fontSize: { xs: '14px', md: '16px' } }}>
        {t('public.privacyPlaceholder')}
      </Typography>
    </Box>
  );
};

export default PrivacyPage;
