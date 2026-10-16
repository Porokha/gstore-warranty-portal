import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Paper, Switch, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { shopService } from '../../services/shopService';
import { tradeInService } from '../../services/tradeInService';
import SignaturePad from '../../components/trade-in/SignaturePad';
import { CreditCardOutlined, LockOutlined, StorefrontOutlined } from '@mui/icons-material';

const ShopAdminSettingsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [publicMaintenanceEnabled, setPublicMaintenanceEnabled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [signatureDraft, setSignatureDraft] = useState('');
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState({ onsite: true, online: false, client_id: '', client_secret: '' });
  const [paymentMessage, setPaymentMessage] = useState('');
  const paymentQuery = useQuery(['shop-payment-settings'], shopService.getPaymentSettings, { refetchOnWindowFocus: false });
  useEffect(() => {
    if (paymentQuery.data) setPaymentDraft({ ...paymentQuery.data, client_secret: '' });
  }, [paymentQuery.data]);
  const paymentMutation = useMutation(shopService.updatePaymentSettings, {
    onSuccess: (value) => {
      queryClient.setQueryData(['shop-payment-settings'], value);
      setPaymentDraft({ ...value, client_secret: '' });
      setPaymentMessage(t('shopSettings.paymentSaved'));
    },
    onError: (error) => setPaymentMessage(error.response?.data?.message || t('shopSettings.paymentSaveFailed')),
  });
  const paymentDirty = Boolean(paymentQuery.data) && (
    paymentDraft.onsite !== paymentQuery.data.onsite ||
    paymentDraft.online !== paymentQuery.data.online ||
    paymentDraft.client_id !== paymentQuery.data.client_id ||
    Boolean(paymentDraft.client_secret)
  );
  const clientIdChanged = Boolean(paymentQuery.data && paymentDraft.client_id.trim() !== paymentQuery.data.client_id);
  const credentialsReady = Boolean(paymentDraft.client_id.trim() && (
    paymentDraft.client_secret.trim() ||
    paymentDraft.secret_configured && paymentDraft.client_id.trim() === paymentQuery.data?.client_id
  ));
  const credentialsSaved = Boolean(paymentDraft.secret_configured && !paymentDraft.client_secret.trim() && paymentDraft.client_id.trim() === paymentQuery.data?.client_id);
  const savePayments = () => {
    setPaymentMessage('');
    if (!paymentDraft.onsite && !paymentDraft.online) {
      setPaymentMessage(t('shopSettings.oneMethodRequired'));
      return;
    }
    if ((clientIdChanged && !paymentDraft.client_secret.trim()) || (paymentDraft.online && !credentialsReady)) {
      setPaymentMessage(t('shopSettings.credentialsRequired'));
      return;
    }
    paymentMutation.mutate(paymentDraft);
  };
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
      <Paper className="zzv-shop-settings__panel zzv-shop-settings__payment-panel" elevation={0}>
        <h2>{t('shopSettings.payments')}</h2>
        <div className="zzv-shop-settings__payment-body">
          <Typography className="zzv-shop-settings__payment-intro">{t('shopSettings.paymentsDescription')}</Typography>
          <div className="zzv-shop-settings__methods">
            <div className="zzv-shop-settings__method">
              <span className="zzv-shop-settings__method-icon"><StorefrontOutlined fontSize="small" /></span>
              <div className="zzv-shop-settings__method-copy">
                <Typography component="h3">{t('shopSettings.onsitePayment')}</Typography>
                <Typography>{t('shopSettings.onsitePaymentDescription')}</Typography>
              </div>
              <span className={`zzv-shop-settings__method-state ${paymentDraft.onsite ? 'is-on' : ''}`}>{t(`shopSettings.${paymentDraft.onsite ? 'enabled' : 'disabled'}`)}</span>
              <Switch inputProps={{ 'aria-label': t('shopSettings.onsitePayment') }} checked={paymentDraft.onsite} onChange={(event) => { setPaymentMessage(''); setPaymentDraft((value) => ({ ...value, onsite: event.target.checked })); }} disabled={paymentQuery.isLoading || paymentMutation.isLoading} />
            </div>
            <div className="zzv-shop-settings__method">
              <span className="zzv-shop-settings__method-icon"><CreditCardOutlined fontSize="small" /></span>
              <div className="zzv-shop-settings__method-copy">
                <Typography component="h3">{t('shopSettings.bogPayment')}</Typography>
                <Typography>{t('shopSettings.bogPaymentDescription')}</Typography>
              </div>
              <span className={`zzv-shop-settings__method-state ${paymentDraft.online ? 'is-on' : ''}`}>{t(`shopSettings.${paymentDraft.online ? 'enabled' : 'disabled'}`)}</span>
              <Switch inputProps={{ 'aria-label': t('shopSettings.bogPayment') }} checked={paymentDraft.online} onChange={(event) => { setPaymentMessage(''); setPaymentDraft((value) => ({ ...value, online: event.target.checked })); }} disabled={paymentQuery.isLoading || paymentMutation.isLoading} />
            </div>
          </div>
          <div className="zzv-shop-settings__credentials">
            <div className="zzv-shop-settings__credentials-heading">
              <span className="zzv-shop-settings__credentials-icon"><LockOutlined fontSize="small" /></span>
              <div>
                <Typography component="h3">{t('shopSettings.bogCredentials')}</Typography>
                <Typography>{t('shopSettings.bogCredentialsDescription')}</Typography>
              </div>
            </div>
            <div className="zzv-shop-settings__credential-fields">
              <TextField fullWidth size="small" label={t('shopSettings.bogClientId')} value={paymentDraft.client_id} onChange={(event) => { setPaymentMessage(''); setPaymentDraft((value) => ({ ...value, client_id: event.target.value })); }} disabled={paymentMutation.isLoading} />
              <TextField fullWidth size="small" type="password" autoComplete="new-password" label={t('shopSettings.bogClientSecret')} placeholder={t(paymentDraft.secret_configured ? 'shopSettings.bogSecretKeep' : 'shopSettings.bogSecretNew')} value={paymentDraft.client_secret} onChange={(event) => { setPaymentMessage(''); setPaymentDraft((value) => ({ ...value, client_secret: event.target.value })); }} disabled={paymentMutation.isLoading} />
            </div>
            <span className={`zzv-shop-settings__credential-status ${credentialsReady ? 'is-ready' : ''}`}>{t(credentialsSaved ? 'shopSettings.bogConfigured' : credentialsReady ? 'shopSettings.bogReadyToSave' : 'shopSettings.bogNotConfigured')}</span>
          </div>
          {paymentMessage && <Alert severity={paymentMutation.isError || !paymentDraft.onsite && !paymentDraft.online || clientIdChanged && !paymentDraft.client_secret.trim() || paymentDraft.online && !credentialsReady ? 'error' : 'success'}>{paymentMessage}</Alert>}
          <div className="zzv-shop-settings__payment-actions">
            <Button variant="contained" disabled={!paymentDirty || paymentMutation.isLoading || paymentQuery.isLoading} onClick={savePayments}>{t('shopSettings.savePayments')}</Button>
          </div>
        </div>
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
