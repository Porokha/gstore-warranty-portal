import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

const StatusBar = ({ statusLevel, size = 'medium' }) => {
  const { t } = useTranslation();
  
  const statuses = [
    { level: 1, label: t('status.opened'), labelGe: 'ღია', color: '#9e9e9e' },
    { level: 2, label: t('status.investigating'), labelGe: 'კვლევა', color: '#f44336' },
    { level: 3, label: t('status.pending'), labelGe: 'მოლოდინში', color: '#ff9800' },
    { level: 4, label: t('status.completed'), labelGe: 'დასრულებული', color: '#4caf50' },
  ];

  const boxSize = size === 'small' ? 20 : size === 'large' ? 40 : 30;
  const gap = size === 'small' ? 2 : 4;

  return (
    <Box display="flex" gap={gap}>
      {statuses.map((status) => (
        <Tooltip
          key={status.level}
          title={`${status.label} / ${status.labelGe}`}
          arrow
        >
          <Box
            sx={{
              width: boxSize,
              height: boxSize,
              backgroundColor: status.level <= statusLevel ? status.color : '#e0e0e0',
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

export default StatusBar;

