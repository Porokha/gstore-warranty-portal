import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ResultBar = ({ resultType, size = 'medium' }) => {
  const { t } = useTranslation();
  
  const results = [
    { type: 'covered', label: t('result.covered'), labelGe: 'გარანტიით შეკეთებული', color: '#9e9e9e' },
    { type: 'payable', label: t('result.payable'), labelGe: 'გადასახდელი', color: '#4caf50' },
    { type: 'returned', label: t('result.returned'), labelGe: 'დაბრუნდა როგორც არის', color: '#ff9800' },
    { type: 'replaceable', label: t('result.replaceable'), labelGe: 'შესაცვლელი', color: '#f44336' },
  ];

  const boxSize = size === 'small' ? 20 : size === 'large' ? 40 : 30;
  const gap = size === 'small' ? 2 : 4;

  if (!resultType) {
    return (
      <Box display="flex" gap={gap}>
        {results.map((result) => (
          <Box
            key={result.type}
            sx={{
              width: boxSize,
              height: boxSize,
              backgroundColor: '#e0e0e0',
              borderRadius: 1,
              border: '1px solid #ccc',
            }}
          />
        ))}
      </Box>
    );
  }

  const activeResult = results.find((r) => r.type === resultType);

  return (
    <Box display="flex" gap={gap}>
      {results.map((result) => (
        <Tooltip
          key={result.type}
          title={`${result.label} / ${result.labelGe}`}
          arrow
        >
          <Box
            sx={{
              width: boxSize,
              height: boxSize,
              backgroundColor: result.type === resultType ? result.color : '#e0e0e0',
              borderRadius: 1,
              border: '1px solid #ccc',
              cursor: 'pointer',
            }}
          />
        </Tooltip>
      ))}
    </Box>
  );
};

export default ResultBar;

