import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ShopPage = () => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 60px)',
        background: 'linear-gradient(180deg, #fbf9ff 0%, #f3ecff 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 6,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            textAlign: 'center',
            bgcolor: '#ffffff',
            border: '1px solid #e3d7ff',
            boxShadow: '0 28px 90px rgba(63, 30, 120, 0.1)',
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 800, color: '#18181b', mb: 1.5 }}>
            {t('public.menuShop')}
          </Typography>
          <Typography variant="body1" sx={{ color: '#5b5568', fontSize: '17px' }}>
            {t('public.shopPlaceholder')}
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default ShopPage;
