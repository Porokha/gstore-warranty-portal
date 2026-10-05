import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Autocomplete,
  Paper,
  Divider,
} from '@mui/material';
import { casesService } from '../../services/casesService';
import { paymentsService } from '../../services/paymentsService';
import { usersService } from '../../services/usersService';
import StatusChangeForm from '../../components/cases/StatusChangeForm';
import FileUpload from '../../components/cases/FileUpload';
import StaffDeleteDialog from '../../components/common/StaffDeleteDialog';
import { useAuth } from '../../contexts/AuthContext';
import { printServiceCaseLabel } from '../../utils/serviceCaseLabel';
import { isManagementRole } from '../../utils/roles';

const formatCaseDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(/\//g, '.');
};

const CaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canManageCases = isManagementRole(user?.role);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [internalNote, setInternalNote] = useState('');
  const [internalNoteError, setInternalNoteError] = useState('');
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [deleteNoteError, setDeleteNoteError] = useState('');
  const [caseDeleteOpen, setCaseDeleteOpen] = useState(false);
  const [caseDeleteError, setCaseDeleteError] = useState('');
  const [paymentActionError, setPaymentActionError] = useState('');
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [paymentEditAmount, setPaymentEditAmount] = useState('');
  const [partsWaitingError, setPartsWaitingError] = useState('');
  const [statusDraft, setStatusDraft] = useState(null);
  const closePath = `/staff/cases${location.search || ''}`;

  const { data: case_, isLoading } = useQuery(
    ['case', id],
    () => casesService.getById(id),
    { enabled: !!id }
  );

  const { data: payments } = useQuery(
    ['case-payments', id],
    () => paymentsService.getByCase(id),
    { enabled: !!id }
  );

  const { data: technicians } = useQuery(
    'technicians',
    () => usersService.getTechnicians(),
    { enabled: canManageCases }
  );

  const statusChangeMutation = useMutation(
    (data) => casesService.changeStatus(id, data),
    {
      onSuccess: () => {
        setStatusDraft(null);
        queryClient.invalidateQueries(['case', id]);
        queryClient.invalidateQueries('cases');
        queryClient.invalidateQueries('dashboard');
      },
    }
  );

  const partsWaitingMutation = useMutation(
    (mode) =>
      mode === 'received'
        ? casesService.receivePartsWaiting(id)
        : casesService.startPartsWaiting(id),
    {
      onSuccess: () => {
        setPartsWaitingError('');
        queryClient.invalidateQueries(['case', id]);
        queryClient.invalidateQueries('cases');
        queryClient.invalidateQueries('dashboard');
      },
      onError: (error) => {
        setPartsWaitingError(error.response?.data?.message || 'Could not update parts delivery state');
      },
    }
  );

  const [localCaseData, setLocalCaseData] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize local data when case loads
  React.useEffect(() => {
    if (case_) {
      setLocalCaseData(case_);
      setHasUnsavedChanges(false);
    }
  }, [case_]);

  const updateCaseMutation = useMutation(
    (data) => casesService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['case', id]);
        queryClient.invalidateQueries('cases');
        setHasUnsavedChanges(false);
      },
    }
  );

  const handleStatusChange = (data) => {
    return statusChangeMutation.mutateAsync(data);
  };

  const internalNoteMutation = useMutation(
    (note) => casesService.addInternalNote(id, note),
    {
      onSuccess: () => {
        setInternalNote('');
        setInternalNoteError('');
        queryClient.invalidateQueries(['case', id]);
        queryClient.invalidateQueries('cases');
      },
      onError: (error) => {
        setInternalNoteError(error.response?.data?.message || 'Failed to add internal note');
      },
    }
  );

  const deleteInternalNoteMutation = useMutation(
    (historyId) => casesService.deleteInternalNote(id, historyId),
    {
      onSuccess: () => {
        setNoteToDelete(null);
        setDeleteNoteError('');
        queryClient.invalidateQueries(['case', id]);
        queryClient.invalidateQueries('cases');
      },
      onError: (error) => {
        setDeleteNoteError(error.response?.data?.message || t('case.internalNoteDeleteFailed'));
      },
    }
  );

  const deleteCaseMutation = useMutation(() => casesService.delete(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('cases');
      navigate(closePath);
    },
    onError: (error) => setCaseDeleteError(error.response?.data?.message || t('case.deleteCaseFailed')),
  });

  const markPaymentPaidMutation = useMutation(
    (paymentId) => paymentsService.markAsPaid(paymentId),
    {
      onSuccess: () => {
        setPaymentActionError('');
        queryClient.invalidateQueries(['case', id]);
        queryClient.invalidateQueries(['case-payments', id]);
        queryClient.invalidateQueries('cases');
        queryClient.invalidateQueries('dashboard');
      },
      onError: (error) => {
        setPaymentActionError(error.response?.data?.message || t('payment.markPaidFailed'));
      },
    }
  );

  const markPaymentFailedMutation = useMutation(
    (paymentId) => paymentsService.markAsFailed(paymentId),
    {
      onSuccess: () => {
        setPaymentActionError('');
        queryClient.invalidateQueries(['case', id]);
        queryClient.invalidateQueries(['case-payments', id]);
        queryClient.invalidateQueries('dashboard');
      },
      onError: (error) => {
        setPaymentActionError(error.response?.data?.message || t('payment.markFailedFailed'));
      },
    }
  );

  const sendPaymentReminderMutation = useMutation(
    (paymentId) => paymentsService.sendPaymentReminder(paymentId),
    {
      onSuccess: () => {
        setPaymentActionError('');
        queryClient.invalidateQueries(['case-payments', id]);
        queryClient.invalidateQueries(['case', id]);
      },
      onError: (error) => {
        setPaymentActionError(error.response?.data?.message || t('payment.reminderFailed'));
      },
    }
  );

  const updatePaymentMutation = useMutation(
    ({ paymentId, payload }) => paymentsService.update(paymentId, payload),
    {
      onSuccess: () => {
        setPaymentActionError('');
        setEditingPaymentId(null);
        setPaymentEditAmount('');
        queryClient.invalidateQueries(['case-payments', id]);
        queryClient.invalidateQueries(['case', id]);
        queryClient.invalidateQueries('dashboard');
      },
      onError: (error) => {
        setPaymentActionError(error.response?.data?.message || t('payment.updateFailed'));
      },
    }
  );

  const handleAddInternalNote = () => {
    const trimmedNote = internalNote.trim();
    if (!trimmedNote) {
      setInternalNoteError(t('case.internalNoteRequired'));
      return;
    }
    setInternalNoteError('');
    internalNoteMutation.mutate(trimmedNote);
  };

  const handleDeleteInternalNote = () => {
    if (noteToDelete) deleteInternalNoteMutation.mutate(noteToDelete.id);
  };

  const getPaymentStatusLabel = (status) => {
    const labels = {
      pending: t('payment.pending'),
      paid: t('payment.paid'),
      failed: t('payment.failed'),
    };
    return labels[status] || status;
  };

  const getPaymentMethodLabel = (method) => String(method || '').split(',')
    .map((value) => {
      const normalized = value.trim();
      return normalized === 'online' || normalized === 'onsite'
        ? t(`payment.${normalized}`)
        : normalized;
    })
    .filter(Boolean)
    .join(', ');

  const getReminderCooldownRemaining = (payment) => {
    if (!payment.last_reminder_sent_at) return 0;
    const cooldownMs = 30 * 60 * 1000;
    const elapsedMs = Date.now() - new Date(payment.last_reminder_sent_at).getTime();
    return Math.max(0, cooldownMs - elapsedMs);
  };

  const formatReminderCooldown = (milliseconds) => {
    const minutes = Math.ceil(milliseconds / (60 * 1000));
    return t('payment.minutesShort', { count: minutes });
  };

  const startPaymentAmountEdit = (payment) => {
    setPaymentActionError('');
    setEditingPaymentId(payment.id);
    setPaymentEditAmount(payment.offer_amount == null ? '' : String(payment.offer_amount));
  };

  const cancelPaymentAmountEdit = () => {
    setEditingPaymentId(null);
    setPaymentEditAmount('');
  };

  const savePaymentAmountEdit = (payment) => {
    const amount = Number(paymentEditAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      setPaymentActionError(t('payment.invalidAmount'));
      return;
    }

    updatePaymentMutation.mutate({
      paymentId: payment.id,
      payload: {
        offer_amount: amount,
      },
    });
  };

  const handleFieldChange = (field, value) => {
    setLocalCaseData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = () => {
    if (!localCaseData || !hasUnsavedChanges) return;
    
    // Build update object with only changed fields
    const updateData = {};
    Object.keys(localCaseData).forEach((key) => {
      if (case_[key] !== localCaseData[key]) {
        updateData[key] = localCaseData[key];
      }
    });

    if (Object.keys(updateData).length > 0) {
      updateCaseMutation.mutate(updateData);
    }
  };

  // Extract status timestamps from history
  const getStatusTimestamps = () => {
    if (!case_?.status_history) return {};
    const timestamps = {};
    case_.status_history.forEach((history) => {
      if (history.new_status_level && !timestamps[history.new_status_level]) {
        timestamps[history.new_status_level] = history.created_at;
      }
    });
    return timestamps;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!case_ || !localCaseData) {
    return <Alert severity="error">Case not found</Alert>;
  }

  const statusTimestamps = getStatusTimestamps();
  const hasPersistedPayablePayment = payments?.some((payment) => payment.offer_type === 'payable');
  const hasUnsavedPayableDraft =
    statusDraft?.new_status_level === 3 &&
    statusDraft?.result_type === 'payable' &&
    !hasPersistedPayablePayment;
  const statusLabel = t(['', 'status.opened', 'status.investigating', 'status.pending', 'status.completed'][case_.status_level] || 'common.status');
  const technicianName = [case_.assigned_technician?.name, case_.assigned_technician?.last_name].filter(Boolean).join(' ');

  return (
    <main className="zzv-case-detail">
      <button type="button" className="zzv-case-detail__back" onClick={() => navigate(closePath)}>
        <img src="/figma-staff/detail-back.svg" alt="" />{t('common.openCases')}
      </button>
      <section className="zzv-case-detail__card">
        <header className="zzv-case-detail__head">
          <div className="zzv-case-detail__identity">
            <div className="zzv-case-detail__title-row">
              <h1>{localCaseData.case_number}</h1>
              <span className={`zzv-case-detail__status zzv-case-detail__status--${case_.status_level}`}>{statusLabel}</span>
            </div>
            <p>{t('case.detailOpenedAt', { date: formatCaseDateTime(case_.opened_at) })}
              {technicianName && <> · {t('case.technician')} {technicianName}</>}
            </p>
          </div>
          <div className="zzv-case-detail__actions">
            {isAdmin && <button type="button" className="zzv-case-detail__action zzv-case-detail__action--delete" aria-label={t('case.deleteCase')} title={t('case.deleteCase')} onClick={() => { setCaseDeleteError(''); setCaseDeleteOpen(true); }}><img src="/figma-staff/detail-delete.svg" alt="" /></button>}
            <button type="button" className="zzv-case-detail__action zzv-case-detail__action--print" aria-label={t('case.reprintLabel')} onClick={() => printServiceCaseLabel(localCaseData)}>
              <img src="/figma-staff/detail-print.svg" alt="" /><span className="zzv-case-detail__print-full" aria-hidden="true">{t('case.reprintLabel')}</span><span className="zzv-case-detail__print-short" aria-hidden="true">{t('case.printLabelShort')}</span>
            </button>
            <button type="button" className="zzv-case-detail__action zzv-case-detail__action--save" onClick={handleSaveChanges} disabled={!hasUnsavedChanges || updateCaseMutation.isLoading}>
              <img src="/figma-staff/detail-save.svg" alt="" />{updateCaseMutation.isLoading ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </header>
        <Tabs className="zzv-case-detail__tabs" value={tab} onChange={(e, newValue) => setTab(newValue)} variant="scrollable" scrollButtons={false}>
          <Tab label={t('common.details')} />
          <Tab label={t('case.statusAndResult')} />
          <Tab label={t('common.files')} />
          <Tab label={t('common.history')} />
        </Tabs>
        <div className="zzv-case-detail__body">

        {/* Tab 1: Details */}
        {tab === 0 && (
          <div className="zzv-case-detail__sections">
          <section className="zzv-case-detail__section">
            <h2>{t('case.listCase')}</h2>
            <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.caseNumber')}
                value={case_.case_number}
                disabled
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.warrantyId') || 'Warranty ID'}
                value={case_.warranty?.warranty_id || '-'}
                disabled
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.orderId')}
                value={localCaseData?.order_id || ''}
                onChange={(e) => handleFieldChange('order_id', e.target.value ? parseInt(e.target.value) : null)}
                disabled={!canManageCases}
                margin="normal"
                type="number"
              />
            </Grid>
            </Grid>
          </section>
          <section className="zzv-case-detail__section">
            <h2>{t('case.listDevice')}</h2>
            <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.productTitle')}
                value={localCaseData?.product_title || ''}
                onChange={(e) => handleFieldChange('product_title', e.target.value)}
                disabled={!canManageCases}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.sku')}
                value={localCaseData?.sku || ''}
                onChange={(e) => handleFieldChange('sku', e.target.value)}
                disabled={!canManageCases}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.serialNumber')}
                value={localCaseData?.serial_number || ''}
                onChange={(e) => handleFieldChange('serial_number', e.target.value)}
                disabled={!canManageCases}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="IMEI"
                value={localCaseData?.imei || ''}
                onChange={(e) => handleFieldChange('imei', e.target.value)}
                disabled={!canManageCases}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>{t('case.deviceType')}</InputLabel>
                <Select
                  value={localCaseData?.device_type || 'Laptop'}
                  label={t('case.deviceType')}
                  onChange={(e) => handleFieldChange('device_type', e.target.value)}
                  disabled={!canManageCases}
                >
                  <MenuItem value="Laptop">Laptop</MenuItem>
                  <MenuItem value="Phone">Phone</MenuItem>
                  <MenuItem value="Tablet">Tablet</MenuItem>
                  <MenuItem value="Desktop">Desktop</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.productId')}
                value={localCaseData?.product_id || ''}
                onChange={(e) => handleFieldChange('product_id', e.target.value ? parseInt(e.target.value, 10) : null)}
                disabled={!canManageCases}
                margin="normal"
                type="number"
              />
            </Grid>
            </Grid>
          </section>
          <section className="zzv-case-detail__section">
            <h2>{t('case.listCustomer')}</h2>
            <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.customerName')}
                value={localCaseData?.customer_name || ''}
                onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                disabled={!canManageCases}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.customerLastName')}
                value={localCaseData?.customer_last_name || ''}
                onChange={(e) => handleFieldChange('customer_last_name', e.target.value)}
                disabled={!canManageCases}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.phone')}
                value={localCaseData?.customer_phone || ''}
                onChange={(e) => handleFieldChange('customer_phone', e.target.value)}
                disabled={!canManageCases}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.email')}
                value={localCaseData?.customer_email || ''}
                onChange={(e) => handleFieldChange('customer_email', e.target.value)}
                disabled={!canManageCases}
                margin="normal"
                type="email"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label={t('case.customerInitialNote') || "Customer's Initial Note (Problem Description)"}
                value={localCaseData?.customer_initial_note || ''}
                onChange={(e) => handleFieldChange('customer_initial_note', e.target.value)}
                disabled={!canManageCases}
                margin="normal"
              />
            </Grid>
            </Grid>
          </section>
          <section className="zzv-case-detail__section">
            <h2>{t('case.management')}</h2>
            <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.openDate')}
                value={new Date(case_.opened_at).toLocaleString()}
                disabled
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.deadline')}
                value={localCaseData?.deadline_at ? new Date(localCaseData.deadline_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => handleFieldChange('deadline_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                disabled={!canManageCases}
                margin="normal"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {case_.closed_at && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('case.closeDate') || 'Close Date'}
                  value={new Date(case_.closed_at).toLocaleString()}
                  disabled
                  margin="normal"
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>{t('common.priority')}</InputLabel>
                <Select
                  value={localCaseData?.priority || 'normal'}
                  label={t('common.priority')}
                  onChange={(e) => handleFieldChange('priority', e.target.value)}
                  disabled={!canManageCases}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {canManageCases && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>{t('case.technician')}</InputLabel>
                  <Select
                    value={localCaseData?.assigned_technician_id || ''}
                    label={t('case.technician')}
                    onChange={(e) => handleFieldChange('assigned_technician_id', e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <MenuItem value="">{t('common.none')}</MenuItem>
                    {technicians?.map((tech) => (
                      <MenuItem key={tech.id} value={tech.id}>
                        {tech.name} {tech.last_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={[]}
                freeSolo
                value={localCaseData?.tags || []}
                onChange={(event, newValue) => handleFieldChange('tags', newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('common.tags')}
                    margin="normal"
                    disabled={!canManageCases}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={index}
                    />
                  ))
                }
              />
            </Grid>
            </Grid>
          </section>
          </div>
        )}

        {/* Tab 2: Status & Notes */}
        {tab === 1 && (
          <Box>
            {partsWaitingError && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: '6px' }}>
                {partsWaitingError}
              </Alert>
            )}
            {(case_.status_level === 2 || case_.parts_waiting) && (
              <Paper
                variant="outlined"
                className="zzv-case-payment-card zzv-case-payment-card--draft"
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: '6px',
                  borderColor: case_.parts_waiting ? 'warning.main' : 'divider',
                  background: case_.parts_waiting
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(255, 255, 255, 0.9))'
                    : 'background.paper',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'space-between',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {t('case.partsWaitingTitle')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {case_.parts_waiting
                        ? t('case.partsWaitingActiveHelp')
                        : t('case.partsWaitingStartHelp')}
                    </Typography>
                    {case_.parts_waiting_started_at && (
                      <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        label={t('case.partsWaitingStarted', { date: formatCaseDateTime(case_.parts_waiting_started_at) })}
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                  <Button
                    variant={case_.parts_waiting ? 'contained' : 'outlined'}
                    color={case_.parts_waiting ? 'success' : 'warning'}
                    disabled={partsWaitingMutation.isLoading}
                    onClick={() =>
                      partsWaitingMutation.mutate(case_.parts_waiting ? 'received' : 'start')
                    }
                    sx={{ borderRadius: '6px', whiteSpace: 'nowrap' }}
                  >
                    {partsWaitingMutation.isLoading
                      ? t('common.saving')
                      : case_.parts_waiting
                        ? t('case.markPartsReceived')
                        : t('case.partsWaiting')}
                  </Button>
                </Box>
              </Paper>
            )}
            <Box mt={1}>
              <StatusChangeForm
                case_={case_}
                onStatusChange={handleStatusChange}
                isLoading={statusChangeMutation.isLoading}
                onDraftChange={setStatusDraft}
                statusTimestamps={statusTimestamps}
              />
            </Box>
          </Box>
        )}

        {/* Tab 3: Result */}
        {tab === 1 && (hasUnsavedPayableDraft || payments?.length > 0) && (
          <section className="zzv-case-flow__panel zzv-case-flow__payments">
            <h2>{t('payment.offersAndPayments')}</h2>
            <div className="zzv-case-flow__panel-content">
            {hasUnsavedPayableDraft && (
              <Paper
                variant="outlined"
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: '6px',
                  borderColor: 'warning.main',
                  bgcolor: 'rgba(245, 158, 11, 0.08)',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {t('result.payable')} - {t('payment.offerDetails') || 'Offer Details'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('payment.saveOfferFirst')}
                </Typography>
                {statusDraft.offer_amount && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>{t('common.amount')}:</strong> {statusDraft.offer_amount} ₾
                  </Typography>
                )}
                {statusDraft.payment_methods?.length > 0 && (
                  <Typography variant="body2">
                    <strong>{t('payment.method')}:</strong> {getPaymentMethodLabel(statusDraft.payment_methods.join(','))}
                  </Typography>
                )}
                <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                  <Button variant="contained" color="success" size="small" disabled>
                    {t('payment.markPaid')}
                  </Button>
                  <Button variant="outlined" color="error" size="small" disabled>
                    {t('payment.markFailed')}
                  </Button>
                </Box>
              </Paper>
            )}
            
            {payments && payments.length > 0 && (
              <Box>
                {paymentActionError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {paymentActionError}
                  </Alert>
                )}
                {payments.map((payment) => (
                  <Paper
                    key={payment.id}
                    variant="outlined"
                    className="zzv-case-payment-card"
                  >
                    <Box className="zzv-case-payment-card__head" display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          {payment.offer_type === 'payable'
                            ? t('result.payable')
                            : payment.offer_type === 'covered'
                              ? t('result.covered')
                              : payment.offer_type === 'returned'
                                ? t('result.returned')
                                : t('result.replaceable')}
                        </Typography>
                        {editingPaymentId === payment.id ? (
                          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.5 }}>
                            <TextField
                              size="small"
                              type="number"
                              label={t('common.amount')}
                              value={paymentEditAmount}
                              onChange={(event) => setPaymentEditAmount(event.target.value)}
                              inputProps={{ min: 0, step: '0.01' }}
                              sx={{ width: 150 }}
                            />
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => savePaymentAmountEdit(payment)}
                              disabled={updatePaymentMutation.isLoading}
                            >
                              {updatePaymentMutation.isLoading ? t('common.saving') : t('common.save')}
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              onClick={cancelPaymentAmountEdit}
                              disabled={updatePaymentMutation.isLoading}
                            >
                              {t('common.cancel')}
                            </Button>
                          </Box>
                        ) : (
                          <Typography variant="body2">
                            <strong>{t('common.amount')}:</strong> {payment.offer_amount || 0} ₾
                          </Typography>
                        )}
                        {payment.payment_method && (
                          <Typography variant="body2">
                            <strong>{t('payment.method')}:</strong> {getPaymentMethodLabel(payment.payment_method)}
                          </Typography>
                        )}
                        {payment.generated_code && (
                          <Typography variant="body2">
                            <strong>{t('payment.code') || 'Code'}:</strong> {payment.generated_code}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={getPaymentStatusLabel(payment.payment_status)}
                        color={
                          payment.payment_status === 'paid'
                            ? 'success'
                            : payment.payment_status === 'failed'
                              ? 'error'
                              : 'warning'
                        }
                        size="small"
                      />
                    </Box>
                    {canManageCases && payment.payment_status !== 'paid' && editingPaymentId !== payment.id && (
                      <Box className="zzv-case-payment-card__actions" display="flex" gap={1} flexWrap="wrap">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => startPaymentAmountEdit(payment)}
                          disabled={updatePaymentMutation.isLoading}
                        >
                          {t('payment.editAmount')}
                        </Button>
                      </Box>
                    )}
                    {canManageCases && payment.payment_status !== 'paid' && (
                      <Box className="zzv-case-payment-card__actions" display="flex" gap={1} flexWrap="wrap">
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => markPaymentPaidMutation.mutate(payment.id)}
                          disabled={markPaymentPaidMutation.isLoading || markPaymentFailedMutation.isLoading}
                        >
                          {markPaymentPaidMutation.isLoading
                            ? t('common.saving')
                            : t('payment.markPaid')}
                        </Button>
                        {payment.payment_status === 'pending' && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => markPaymentFailedMutation.mutate(payment.id)}
                            disabled={markPaymentPaidMutation.isLoading || markPaymentFailedMutation.isLoading}
                          >
                            {t('payment.markFailed')}
                          </Button>
                        )}
                        {payment.payment_status === 'pending' && payment.offer_type === 'payable' && (() => {
                          const cooldownRemaining = getReminderCooldownRemaining(payment);
                          const reminderDisabled =
                            cooldownRemaining > 0 ||
                            sendPaymentReminderMutation.isLoading ||
                            markPaymentPaidMutation.isLoading ||
                            markPaymentFailedMutation.isLoading;

                          return (
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              onClick={() => sendPaymentReminderMutation.mutate(payment.id)}
                              disabled={reminderDisabled}
                            >
                              {cooldownRemaining > 0
                                ? t('payment.reminderCooldown', { time: formatReminderCooldown(cooldownRemaining) })
                                : sendPaymentReminderMutation.isLoading
                                  ? t('common.saving')
                                  : t('payment.sendReminder')}
                            </Button>
                          );
                        })()}
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            )}
            </div>
          </section>
        )}

        {/* Tab 4: Files */}
        {tab === 2 && (
          <Box>
            <FileUpload caseId={id} />
          </Box>
        )}

        {/* Tab 5: History */}
        {tab === 3 && (
          <div className="zzv-case-history">
            <section className="zzv-case-detail__section zzv-case-history__composer">
              <h2>{t('case.addInternalNote')}</h2>
              <div className="zzv-case-history__composer-body">
              {internalNoteError && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {Array.isArray(internalNoteError) ? internalNoteError.join(', ') : internalNoteError}
                </Alert>
              )}
              <TextField
                fullWidth
                multiline
                minRows={3}
                label={t('common.privateNote', 'Internal note')}
                value={internalNote}
                onChange={(event) => setInternalNote(event.target.value)}
                placeholder={t('case.internalNotePlaceholder', 'Write an internal note for this case...')}
              />
              <div className="zzv-case-history__composer-actions">
                <Button
                  variant="contained"
                  onClick={handleAddInternalNote}
                  disabled={internalNoteMutation.isLoading || !internalNote.trim()}
                >
                  {internalNoteMutation.isLoading ? t('common.saving') : t('common.addNote')}
                </Button>
              </div>
              </div>
            </section>
            {case_.status_history && case_.status_history.length > 0 ? (
              [...case_.status_history]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map((history) => (
                  <article className="zzv-case-history__entry" key={history.id}>
                    <div className="zzv-case-history__entry-meta">
                      <time dateTime={history.created_at}>{formatCaseDateTime(history.created_at)}</time>
                      {history.changed_by_user && (
                        <span>
                          {[history.changed_by_user.name, history.changed_by_user.last_name].filter(Boolean).join(' ') ||
                            history.changed_by_user.username}
                          {history.changed_by_user.username && [history.changed_by_user.name, history.changed_by_user.last_name].some(Boolean)
                            ? ` (@${history.changed_by_user.username})` : ''}
                        </span>
                      )}
                    </div>
                    {history.previous_status_level != null && (
                      <p className="zzv-case-history__transition">
                        <strong>{t('common.status')}</strong>{' '}
                        {t(['', 'status.opened', 'status.investigating', 'status.pending', 'status.completed'][history.previous_status_level] || 'common.status')}
                        <span aria-hidden="true"> → </span>
                        {t(['', 'status.opened', 'status.investigating', 'status.pending', 'status.completed'][history.new_status_level] || 'common.status')}
                      </p>
                    )}
                    {history.new_result && history.new_result !== history.previous_result && (
                      <p className="zzv-case-history__transition">
                        <strong>{t('common.result')}:</strong> {t(`result.${history.new_result}`, { defaultValue: history.new_result })}
                      </p>
                    )}
                    {history.note_public && (
                      <p className="zzv-case-history__note zzv-case-history__note--public">
                        <strong>{t('common.publicNote')}</strong>{history.note_public}
                      </p>
                    )}
                    {history.note_private && (
                      <div className="zzv-case-history__note zzv-case-history__note--private">
                        <p><strong>{t('common.privateNote')}</strong>{history.note_private}</p>
                          {isAdmin &&
                            history.previous_status_level === null &&
                            history.previous_result === null &&
                            history.new_result === null &&
                            !history.note_public &&
                            history.note_private && (
                              <button type="button" onClick={() => { setDeleteNoteError(''); setNoteToDelete(history); }} disabled={deleteInternalNoteMutation.isLoading}>
                                {t('common.delete')}
                              </button>
                            )}
                      </div>
                    )}
                  </article>
                ))
            ) : (
              <div className="zzv-case-history__empty">{t('common.noHistory')}</div>
            )}
          </div>
        )}
        </div>
      </section>
      <StaffDeleteDialog
        open={Boolean(noteToDelete)}
        title={t('case.deleteInternalNote')}
        description={t('case.deleteInternalNoteConfirm')}
        error={deleteNoteError}
        loading={deleteInternalNoteMutation.isLoading}
        onClose={() => { setNoteToDelete(null); setDeleteNoteError(''); }}
        onConfirm={handleDeleteInternalNote}
      />
      {isAdmin && <StaffDeleteDialog
        open={caseDeleteOpen}
        title={t('case.deleteCase')}
        description={t('case.deleteCaseConfirm', { number: case_.case_number })}
        detail={t('case.deleteCaseAuditNote')}
        error={caseDeleteError}
        loading={deleteCaseMutation.isLoading}
        onClose={() => { setCaseDeleteOpen(false); setCaseDeleteError(''); }}
        onConfirm={() => deleteCaseMutation.mutate()}
      />}
    </main>
  );
};

export default CaseDetailPage;
