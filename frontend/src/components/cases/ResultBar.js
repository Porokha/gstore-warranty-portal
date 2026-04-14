import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ResultBar = ({ resultType, size = 'medium' }) => {
  const { t } = useTranslation();
  
  const results = [
    { type: 'covered', label: t('result.covered'), labelGe: 'გარანტიით შეკეთებული', color: '#d4befe' },
    { type: 'payable', label: t('result.payable'), labelGe: 'გადასახდელი', color: '#a576ff' },
    { type: 'returned', label: t('result.returned'), labelGe: 'დაბრუნდა როგორც არის', color: '#6d28d9' },
    { type: 'replaceable', label: t('result.replaceable'), labelGe: 'შესაცვლელი', color: '#000000' },
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
              backgroundColor: '#efe7ff',
              borderRadius: 1.5,
              border: '1px solid #d4befe',
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
              backgroundColor: result.type === resultType ? result.color : '#efe7ff',
              borderRadius: 1.5,
              border: '1px solid #d4befe',
              cursor: 'pointer',
            }}
          />
        </Tooltip>
      ))}
    </Box>
  );
};

export default ResultBar;
