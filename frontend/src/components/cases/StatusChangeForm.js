import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Button,
  ButtonBase,
  Alert,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip,
  Divider,
} from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import { useAuth } from '../../contexts/AuthContext';
import { paymentsService } from '../../services/paymentsService';
import { useMutation, useQueryClient } from 'react-query';

const StatusChangeForm = ({ case_, onStatusChange, isLoading }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManageCases = ['admin', 'manager'].includes(user?.role);

  const [formData, setFormData] = useState({
    new_status_level: case_.status_level,
    result_type: case_.result_type || '',
    note_public: '',
    note_private: '',
    // For Payable
    offer_amount: '',
    estimated_days_after_payment: '',
    payment_methods: [],
    // For Replaceable
    replacement_product_title: '',
    replacement_product_price: '',
  });

  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const payablePayment = case_.payments?.find((payment) => payment.offer_type === 'payable');
  const hasPayablePayment = Boolean(payablePayment);
  const hasPaidPayablePayment = case_.payments?.some(
    (payment) => payment.offer_type === 'payable' && payment.payment_status === 'paid'
  );
  const allowsResult = formData.new_status_level === 3 || formData.new_status_level === 4;
  const hasStatusChange = formData.new_status_level !== case_.status_level;
  const hasOfferAction =
    formData.result_type === 'payable' && !hasPayablePayment && formData.new_status_level === 3;
  const hasNotes = Boolean(formData.note_public || formData.note_private);
  const canSubmit =
    hasStatusChange ||
    hasOfferAction ||
    (canManageCases && allowsResult && (formData.result_type || hasNotes));

  const createOfferMutation = useMutation(
    (data) => paymentsService.createOffer(case_.id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['case', case_.id]);
        queryClient.invalidateQueries(['case-payments', case_.id]);
      },
    }
  );

  const generateCodeMutation = useMutation(
    (paymentId) => paymentsService.generateCode(paymentId, {
      estimated_days_after_payment: formData.estimated_days_after_payment || null,
    }),
    {
      onSuccess: (data) => {
        setGeneratedCode(data.generated_code);
      },
    }
  );

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      new_status_level: case_.status_level,
      result_type: case_.result_type || '',
    }));
  }, [case_]);

  const statusOptions = [
    { value: 1, label: t('status.opened'), description: t('case.statusOpenedHelp') },
    { value: 2, label: t('status.investigating'), description: t('case.statusInvestigatingHelp') },
    { value: 3, label: t('status.pending'), description: t('case.statusPendingHelp') },
    { value: 4, label: t('status.completed'), description: t('case.statusCompletedHelp') },
  ];
  const resultOptions = [
    { value: 'covered', label: t('result.covered'), description: t('case.resultCoveredHelp') },
    { value: 'payable', label: t('result.payable'), description: t('case.resultPayableHelp') },
    { value: 'returned', label: t('result.returned'), description: t('case.resultReturnedHelp') },
    { value: 'replaceable', label: t('result.replaceable'), description: t('case.resultReplaceableHelp') },
  ];

  // Technicians can only move forward
  const availableStatuses = canManageCases
    ? statusOptions
    : statusOptions.filter((s) => s.value >= case_.status_level);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      payment_methods: checked
        ? [...prev.payment_methods, name]
        : prev.payment_methods.filter((m) => m !== name),
    }));
  };

  const selectStatus = (status) => {
    setFormData((prev) => ({
      ...prev,
      new_status_level: status,
      result_type: status < 3 ? '' : prev.result_type,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setGeneratedCode('');

    // Validation
    if (!canManageCases && formData.new_status_level <= case_.status_level) {
      setError('Technicians can only move status forward');
      return;
    }

    // Special validation for Covered
    if (formData.result_type === 'covered' && !formData.note_public) {
      setError('Public note is required when setting result to Covered');
      return;
    }

    // Special validation for Payable
    if (formData.result_type === 'payable') {
      if (!hasPayablePayment && !formData.offer_amount) {
        setError('Offer amount is required for Payable result');
        return;
      }
      if (!hasPayablePayment && formData.payment_methods.length === 0) {
        setError('At least one payment method must be selected');
        return;
      }
      if (formData.new_status_level === 4 && !hasPaidPayablePayment) {
        setError(t('payment.payableCompletionBlocked'));
        return;
      }
      if (formData.new_status_level !== 3 && formData.new_status_level !== 4) {
        setError(t('payment.payableRequiresPending'));
        return;
      }
    }

    // Special validation for Replaceable
    if (formData.result_type === 'replaceable') {
      if (!formData.replacement_product_title) {
        setError('Replacement product title is required');
        return;
      }
    }

    if (formData.new_status_level === 4 && !formData.result_type) {
      setError('Result type is required when completing a case');
      return;
    }

    if (
      formData.new_status_level === 4 &&
      formData.result_type === 'payable' &&
      !hasPaidPayablePayment
    ) {
      setError(t('payment.payableCompletionBlocked'));
      return;
    }

    // Handle status change
    const statusChangeData = {
      new_status_level: formData.new_status_level,
      result_type: formData.result_type || null,
      note_public: formData.note_public || null,
      note_private: formData.note_private || null,
    };

    try {
      await onStatusChange(statusChangeData);

      // Handle special interactions
      if (formData.result_type === 'covered' && formData.new_status_level === 4) {
        // Auto-generate code for Covered
        // First create an offer, then generate code
        const offer = await createOfferMutation.mutateAsync({
          offer_type: 'covered',
          offer_amount: 0,
        });
        await generateCodeMutation.mutateAsync(offer.id);
      } else if (formData.result_type === 'payable' && !hasPayablePayment) {
        // Create payable offer
        await createOfferMutation.mutateAsync({
          offer_type: 'payable',
          offer_amount: parseFloat(formData.offer_amount),
          estimated_days_after_payment: formData.estimated_days_after_payment
            ? parseInt(formData.estimated_days_after_payment, 10)
            : null,
          payment_method: formData.payment_methods.join(','),
        });
      } else if (formData.result_type === 'replaceable') {
        // Create replaceable offer
        await createOfferMutation.mutateAsync({
          offer_type: 'replaceable',
          offer_amount: formData.replacement_product_price
            ? parseFloat(formData.replacement_product_price)
            : null,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update case');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: { xs: 2, sm: 2.5 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('case.chooseNextStage')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {canManageCases
              ? t('case.chooseNextStageManagerHelp')
              : t('case.chooseNextStageTechnicianHelp')}
          </Typography>
        </Box>
        {hasStatusChange && (
          <Chip
            icon={<ArrowForwardRoundedIcon />}
            label={t('case.statusChangeReady')}
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {generatedCode && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            <strong>6-digit Code Generated:</strong> {generatedCode}
          </Typography>
          <Typography variant="body2">
            This code will be used when the customer picks up the device.
          </Typography>
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: 1,
        }}
      >
        {availableStatuses.map((status) => {
          const isSelected = formData.new_status_level === status.value;
          const isCurrent = case_.status_level === status.value;
          const isReadOnlyCurrent = !canManageCases && isCurrent;

          return (
            <ButtonBase
              key={status.value}
              disabled={isReadOnlyCurrent}
              onClick={() => selectStatus(status.value)}
              sx={{
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                textAlign: 'left',
                minHeight: 88,
                p: 1.5,
                border: '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                borderRadius: 2.5,
                bgcolor: isSelected ? 'rgba(165,118,255,0.09)' : 'background.paper',
                transition: 'border-color 140ms ease, background-color 140ms ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(165,118,255,0.05)',
                },
                '&.Mui-disabled': {
                  opacity: 1,
                  color: 'inherit',
                },
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  flex: '0 0 32px',
                  display: 'grid',
                  placeItems: 'center',
                  mr: 1.25,
                  borderRadius: '50%',
                  bgcolor: isSelected ? 'primary.main' : 'action.hover',
                  color: isSelected ? '#fff' : 'text.secondary',
                }}
              >
                {isSelected ? <CheckCircleRoundedIcon fontSize="small" /> : status.value}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {status.label}
                  </Typography>
                  {isCurrent && (
                    <Chip label={t('case.currentStage')} size="small" color="primary" />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {status.description}
                </Typography>
              </Box>
            </ButtonBase>
          );
        })}
      </Box>

      {allowsResult && (
        <Box sx={{ mt: 2.5 }}>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <FlagRoundedIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t('case.chooseOutcome')}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {formData.new_status_level === 4
              ? t('case.completedOutcomeHelp')
              : t('case.pendingOutcomeHelp')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 1,
            }}
          >
            {resultOptions.map((result) => {
              const isSelected = formData.result_type === result.value;
              return (
                <ButtonBase
                  key={result.value}
                  onClick={() => setFormData((prev) => ({ ...prev, result_type: result.value }))}
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    minHeight: 72,
                    p: 1.25,
                    border: '1px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    borderRadius: 2.5,
                    bgcolor: isSelected ? 'rgba(165,118,255,0.09)' : 'background.paper',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {result.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {result.description}
                    </Typography>
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>
        </Box>
      )}

      {!allowsResult && (
        <Alert severity="info" sx={{ mt: 2.5 }}>
          {t('case.outcomeAvailableLater')}
        </Alert>
      )}

      {/* Special fields for Payable */}
      {formData.result_type === 'payable' && !hasPayablePayment && formData.new_status_level === 3 && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('result.payable')} - {t('payment.offerDetails') || 'Offer Details'}
          </Typography>
          <TextField
            fullWidth
            type="number"
            label={t('common.amount') || 'Offer Amount'}
            name="offer_amount"
            value={formData.offer_amount}
            onChange={handleChange}
            margin="normal"
            required
            inputProps={{ min: 0, step: 0.01 }}
          />
          <TextField
            fullWidth
            type="number"
            label={t('payment.estimatedDays') || 'Estimated Days After Payment'}
            name="estimated_days_after_payment"
            value={formData.estimated_days_after_payment}
            onChange={handleChange}
            margin="normal"
            inputProps={{ min: 1 }}
          />
          <FormGroup>
            <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
              {t('payment.allowedMethods') || 'Allowed Payment Methods'}
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  name="online"
                  checked={formData.payment_methods.includes('online')}
                  onChange={handleCheckboxChange}
                />
              }
              label={t('payment.online') || 'Online'}
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="onsite"
                  checked={formData.payment_methods.includes('onsite')}
                  onChange={handleCheckboxChange}
                />
              }
              label={t('payment.onsite') || 'Onsite'}
            />
          </FormGroup>
        </Box>
      )}

      {formData.result_type === 'payable' && hasPayablePayment && (
        <Alert severity={payablePayment.payment_status === 'paid' ? 'success' : 'warning'} sx={{ mt: 2 }}>
          {payablePayment.payment_status === 'paid'
            ? t('payment.payableAlreadyPaid')
            : t('payment.payableAlreadyPending')}
        </Alert>
      )}

      {/* Special fields for Replaceable */}
      {formData.result_type === 'replaceable' && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('result.replaceable')} - {t('replacement.details') || 'Replacement Details'}
          </Typography>
          <TextField
            fullWidth
            label={t('replacement.productTitle') || 'Replacement Product Title'}
            name="replacement_product_title"
            value={formData.replacement_product_title}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            type="number"
            label={t('replacement.internalPrice') || 'Internal Price'}
            name="replacement_product_price"
            value={formData.replacement_product_price}
            onChange={handleChange}
            margin="normal"
            inputProps={{ min: 0, step: 0.01 }}
          />
        </Box>
      )}

      <Divider sx={{ mt: 2.5, mb: 2 }} />
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {t('case.statusNotes')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {t('case.statusNotesHelp')}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 1.5,
        }}
      >
        <TextField
          fullWidth
          multiline
          rows={3}
          label={t('common.publicNote')}
          name="note_public"
          value={formData.note_public}
          onChange={handleChange}
          margin="normal"
          required={formData.result_type === 'covered'}
        />

        <TextField
          fullWidth
          multiline
          rows={3}
          label={t('common.privateNote')}
          name="note_private"
          value={formData.note_private}
          onChange={handleChange}
          margin="normal"
        />
      </Box>

      <Box mt={2} display="flex" justifyContent="flex-end">
        <Button
          type="submit"
          variant="contained"
          size="large"
          endIcon={<ArrowForwardRoundedIcon />}
          disabled={
            isLoading ||
            !canSubmit ||
            createOfferMutation.isLoading ||
            generateCodeMutation.isLoading
          }
        >
          {t('common.updateStatus')}
        </Button>
      </Box>
    </Box>
  );
};

export default StatusChangeForm;
