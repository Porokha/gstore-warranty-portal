import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { casesService } from '../../services/casesService';
import { paymentsService } from '../../services/paymentsService';
import { usersService } from '../../services/usersService';
import ResultBar from '../../components/cases/ResultBar';
import StatusStepper from '../../components/cases/StatusStepper';
import StatusChangeForm from '../../components/cases/StatusChangeForm';
import FileUpload from '../../components/cases/FileUpload';
import { useAuth } from '../../contexts/AuthContext';
import { printServiceCaseLabel } from '../../utils/serviceCaseLabel';
import { isManagementRole } from '../../utils/roles';

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
  const [paymentActionError, setPaymentActionError] = useState('');
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
        queryClient.invalidateQueries(['case', id]);
        queryClient.invalidateQueries('cases');
      },
    }
  );

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
        setPaymentActionError(error.response?.data?.message || 'Payment reminder SMS failed');
      },
    }
  );

  const handleAddInternalNote = () => {
    const trimmedNote = internalNote.trim();
    if (!trimmedNote) {
      setInternalNoteError('Internal note is required');
      return;
    }
    setInternalNoteError('');
    internalNoteMutation.mutate(trimmedNote);
  };

  const handleDeleteInternalNote = (historyId) => {
    deleteInternalNoteMutation.mutate(historyId);
  };

  const getPaymentStatusLabel = (status) => {
    const labels = {
      pending: t('payment.pending'),
      paid: t('payment.paid'),
      failed: t('payment.failed'),
    };
    return labels[status] || status;
  };

  const getReminderCooldownRemaining = (payment) => {
    if (!payment.last_reminder_sent_at) return 0;
    const cooldownMs = 30 * 60 * 1000;
    const elapsedMs = Date.now() - new Date(payment.last_reminder_sent_at).getTime();
    return Math.max(0, cooldownMs - elapsedMs);
  };

  const formatReminderCooldown = (milliseconds) => {
    const minutes = Math.ceil(milliseconds / (60 * 1000));
    return `${minutes} min`;
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
  const resultPreview = statusDraft
    ? {
        ...case_,
        status_level: statusDraft.new_status_level,
        result_type: statusDraft.result_type || case_.result_type,
      }
    : case_;
  const hasPersistedPayablePayment = payments?.some((payment) => payment.offer_type === 'payable');
  const hasUnsavedPayableDraft =
    statusDraft?.new_status_level === 3 &&
    statusDraft?.result_type === 'payable' &&
    !hasPersistedPayablePayment;

  return (
    <Dialog open={true} onClose={() => navigate(closePath)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{localCaseData?.case_number || case_?.case_number}</Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Button
                variant="outlined"
                startIcon={<PrintOutlinedIcon />}
                onClick={() => printServiceCaseLabel(localCaseData)}
              >
                {t('case.reprintLabel')}
              </Button>
              {hasUnsavedChanges && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveChanges}
                  disabled={updateCaseMutation.isLoading}
                >
                  {updateCaseMutation.isLoading ? <CircularProgress size={20} /> : t('common.save')}
                </Button>
              )}
              <Button onClick={() => navigate(closePath)}>{t('common.close')}</Button>
            </Box>
          </Box>
        </DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} sx={{ mb: 3 }}>
          <Tab label={t('common.details')} />
          <Tab label={t('common.status')} />
          <Tab label={t('common.result')} />
          <Tab label={t('common.files')} />
          <Tab label={t('common.history')} />
        </Tabs>

        {/* Tab 1: Details */}
        {tab === 0 && (
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.productId')}
                value={localCaseData?.product_id || ''}
                onChange={(e) => handleFieldChange('product_id', e.target.value ? parseInt(e.target.value) : null)}
                disabled={!canManageCases}
                margin="normal"
                type="number"
              />
            </Grid>
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
                label="IMEI"
                value={localCaseData?.imei || ''}
                onChange={(e) => handleFieldChange('imei', e.target.value)}
                disabled={!canManageCases}
                margin="normal"
              />
            </Grid>
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
        )}

        {/* Tab 2: Status & Notes */}
        {tab === 1 && (
          <Box>
            <StatusStepper currentStatus={case_.status_level} statusTimestamps={statusTimestamps} />
            {partsWaitingError && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: '6px' }}>
                {partsWaitingError}
              </Alert>
            )}
            {(case_.status_level === 2 || case_.parts_waiting) && (
              <Paper
                variant="outlined"
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
                      Waiting parts delivery
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {case_.parts_waiting
                        ? 'Deadline is frozen until necessary parts are marked received.'
                        : 'Freeze this investigation deadline while necessary parts are being delivered.'}
                    </Typography>
                    {case_.parts_waiting_started_at && (
                      <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        label={`Started ${new Date(case_.parts_waiting_started_at).toLocaleString()}`}
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
                      ? 'Saving...'
                      : case_.parts_waiting
                        ? 'Mark parts received'
                        : 'Waiting parts'}
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
              />
            </Box>
          </Box>
        )}

        {/* Tab 3: Result */}
        {tab === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('common.result')}
            </Typography>
            <ResultBar resultType={resultPreview.result_type} size="large" />
            {statusDraft && statusDraft.new_status_level !== case_.status_level && (
              <Alert severity="info" sx={{ mt: 2, borderRadius: '6px' }}>
                {t('case.statusChangeReady')}:{' '}
                {statusDraft.new_status_level === 3
                  ? t('status.pending')
                  : statusDraft.new_status_level === 4
                    ? t('status.completed')
                    : statusDraft.new_status_level === 2
                      ? t('status.investigating')
                      : t('status.opened')}
              </Alert>
            )}
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
                  Save the status update first. The payment confirmation buttons will become active
                  immediately after the payable offer is created.
                </Typography>
                {statusDraft.offer_amount && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>{t('common.amount')}:</strong> {statusDraft.offer_amount} ₾
                  </Typography>
                )}
                {statusDraft.payment_methods?.length > 0 && (
                  <Typography variant="body2">
                    <strong>{t('payment.method')}:</strong> {statusDraft.payment_methods.join(', ')}
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
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  {t('payment.offersAndPayments') || 'Offers & Payments'}
                </Typography>
                {paymentActionError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {paymentActionError}
                  </Alert>
                )}
                {payments.map((payment) => (
                  <Paper
                    key={payment.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      display: 'grid',
                      gap: 1.5,
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
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
                        <Typography variant="body2">
                          <strong>{t('common.amount')}:</strong> {payment.offer_amount || 0} ₾
                        </Typography>
                        {payment.payment_method && (
                          <Typography variant="body2">
                            <strong>{t('payment.method')}:</strong> {payment.payment_method}
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
                    {canManageCases && payment.payment_status === 'pending' && (
                      <Box display="flex" gap={1} flexWrap="wrap">
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
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => markPaymentFailedMutation.mutate(payment.id)}
                          disabled={markPaymentPaidMutation.isLoading || markPaymentFailedMutation.isLoading}
                        >
                          {t('payment.markFailed')}
                        </Button>
                        {payment.offer_type === 'payable' && (() => {
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
                                ? `SMS reminder (${formatReminderCooldown(cooldownRemaining)})`
                                : sendPaymentReminderMutation.isLoading
                                  ? t('common.saving')
                                  : 'Send payment SMS'}
                            </Button>
                          );
                        })()}
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            )}

            {canManageCases && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  {t('common.quickActions') || 'Quick Actions'}
                </Typography>
                <Box display="flex" gap={2}>
                  <Button
                    variant="outlined"
                    onClick={() => handleStatusChange({ new_status_level: 4, result_type: 'covered' })}
                  >
                    {t('common.markCovered') || 'Mark Covered'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handleStatusChange({ new_status_level: 4, result_type: 'returned' })}
                  >
                    {t('common.markReturned') || 'Mark Returned'}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Tab 4: Files */}
        {tab === 3 && (
          <Box>
            <FileUpload caseId={id} />
          </Box>
        )}

        {/* Tab 5: History */}
        {tab === 4 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('common.history')}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t('case.addInternalNote', 'Add internal note')}
              </Typography>
              {internalNoteError && (
                <Alert severity="error" sx={{ mb: 2 }}>
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
              <Box mt={1.5} display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  onClick={handleAddInternalNote}
                  disabled={internalNoteMutation.isLoading}
                >
                  {internalNoteMutation.isLoading ? t('common.saving', 'Saving...') : t('common.addNote', 'Add note')}
                </Button>
              </Box>
            </Paper>
            {case_.status_history && case_.status_history.length > 0 ? (
              case_.status_history
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map((history) => (
                  <Paper
                    key={history.id}
                    sx={{ p: 2, mb: 2 }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {new Date(history.created_at).toLocaleString()}
                      {history.changed_by_user && (
                        <>
                          {' '}·{' '}
                          {[history.changed_by_user.name, history.changed_by_user.last_name].filter(Boolean).join(' ') ||
                            history.changed_by_user.username}
                        </>
                      )}
                    </Typography>
                    {history.previous_status_level !== null && (
                      <Typography variant="body1" gutterBottom>
                        <strong>{t('common.status')}:</strong>{' '}
                        {history.previous_status_level} → {history.new_status_level}
                      </Typography>
                    )}
                    {history.new_result && (
                      <Typography variant="body1" gutterBottom>
                        <strong>{t('common.result')}:</strong> {history.new_result}
                      </Typography>
                    )}
                    {history.note_public && (
                      <Box mt={1} p={1} sx={{ backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                        <Typography variant="body2">
                          <strong>{t('common.publicNote')}:</strong> {history.note_public}
                        </Typography>
                      </Box>
                    )}
                    {history.note_private && (
                      <Box mt={1} p={1} sx={{ backgroundColor: '#fff3e0', borderRadius: 1 }}>
                        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>{t('common.privateNote')}:</strong> {history.note_private}
                          </Typography>
                          {isAdmin &&
                            history.previous_status_level === null &&
                            history.previous_result === null &&
                            history.new_result === null &&
                            !history.note_public &&
                            history.note_private && (
                              <Button
                                size="small"
                                color="error"
                                onClick={() => handleDeleteInternalNote(history.id)}
                                disabled={deleteInternalNoteMutation.isLoading}
                                sx={{ flexShrink: 0 }}
                              >
                                {t('common.delete')}
                              </Button>
                            )}
                        </Box>
                      </Box>
                    )}
                  </Paper>
                ))
            ) : (
              <Typography>{t('common.noHistory')}</Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {isAdmin && (
          <Button
            color="error"
            onClick={async () => {
              if (window.confirm(t('case.deleteCaseConfirm'))) {
                try {
                  await casesService.delete(id);
                  queryClient.invalidateQueries('cases');
                  navigate(closePath);
                } catch (error) {
                  alert(error.response?.data?.message || t('common.errorLoading'));
                }
              }
            }}
          >
            {t('case.deleteCase')}
          </Button>
        )}
        <Button onClick={() => navigate(closePath)}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CaseDetailPage;
