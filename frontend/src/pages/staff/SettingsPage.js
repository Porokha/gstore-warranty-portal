import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';

const SettingsPage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        {t('common.settings')}
      </Typography>
      <Typography>Settings will be implemented here</Typography>
    </div>
  );
};

export default SettingsPage;

