import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Grid, Paper } from '@mui/material';

const DashboardPage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        {t('common.dashboard')}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">{t('common.openCases')}</Typography>
            <Typography variant="h4">0</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">{t('common.closeToDeadline')}</Typography>
            <Typography variant="h4">0</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">{t('common.dueCases')}</Typography>
            <Typography variant="h4">0</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">{t('common.activeWarranties')}</Typography>
            <Typography variant="h4">0</Typography>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default DashboardPage;

