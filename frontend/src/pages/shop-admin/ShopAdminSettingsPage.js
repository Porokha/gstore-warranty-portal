import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Switch, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { shopService } from '../../services/shopService';
import { tradeInService } from '../../services/tradeInService';
import SignaturePad from '../../components/trade-in/SignaturePad';
import StaffSignatureQrDialog from '../../components/trade-in/StaffSignatureQrDialog';
import { AddOutlined, CloseOutlined, CreditCardOutlined, DeleteOutline, EditOutlined, LockOutlined, StorefrontOutlined } from '@mui/icons-material';

const ShopAdminSettingsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [publicMaintenanceEnabled, setPublicMaintenanceEnabled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [signatureDraft, setSignatureDraft] = useState('');
  const [signaturePadVersion, setSignaturePadVersion] = useState(0);
  const [signatureEditor, setSignatureEditor] = useState(null);
  const [signatureDelete, setSignatureDelete] = useState(null);
  const [signatureError, setSignatureError] = useState('');
  const [signatureQrOpen, setSignatureQrOpen] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState({ onsite: true, online: false });
  const [paymentMessage, setPaymentMessage] = useState('');
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [credentialsDraft, setCredentialsDraft] = useState({ client_id: '', client_secret: '' });
  const [credentialsMessage, setCredentialsMessage] = useState('');
  const methodEditsRef = useRef(false);
  const paymentQuery = useQuery(['shop-payment-settings'], shopService.getPaymentSettings, { refetchOnWindowFocus: false });
  useEffect(() => {
    if (paymentQuery.data && !methodEditsRef.current) {
      setPaymentDraft({ onsite: paymentQuery.data.onsite, online: paymentQuery.data.online });
    }
  }, [paymentQuery.data]);
  const paymentMutation = useMutation(shopService.updatePaymentSettings, {
    onSuccess: (value) => {
      methodEditsRef.current = false;
      queryClient.setQueryData(['shop-payment-settings'], value);
      setPaymentDraft({ onsite: value.onsite, online: value.online });
      setPaymentMessage(t('shopSettings.paymentSaved'));
    },
    onError: (error) => setPaymentMessage(error.response?.data?.message || t('shopSettings.paymentSaveFailed')),
  });
  const credentialsMutation = useMutation(shopService.updatePaymentSettings, {
    onSuccess: (value) => {
      queryClient.setQueryData(['shop-payment-settings'], value);
      setCredentialsOpen(false);
      setCredentialsDraft({ client_id: '', client_secret: '' });
      setCredentialsMessage('');
      setPaymentMessage(t('shopSettings.credentialsSaved'));
    },
    onError: (error) => setCredentialsMessage(error.response?.data?.message || t('shopSettings.paymentSaveFailed')),
  });
  const paymentDirty = Boolean(paymentQuery.data) && (
    paymentDraft.onsite !== paymentQuery.data.onsite ||
    paymentDraft.online !== paymentQuery.data.online
  );
  const clientIdChanged = credentialsDraft.client_id.trim() !== (paymentQuery.data?.client_id || '');
  const credentialsReady = Boolean(credentialsDraft.client_id.trim() && (
    credentialsDraft.client_secret.trim() ||
    paymentQuery.data?.secret_configured && !clientIdChanged
  ));
  const credentialsDirty = clientIdChanged || Boolean(credentialsDraft.client_secret.trim());
  const updatePaymentMethod = (field, enabled) => {
    const next = { ...paymentDraft, [field]: enabled };
    methodEditsRef.current = next.onsite !== paymentQuery.data?.onsite || next.online !== paymentQuery.data?.online;
    setPaymentMessage('');
    setPaymentDraft(next);
  };
  const openCredentials = () => {
    setCredentialsDraft({ client_id: paymentQuery.data?.client_id || '', client_secret: '' });
    setCredentialsMessage('');
    setCredentialsOpen(true);
  };
  const closeCredentials = () => {
    if (credentialsMutation.isLoading) return;
    setCredentialsOpen(false);
    setCredentialsDraft({ client_id: '', client_secret: '' });
    setCredentialsMessage('');
  };
  const savePayments = () => {
    setPaymentMessage('');
    if (!paymentDraft.onsite && !paymentDraft.online) {
      setPaymentMessage(t('shopSettings.oneMethodRequired'));
      return;
    }
    if (paymentDraft.online && !(paymentQuery.data?.client_id && paymentQuery.data?.secret_configured)) {
      setPaymentMessage(t('shopSettings.credentialsRequired'));
      return;
    }
    paymentMutation.mutate(paymentDraft);
  };
  const saveCredentials = () => {
    setCredentialsMessage('');
    if (!credentialsReady) {
      setCredentialsMessage(t('shopSettings.credentialsRequired'));
      return;
    }
    credentialsMutation.mutate({
      onsite: paymentQuery.data.onsite,
      online: paymentQuery.data.online,
      client_id: credentialsDraft.client_id.trim(),
      client_secret: credentialsDraft.client_secret.trim(),
    });
  };
  const signatureQuery = useQuery(['trade-in-own-signature'], tradeInService.getOwnTradeInSignature, { retry: false });
  const signatureMutation = useMutation((payload) => payload.id
    ? tradeInService.updateOwnSignatureProfile(payload.id, payload.data)
    : tradeInService.createOwnSignatureProfile(payload.data), {
    onSuccess: (value) => {
      queryClient.setQueryData(['trade-in-own-signature'], value);
      setSignatureDraft('');
      setSignatureEditor(null);
      setSignatureError('');
    },
    onError: (error) => setSignatureError(error.response?.data?.message || 'ხელმოწერის შენახვა ვერ მოხერხდა.'),
  });
  const deleteSignatureMutation = useMutation((id) => tradeInService.deleteOwnSignatureProfile(id), {
    onSuccess: () => { signatureQuery.refetch(); setSignatureDelete(null); setSignatureError(''); },
    onError: (error) => setSignatureError(error.response?.data?.message || 'ხელმოწერის წაშლა ვერ მოხერხდა.'),
  });
  const openSignatureEditor = (profile = null) => {
    setSignatureEditor({ id: profile?.id || null, title: profile?.title || '' });
    setSignatureDraft('');
    setSignatureError('');
    setSignaturePadVersion((version) => version + 1);
  };
  const saveSignature = () => {
    const title = signatureEditor?.title.trim();
    if (!title || (!signatureEditor.id && !signatureDraft)) return;
    signatureMutation.mutate({ id: signatureEditor.id, data: { title, ...(signatureDraft ? { signature: signatureDraft } : {}) } });
  };

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
              <Switch inputProps={{ 'aria-label': t('shopSettings.onsitePayment') }} checked={paymentDraft.onsite} onChange={(event) => updatePaymentMethod('onsite', event.target.checked)} disabled={paymentQuery.isLoading || paymentMutation.isLoading} />
            </div>
            <div className="zzv-shop-settings__method">
              <span className="zzv-shop-settings__method-icon"><CreditCardOutlined fontSize="small" /></span>
              <div className="zzv-shop-settings__method-copy">
                <Typography component="h3">{t('shopSettings.bogPayment')}</Typography>
                <Typography>{t('shopSettings.bogPaymentDescription')}</Typography>
                <span className={`zzv-shop-settings__credential-status ${paymentQuery.data?.secret_configured ? 'is-ready' : ''}`}>{t(paymentQuery.data?.secret_configured ? 'shopSettings.bogConfigured' : 'shopSettings.bogNotConfigured')}</span>
              </div>
              <span className={`zzv-shop-settings__method-state ${paymentDraft.online ? 'is-on' : ''}`}>{t(`shopSettings.${paymentDraft.online ? 'enabled' : 'disabled'}`)}</span>
              <Button className="zzv-shop-settings__edit-credentials" size="small" variant="outlined" startIcon={<EditOutlined fontSize="small" />} onClick={openCredentials} disabled={paymentQuery.isLoading || credentialsMutation.isLoading}>{t('shopSettings.editCredentials')}</Button>
              <Switch inputProps={{ 'aria-label': t('shopSettings.bogPayment') }} checked={paymentDraft.online} onChange={(event) => updatePaymentMethod('online', event.target.checked)} disabled={paymentQuery.isLoading || paymentMutation.isLoading} />
            </div>
          </div>
          {paymentMessage && <Alert severity={paymentMutation.isError || !paymentDraft.onsite && !paymentDraft.online || paymentDraft.online && !(paymentQuery.data?.client_id && paymentQuery.data?.secret_configured) ? 'error' : 'success'}>{paymentMessage}</Alert>}
          <div className="zzv-shop-settings__payment-actions">
            <Button variant="contained" disabled={!paymentDirty || paymentMutation.isLoading || paymentQuery.isLoading} onClick={savePayments}>{t('shopSettings.savePayments')}</Button>
          </div>
        </div>
      </Paper>
      <Dialog open={credentialsOpen} onClose={closeCredentials} maxWidth="sm" fullWidth PaperProps={{ className: 'zzv-shop-settings__credentials-dialog' }}>
        <DialogTitle className="zzv-shop-settings__dialog-title">
          <span className="zzv-shop-settings__credentials-icon"><LockOutlined fontSize="small" /></span>
          <span>{t('shopSettings.bogCredentials')}</span>
          <IconButton aria-label={t('shopSettings.cancel')} onClick={closeCredentials} disabled={credentialsMutation.isLoading}><CloseOutlined fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent className="zzv-shop-settings__dialog-content">
          <Typography>{t('shopSettings.bogCredentialsDescription')}</Typography>
          <TextField fullWidth size="small" autoComplete="off" label={t('shopSettings.bogClientId')} value={credentialsDraft.client_id} onChange={(event) => { setCredentialsMessage(''); setCredentialsDraft((value) => ({ ...value, client_id: event.target.value })); }} disabled={credentialsMutation.isLoading} />
          <TextField fullWidth size="small" type="password" autoComplete="new-password" label={t('shopSettings.bogClientSecret')} placeholder={t(paymentQuery.data?.secret_configured ? 'shopSettings.bogSecretKeep' : 'shopSettings.bogSecretNew')} value={credentialsDraft.client_secret} onChange={(event) => { setCredentialsMessage(''); setCredentialsDraft((value) => ({ ...value, client_secret: event.target.value })); }} disabled={credentialsMutation.isLoading} />
          {credentialsMessage && <Alert severity="error">{credentialsMessage}</Alert>}
        </DialogContent>
        <DialogActions className="zzv-shop-settings__dialog-actions">
          <Button onClick={closeCredentials} disabled={credentialsMutation.isLoading}>{t('shopSettings.cancel')}</Button>
          <Button variant="contained" onClick={saveCredentials} disabled={!credentialsDirty || credentialsMutation.isLoading}>{t('shopSettings.saveCredentials')}</Button>
        </DialogActions>
      </Dialog>
      <Paper className="zzv-shop-settings__panel zzv-shop-settings__signature-panel" elevation={0}>
        <div className="zzv-shop-settings__signature-head"><div><h2>Trade-in · ხელმოწერები</h2><p>შეინახეთ რამდენიმე ხელმოწერა და გაფორმებისას აირჩიეთ სასურველი. ცვლილება უკვე გაფორმებულ PDF-ს არ ცვლის.</p></div><Button variant="contained" startIcon={<AddOutlined />} onClick={() => openSignatureEditor()}>ახალი ხელმოწერა</Button></div>
        {signatureQuery.isError && <Alert severity="error">ხელმოწერები ვერ ჩაიტვირთა.</Alert>}
        {signatureError && !signatureEditor && <Alert severity="error">{String(signatureError)}</Alert>}
        {signatureQuery.data?.signatures?.length ? <div className="zzv-shop-settings__signature-list">{signatureQuery.data.signatures.map((profile) => <div className="zzv-shop-settings__signature-card" key={profile.id}><div className="zzv-shop-settings__signature-image"><img src={profile.signature} alt={profile.title} /></div><div className="zzv-shop-settings__signature-meta"><strong>{profile.title}</strong><span>განახლებულია {new Date(profile.updated_at).toLocaleDateString('ka-GE')}</span></div><div className="zzv-shop-settings__signature-actions"><IconButton aria-label={`${profile.title} შეცვლა`} onClick={() => openSignatureEditor(profile)}><EditOutlined fontSize="small" /></IconButton><IconButton aria-label={`${profile.title} წაშლა`} onClick={() => { setSignatureError(''); setSignatureDelete(profile); }}><DeleteOutline fontSize="small" /></IconButton></div></div>)}</div> : !signatureQuery.isLoading && <div className="zzv-shop-settings__signature-empty">ხელმოწერები ჯერ არ არის შენახული.</div>}
      </Paper>
      <Dialog open={Boolean(signatureEditor)} onClose={() => !signatureMutation.isLoading && setSignatureEditor(null)} maxWidth="sm" fullWidth PaperProps={{ className: 'zzv-shop-settings__signature-dialog' }}>
        <DialogTitle>{signatureEditor?.id ? 'ხელმოწერის შეცვლა' : 'ახალი ხელმოწერა'}</DialogTitle>
        <DialogContent className="zzv-shop-settings__signature-editor">
          <TextField label="ხელმოწერის სახელი" fullWidth value={signatureEditor?.title || ''} onChange={(event) => setSignatureEditor((value) => ({ ...value, title: event.target.value }))} inputProps={{ maxLength: 80 }} autoFocus />
          {signatureEditor?.id && !signatureDraft && <div className="zzv-shop-settings__signature-current"><span>ამჟამინდელი ხელმოწერა</span><img src={signatureQuery.data?.signatures?.find((entry) => entry.id === signatureEditor.id)?.signature} alt="ამჟამინდელი ხელმოწერა" /></div>}
          <Typography>{signatureEditor?.id ? 'ხელახლა დახატვა სურვილისამებრ' : 'დახატეთ ხელმოწერა ან გამოიყენეთ QR ტელეფონზე'}</Typography>
          <SignaturePad key={signaturePadVersion} onChange={setSignatureDraft} clearLabel="წაშლა და ხელახლა დახატვა" />
          {signatureError && <Alert severity="error">{String(signatureError)}</Alert>}
        </DialogContent>
        <DialogActions><Button onClick={() => setSignatureEditor(null)} disabled={signatureMutation.isLoading}>გაუქმება</Button><Button variant="outlined" disabled={!signatureEditor?.title.trim() || signatureMutation.isLoading} onClick={() => setSignatureQrOpen(true)}>QR · ტელეფონზე</Button><Button variant="contained" disabled={!signatureEditor?.title.trim() || (!signatureEditor?.id && !signatureDraft) || signatureMutation.isLoading} onClick={saveSignature}>შენახვა</Button></DialogActions>
      </Dialog>
      <Dialog open={Boolean(signatureDelete)} onClose={() => setSignatureDelete(null)} maxWidth="xs" fullWidth PaperProps={{ className: 'zzv-shop-settings__signature-dialog' }}><DialogTitle>ხელმოწერის წაშლა</DialogTitle><DialogContent><Typography>წაიშალოს „{signatureDelete?.title}“? უკვე გაფორმებული PDF-ები უცვლელი დარჩება.</Typography></DialogContent><DialogActions><Button onClick={() => setSignatureDelete(null)} disabled={deleteSignatureMutation.isLoading}>გაუქმება</Button><Button color="error" variant="contained" onClick={() => deleteSignatureMutation.mutate(signatureDelete.id)} disabled={deleteSignatureMutation.isLoading}>წაშლა</Button></DialogActions></Dialog>
      {signatureQrOpen && <StaffSignatureQrDialog profile={signatureEditor} onClose={() => setSignatureQrOpen(false)} onSigned={() => { signatureQuery.refetch(); setSignatureQrOpen(false); setSignatureEditor(null); setSignatureDraft(''); }} />}
    </Box>
  );
};

export default ShopAdminSettingsPage;
