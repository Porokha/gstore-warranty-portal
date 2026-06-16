import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const TradeInPage = () => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(180deg, #fbf9ff 0%, #f3ecff 100%)',
        py: 8,
      }}
    >
      <Container maxWidth="md">
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 34, md: 54 },
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: '#18181b',
            mb: 1.5,
          }}
        >
          {t('public.tradeIn.title')}
        </Typography>
        <Typography sx={{ color: '#6f6680', fontSize: { xs: 15, md: 17 } }}>
          {t('public.tradeIn.placeholder')}
        </Typography>
      </Container>
    </Box>
  );
};

export default TradeInPage;
