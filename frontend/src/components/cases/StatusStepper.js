import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import RadioButtonCheckedRoundedIcon from '@mui/icons-material/RadioButtonCheckedRounded';
import LockClockRoundedIcon from '@mui/icons-material/LockClockRounded';
import { useTranslation } from 'react-i18next';

const StatusStepper = ({ currentStatus, statusTimestamps = {} }) => {
  const { t } = useTranslation();

  const steps = [
    { value: 1, label: t('status.opened'), description: t('case.statusOpenedHelp') },
    { value: 2, label: t('status.investigating'), description: t('case.statusInvestigatingHelp') },
    { value: 3, label: t('status.pending'), description: t('case.statusPendingHelp') },
    { value: 4, label: t('status.completed'), description: t('case.statusCompletedHelp') },
  ];
  const currentStep = steps.find((step) => step.value === currentStatus) || steps[0];

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1,
          px: 1.5,
          py: 1.25,
          mb: 1,
          border: '1px solid',
          borderColor: 'primary.light',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, rgba(165,118,255,0.14), rgba(255,255,255,0.96) 68%)',
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em' }}
          >
            {t('common.currentStatus')}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: -0.25 }}>
            {currentStep.label}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {currentStep.description}
          </Typography>
        </Box>
        <Chip
          icon={<RadioButtonCheckedRoundedIcon />}
          label={t('case.stageOf', { current: currentStatus, total: steps.length })}
          color="primary"
          size="small"
          sx={{ fontWeight: 700, borderRadius: '6px' }}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, minmax(0, 1fr))' },
          gap: 0.75,
        }}
      >
        {steps.map((step) => {
          const isCompleted = step.value < currentStatus;
          const isCurrent = step.value === currentStatus;
          const timestamp = statusTimestamps[step.value];

          return (
            <Box
              key={step.value}
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0.75,
                minWidth: 0,
                px: 1,
                py: 0.875,
                border: '1px solid',
                borderColor: isCurrent ? 'primary.main' : isCompleted ? 'success.light' : 'divider',
                borderRadius: '6px',
                bgcolor: isCurrent
                  ? 'rgba(165,118,255,0.09)'
                  : isCompleted
                    ? 'rgba(46,125,50,0.06)'
                    : 'background.paper',
              }}
            >
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  flex: '0 0 26px',
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '50%',
                  color: isCurrent || isCompleted ? '#fff' : 'text.secondary',
                  bgcolor: isCurrent ? 'primary.main' : isCompleted ? 'success.main' : 'action.hover',
                  fontWeight: 700,
                }}
              >
                {isCompleted ? (
                  <CheckRoundedIcon sx={{ fontSize: 16 }} />
                ) : isCurrent ? (
                  <RadioButtonCheckedRoundedIcon sx={{ fontSize: 15 }} />
                ) : (
                  <LockClockRoundedIcon sx={{ fontSize: 15 }} />
                )}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    color: isCurrent ? 'primary.main' : 'text.secondary',
                    fontWeight: 700,
                  }}
                >
                  {t('case.stageNumber', { number: step.value })}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {step.label}
                </Typography>
                {timestamp && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.25 }}
                  >
                    {new Date(timestamp).toLocaleString()}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default StatusStepper;
