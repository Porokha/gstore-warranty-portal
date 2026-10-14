import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Paper, Switch, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { shopService } from '../../services/shopService';
import { tradeInService } from '../../services/tradeInService';
import SignaturePad from '../../components/trade-in/SignaturePad';

const ShopAdminSettingsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [publicMaintenanceEnabled, setPublicMaintenanceEnabled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [signatureDraft, setSignatureDraft] = useState('');
  const [signatureSaved, setSignatureSaved] = useState(false);
  const signatureQuery = useQuery(['trade-in-own-signature'], tradeInService.getOwnTradeInSignature, { retry: false });
  const signatureMutation = useMutation(() => tradeInService.saveOwnTradeInSignature(signatureDraft), {
    onSuccess: (value) => {
      queryClient.setQueryData(['trade-in-own-signature'], value);
      setSignatureDraft('');
      setSignatureSaved(true);
    },
  });

  const { data, isLoading } = useQuery(['shop-admin-settings'], () => shopService.getAdminSettings(), {
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (data) {
      setPublicMaintenanceEnabled(Boolean(data.enabled));
    }
  }, [data]);

  const updateMutation = useMutation(
    (payload) => shopService.updateAdminSettings(payload),
    {
      onSuccess: (updated) => {
        queryClient.setQueryData(['shop-admin-settings'], updated);
        queryClient.invalidateQueries(['shop-admin-settings']);
        queryClient.invalidateQueries(['public-flags']);
        setSaveError('');
        setSaved(true);
        window.setTimeout(() => setSaved(false), 3000);
      },
      onError: (error) => {
        setPublicMaintenanceEnabled(Boolean(data?.enabled));
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to save settings. Please try again.';
        setSaved(false);
        setSaveError(Array.isArray(message) ? message.join(', ') : message);
      },
    },
  );

  return (
    <Box className="zzv-shop-settings">
      <header className="zzv-shop-settings__heading">
        <h1>{t('shopSettings.title')}</h1>
        <p>{t('shopSettings.description')}</p>
      </header>

      {saved ? <Alert severity="success">{t('shopSettings.saved')}</Alert> : null}
      {saveError ? <Alert severity="error">{saveError}</Alert> : null}

      <Paper className="zzv-shop-settings__panel" elevation={0}>
        <h2>{t('shopSettings.technicalMode')}</h2>
        <Box className="zzv-shop-settings__row">
          <Box className="zzv-shop-settings__copy">
            <Typography component="h3">{publicMaintenanceEnabled ? t('shopSettings.maintenanceOn') : t('shopSettings.siteOpen')}</Typography>
            <Typography component="p">{publicMaintenanceEnabled ? t('shopSettings.maintenanceDescription') : t('shopSettings.openDescription')}</Typography>
          </Box>
          <span className={`zzv-shop-settings__badge ${publicMaintenanceEnabled ? 'is-maintenance' : ''}`}>
            {publicMaintenanceEnabled ? t('shopSettings.maintenanceBadge') : t('shopSettings.openBadge')}
          </span>
          <Switch
            inputProps={{ 'aria-label': t('shopSettings.technicalMode') }}
            checked={publicMaintenanceEnabled}
            onChange={(event) => {
              setSaved(false);
              setSaveError('');
              setPublicMaintenanceEnabled(event.target.checked);
              updateMutation.mutate({ enabled: event.target.checked });
            }}
            disabled={isLoading || updateMutation.isLoading}
          />
        </Box>
      </Paper>
      <Paper className="zzv-shop-settings__panel" elevation={0} sx={{ mt: 2, p: 2.5, maxWidth: 680 }}>
        <h2>Trade-in · ჩემი ხელმოწერა</h2>
        <Typography sx={{ mb: 2, color: '#667085', fontSize: 13 }}>აქ შენახული ხელმოწერა შეგიძლიათ გამოიყენოთ მხოლოდ თქვენს მიერ გაფორმებულ Trade-in ხელშეკრულებაზე. შეცვლისას ძველი ხელმოწერა ჩანაცვლდება, უკვე გაფორმებული PDF კი უცვლელი დარჩება.</Typography>
        {signatureQuery.data?.signature && <Box sx={{ mb: 2, p: 1, border: '1px solid #e5e1ed', borderRadius: 2 }}><Typography sx={{ fontSize: 11, color: '#667085' }}>შენახული ხელმოწერა</Typography><img src={signatureQuery.data.signature} alt="შენახული ხელმოწერა" style={{ maxWidth: '100%', height: 80, objectFit: 'contain' }} /></Box>}
        <SignaturePad onChange={(value) => { setSignatureDraft(value); setSignatureSaved(false); }} clearLabel="წაშლა და ხელახლა დახატვა" />
        {signatureSaved && <Alert severity="success" sx={{ mt: 1 }}>ხელმოწერა შენახულია.</Alert>}
        {signatureMutation.isError && <Alert severity="error" sx={{ mt: 1 }}>ხელმოწერის შენახვა ვერ მოხერხდა.</Alert>}
        <Button sx={{ mt: 1.5 }} variant="contained" disabled={!signatureDraft || signatureMutation.isLoading} onClick={() => signatureMutation.mutate()}>ხელმოწერის შენახვა</Button>
      </Paper>
    </Box>
  );
};

export default ShopAdminSettingsPage;
