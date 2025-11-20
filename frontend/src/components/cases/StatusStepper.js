import React from 'react';
import { Stepper, Step, StepLabel, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const StatusStepper = ({ currentStatus, statusTimestamps = {} }) => {
  const { t } = useTranslation();

  const steps = [
    { value: 1, label: t('status.opened'), labelGe: 'ღია' },
    { value: 2, label: t('status.investigating'), labelGe: 'კვლევა' },
    { value: 3, label: t('status.pending'), labelGe: 'მოლოდინში' },
    { value: 4, label: t('status.completed'), labelGe: 'დასრულებული' },
  ];

  const activeStep = currentStatus - 1;

  return (
    <Box sx={{ mb: 3 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((step, index) => (
          <Step key={step.value} completed={index < activeStep}>
            <StepLabel>
              <Box>
                <Typography variant="body2">{step.label}</Typography>
                {statusTimestamps[step.value] && (
                  <Typography variant="caption" color="text.secondary">
                    {new Date(statusTimestamps[step.value]).toLocaleString()}
                  </Typography>
                )}
              </Box>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default StatusStepper;

