import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { paymentsService } from '../../services/paymentsService';
import { useMutation, useQueryClient } from 'react-query';

const StatusChangeForm = ({ case_, onStatusChange, isLoading }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

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

  const createOfferMutation = useMutation(
    (data) => paymentsService.createOffer(case_.id, data),
    {
      onSuccess: () => {
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
    { value: 1, label: t('status.opened'), labelGe: 'ღია' },
    { value: 2, label: t('status.investigating'), labelGe: 'კვლევა' },
    { value: 3, label: t('status.pending'), labelGe: 'მოლოდინში' },
    { value: 4, label: t('status.completed'), labelGe: 'დასრულებული' },
  ];

  // Technicians can only move forward
  const availableStatuses = isAdmin
    ? statusOptions
    : statusOptions.filter((s) => s.value > case_.status_level);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setGeneratedCode('');

    // Validation
    if (!isAdmin && formData.new_status_level <= case_.status_level) {
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
      if (!formData.offer_amount) {
        setError('Offer amount is required for Payable result');
        return;
      }
      if (formData.payment_methods.length === 0) {
        setError('At least one payment method must be selected');
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
      } else if (formData.result_type === 'payable') {
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
    <Box component="form" onSubmit={handleSubmit}>
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

      <FormControl fullWidth margin="normal">
        <InputLabel>{t('common.newStatus')}</InputLabel>
        <Select
          name="new_status_level"
          value={formData.new_status_level}
          onChange={handleChange}
          label={t('common.newStatus')}
        >
          {availableStatuses.map((status) => (
            <MenuItem key={status.value} value={status.value}>
              {status.label} / {status.labelGe}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {(formData.new_status_level === 3 || formData.new_status_level === 4) && (
        <FormControl fullWidth margin="normal">
          <InputLabel>{t('common.result')}</InputLabel>
          <Select
            name="result_type"
            value={formData.result_type}
            onChange={handleChange}
            label={t('common.result')}
          >
            <MenuItem value="">{t('common.none')}</MenuItem>
            <MenuItem value="covered">{t('result.covered')}</MenuItem>
            <MenuItem value="payable">{t('result.payable')}</MenuItem>
            <MenuItem value="returned">{t('result.returned')}</MenuItem>
            <MenuItem value="replaceable">{t('result.replaceable')}</MenuItem>
          </Select>
        </FormControl>
      )}

      {/* Special fields for Payable */}
      {formData.result_type === 'payable' && (
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

      <Box mt={2}>
        <Button
          type="submit"
          variant="contained"
          disabled={
            isLoading ||
            formData.new_status_level === case_.status_level ||
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
