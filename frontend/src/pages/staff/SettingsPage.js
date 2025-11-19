import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Typography,
  Box,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { smsService } from '../../services/smsService';
import { useAuth } from '../../contexts/AuthContext';

const SettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: settings, isLoading } = useQuery('sms-settings', () =>
    smsService.getSettings()
  );

  const [localSettings, setLocalSettings] = useState({
    global_enabled: true,
    send_on_warranty_created: true,
    send_on_case_opened: true,
    send_on_status_change: true,
    send_on_offer_created: true,
    send_on_payment_confirmed: true,
    send_on_case_completed: true,
    send_on_sla_due: true,
    send_on_sla_stalled: true,
    send_on_sla_deadline_1day: true,
  });

  // Update local settings when data loads
  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const updateMutation = useMutation(
    (newSettings) => smsService.updateSettings(newSettings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sms-settings');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      },
    }
  );

  const handleToggle = (key) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(localSettings);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Only admins can access settings
  if (user?.role !== 'admin') {
    return (
      <Alert severity="error">
        {t('common.unauthorized') || 'You do not have permission to access this page'}
      </Alert>
    );
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('common.settings')}</Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={updateMutation.isLoading}
        >
          {updateMutation.isLoading ? (
            <CircularProgress size={20} />
          ) : (
            t('common.save')
          )}
        </Button>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveSuccess(false)}>
          {t('common.settingsSaved') || 'Settings saved successfully'}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('settings.smsNotifications') || 'SMS Notifications'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('settings.smsNotificationsDescription') ||
            'Control when SMS notifications are automatically sent to customers'}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {/* Global Toggle */}
        <Box mb={3}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.global_enabled}
                onChange={() => handleToggle('global_enabled')}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {t('settings.globalEnable') || 'Enable SMS Notifications'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('settings.globalEnableDescription') ||
                    'Master switch to enable/disable all SMS notifications'}
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Individual Event Toggles */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.send_on_warranty_created}
                  onChange={() => handleToggle('send_on_warranty_created')}
                  disabled={!localSettings.global_enabled}
                />
              }
              label={t('settings.sendOnWarrantyCreated') || 'Send when warranty is created'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.send_on_case_opened}
                  onChange={() => handleToggle('send_on_case_opened')}
                  disabled={!localSettings.global_enabled}
                />
              }
              label={t('settings.sendOnCaseOpened') || 'Send when case is opened'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.send_on_status_change}
                  onChange={() => handleToggle('send_on_status_change')}
                  disabled={!localSettings.global_enabled}
                />
              }
              label={t('settings.sendOnStatusChange') || 'Send on status change (with public note)'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.send_on_offer_created}
                  onChange={() => handleToggle('send_on_offer_created')}
                  disabled={!localSettings.global_enabled}
                />
              }
              label={t('settings.sendOnOfferCreated') || 'Send when payable offer is created'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.send_on_payment_confirmed}
                  onChange={() => handleToggle('send_on_payment_confirmed')}
                  disabled={!localSettings.global_enabled}
                />
              }
              label={t('settings.sendOnPaymentConfirmed') || 'Send when payment is confirmed'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.send_on_case_completed}
                  onChange={() => handleToggle('send_on_case_completed')}
                  disabled={!localSettings.global_enabled}
                />
              }
              label={t('settings.sendOnCaseCompleted') || 'Send when case is completed'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.send_on_sla_due}
                  onChange={() => handleToggle('send_on_sla_due')}
                  disabled={!localSettings.global_enabled}
                />
              }
              label={t('settings.sendOnSlaDue') || 'Send when SLA is due'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.send_on_sla_stalled}
                  onChange={() => handleToggle('send_on_sla_stalled')}
                  disabled={!localSettings.global_enabled}
                />
              }
              label={t('settings.sendOnSlaStalled') || 'Send when SLA is stalled'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.send_on_sla_deadline_1day}
                  onChange={() => handleToggle('send_on_sla_deadline_1day')}
                  disabled={!localSettings.global_enabled}
                />
              }
              label={t('settings.sendOnSlaDeadline1day') || 'Send 1 day before deadline'}
            />
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

export default SettingsPage;
