import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';

const CasesPage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        {t('common.openCases')}
      </Typography>
      <Typography>Cases list will be implemented here</Typography>
    </div>
  );
};

export default CasesPage;

