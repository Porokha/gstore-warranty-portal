import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const TermsPage = () => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 60px)',
        background: 'linear-gradient(180deg, #fbf9ff 0%, #f3ecff 100%)',
        py: 5,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 5 },
            borderRadius: 4,
            bgcolor: '#ffffff',
            border: '1px solid #e3d7ff',
            boxShadow: '0 28px 90px rgba(63, 30, 120, 0.1)',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#18181b', mb: 2 }}>
            {t('public.menuTerms')}
          </Typography>
          <Typography variant="body1" sx={{ color: '#5b5568', lineHeight: 1.8 }}>
            {t('public.termsPlaceholder')}
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default TermsPage;
