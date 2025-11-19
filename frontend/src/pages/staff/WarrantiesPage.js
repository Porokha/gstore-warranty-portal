import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';

const WarrantiesPage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        {t('common.warranties')}
      </Typography>
      <Typography>Warranties list will be implemented here</Typography>
    </div>
  );
};

export default WarrantiesPage;

