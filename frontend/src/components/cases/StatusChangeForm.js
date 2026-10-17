import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Alert,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useAuth } from '../../contexts/AuthContext';
import { isManagementRole } from '../../utils/roles';
import StatusStepper from './StatusStepper';

const StatusChangeForm = ({ case_, onStatusChange, isLoading, onDraftChange, statusTimestamps }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManageCases = isManagementRole(user?.role);

  const [formData, setFormData] = useState({
    new_status_level: case_.status_level,
    require_pickup_pin: false,
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
  const [pickupWarning, setPickupWarning] = useState(false);
  const payablePayment = case_.payments?.find((payment) => payment.offer_type === 'payable');
  const hasPayablePayment = Boolean(payablePayment);
  const hasPaidPayablePayment = case_.payments?.some(
    (payment) => payment.offer_type === 'payable' && payment.payment_status === 'paid'
  );
  const allowsResult = formData.new_status_level === 3 || formData.new_status_level === 4;
  const hasStatusChange = formData.new_status_level !== case_.status_level;
  const hasOfferAction = formData.new_status_level >= 3 &&
    ['payable', 'replaceable'].includes(formData.result_type) &&
    !case_.payments?.some((payment) => payment.offer_type === formData.result_type);
  const hasNotes = Boolean(formData.note_public || formData.note_private);
  const canSubmit =
    hasStatusChange ||
    hasOfferAction ||
    (canManageCases && allowsResult && (formData.result_type !== (case_.result_type || '') || hasNotes));

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      new_status_level: case_.status_level,
      require_pickup_pin: false,
      result_type: case_.result_type || '',
    }));
    if (case_.status_level < 4) setGeneratedCode('');
  }, [case_.id, case_.status_level, case_.result_type]);

  useEffect(() => {
    if (!onDraftChange) return;
    onDraftChange({
      new_status_level: formData.new_status_level,
      result_type: formData.result_type || null,
      offer_amount: formData.offer_amount,
      payment_methods: formData.payment_methods,
    });
  }, [
    formData.new_status_level,
    formData.result_type,
    formData.offer_amount,
    formData.payment_methods,
    onDraftChange,
  ]);

  const statusOptions = [
    { value: 1, label: t('status.opened'), description: t('case.statusOpenedHelp') },
    { value: 2, label: t('status.investigating'), description: t('case.statusInvestigatingHelp') },
    { value: 3, label: t('status.pending'), description: t('case.statusPendingHelp') },
    { value: 4, label: t('status.completed'), description: t('case.statusCompletedHelp') },
  ];
  const selectedStage = statusOptions.find((status) => status.value === formData.new_status_level);
  const nextStage = case_.status_level < 4
    ? statusOptions.find((status) => status.value === case_.status_level + 1)
    : null;
  const resultOptions = [
    { value: 'covered', label: t('result.covered'), description: t('case.resultCoveredHelp') },
    { value: 'payable', label: t('result.payable'), description: t('case.resultPayableHelp') },
    { value: 'returned', label: t('result.returned'), description: t('case.resultReturnedHelp') },
    { value: 'replaceable', label: t('result.replaceable'), description: t('case.resultReplaceableHelp') },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
    setPickupWarning(false);

    // Validation
    if (!canManageCases && formData.new_status_level <= case_.status_level && !hasOfferAction) {
      setError(t('case.technicianForwardOnly'));
      return;
    }

    // Special validation for Covered
    if (formData.result_type === 'covered' && formData.new_status_level === 4 &&
      case_.status_level !== 4 && !formData.note_public) {
      setError(t('case.coveredPublicNoteRequired'));
      return;
    }

    // Special validation for Payable
    if (formData.result_type === 'payable') {
      if (!hasPayablePayment && !formData.offer_amount) {
        setError(t('case.payableAmountRequired'));
        return;
      }
      if (!hasPayablePayment && formData.payment_methods.length === 0) {
        setError(t('case.paymentMethodRequired'));
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
      if (hasOfferAction && !formData.replacement_product_title) {
        setError(t('case.replacementTitleRequired'));
        return;
      }
    }

    if (formData.new_status_level === 4 && !formData.result_type) {
      setError(t('case.completionResultRequired'));
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
      require_pickup_pin: formData.new_status_level === 4 && case_.status_level !== 4
        ? formData.require_pickup_pin
        : undefined,
    };
    if (hasOfferAction && formData.result_type === 'payable') {
      statusChangeData.offer = {
        offer_type: 'payable',
        offer_amount: Number(formData.offer_amount),
        payment_method: formData.payment_methods[0],
        estimated_days_after_payment: formData.estimated_days_after_payment
          ? Number(formData.estimated_days_after_payment)
          : undefined,
      };
    } else if (hasOfferAction && formData.result_type === 'replaceable') {
      statusChangeData.offer = {
        offer_type: 'replaceable',
        replacement_product_title: formData.replacement_product_title.trim(),
        offer_amount: formData.replacement_product_price ? Number(formData.replacement_product_price) : undefined,
      };
    }

    try {
      const savedCase = await onStatusChange(statusChangeData);
      if (savedCase?.pickup_code) setGeneratedCode(savedCase.pickup_code);
      if (savedCase?.pickup_warning) setPickupWarning(true);
      setFormData((prev) => ({ ...prev, note_public: '', note_private: '' }));
      onDraftChange?.(null);
    } catch (err) {
      setError(err.response?.data?.message || t('case.updateFailed'));
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} className="zzv-case-flow">

      {error && (
        <Alert severity="error" sx={{ mb: 1.25, py: 0.25 }}>
          {error}
        </Alert>
      )}

      {generatedCode && (
        <Alert severity="success" sx={{ mb: 1.25, py: 0.25 }}>
          <Typography variant="body1" gutterBottom>
            <strong>{t('case.generatedPickupCode')}:</strong> {generatedCode}
          </Typography>
          <Typography variant="body2">
            {t('case.pickupCodeHelp')}
          </Typography>
        </Alert>
      )}
      {pickupWarning && <Alert severity="warning" sx={{ mb: 1.25 }}>{t('case.pickupIssueFailed')} {t('case.pickupGenerate')}</Alert>}

      <StatusStepper
        currentStatus={case_.status_level}
        selectedStatus={formData.new_status_level}
        statusTimestamps={statusTimestamps}
        onSelectStatus={selectStatus}
        canSelectStatus={(status) => canManageCases || status > case_.status_level}
      >
      <div className="zzv-case-flow__action-bar">
        <div className="zzv-case-flow__action-copy">
          <span>{hasStatusChange ? t('case.unsavedStage') : nextStage ? t('case.nextStage') : t('case.currentStage')}</span>
          <strong>{hasStatusChange ? selectedStage?.label : nextStage?.label || selectedStage?.label}</strong>
          <p>{hasStatusChange ? selectedStage?.description : nextStage?.description || selectedStage?.description}</p>
        </div>
        <div className="zzv-case-flow__stage-controls">
          {canSubmit ? (
            <button type="submit" className="zzv-case-flow__advance" disabled={isLoading}>
              {t('common.updateStatus')} <ArrowForwardRoundedIcon fontSize="small" />
            </button>
          ) : case_.status_level < 4 && (
            <button type="button" className="zzv-case-flow__advance" onClick={() => selectStatus(case_.status_level + 1)}>
              {t('case.moveToNextStage')} <ArrowForwardRoundedIcon fontSize="small" />
            </button>
          )}
        </div>
      </div>
      </StatusStepper>

      {formData.new_status_level === 4 && case_.status_level !== 4 && (
        <section className="zzv-case-flow__panel">
          <FormControlLabel
            control={<Checkbox checked={formData.require_pickup_pin}
              onChange={(event) => setFormData((prev) => ({ ...prev, require_pickup_pin: event.target.checked }))} />}
            label={t('case.requirePickupPin')}
          />
          <p className="zzv-case-flow__helper">{t('case.requirePickupPinHelp')}</p>
        </section>
      )}

      {allowsResult && (
        <section className="zzv-case-flow__panel">
          <h2>{t('common.result')}</h2>
          <div className="zzv-case-flow__result-grid">
            {resultOptions.map((result) => {
              const isSelected = formData.result_type === result.value;
              return (
                <button type="button"
                  key={result.value}
                  onClick={() => setFormData((prev) => ({ ...prev, result_type: result.value }))}
                  className={`zzv-case-flow__result ${isSelected ? 'is-selected' : ''}`}
                  aria-pressed={isSelected}
                >
                  <img src={`/figma-staff/result-${result.value}.svg`} alt="" />
                  <strong>{result.label}</strong>
                  <span>{result.description}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {!allowsResult && (
        <section className="zzv-case-flow__panel">
          <h2>{t('common.result')}</h2>
          <div className="zzv-case-flow__locked">
            <img src="/figma-staff/result-lock.svg" alt="" />{t('case.outcomeAvailableLater')}
          </div>
        </section>
      )}

      {/* Special fields for Payable */}
      {formData.result_type === 'payable' && !hasPayablePayment && formData.new_status_level >= 3 && (
        <section className="zzv-case-flow__panel">
          <h2>{t('payment.offerDetails')}</h2>
          <div className="zzv-case-flow__payment-fields">
          <TextField
            fullWidth
            type="number"
            label={t('common.amount') || 'Offer Amount'}
            name="offer_amount"
            value={formData.offer_amount}
            onChange={handleChange}
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
            inputProps={{ min: 1 }}
          />
          <div className="zzv-case-flow__method-field">
            <span>{t('payment.allowedMethods')}</span>
            <div className="zzv-case-flow__method-options" role="group" aria-label={t('payment.allowedMethods')}>
              {[
                { value: 'online', label: t('payment.online'), methods: ['online'] },
                { value: 'onsite', label: t('payment.onsite'), methods: ['onsite'] },
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  aria-pressed={formData.payment_methods.length === method.methods.length && method.methods.every((item) => formData.payment_methods.includes(item))}
                  onClick={() => setFormData((prev) => ({ ...prev, payment_methods: method.methods }))}
                >{method.label}</button>
              ))}
            </div>
          </div>
          </div>
        </section>
      )}

      {formData.result_type === 'payable' && hasPayablePayment && (
        <Alert severity={payablePayment.payment_status === 'paid' ? 'success' : 'warning'} sx={{ mt: 1.25, py: 0.25 }}>
          {payablePayment.payment_status === 'paid'
            ? t('payment.payableAlreadyPaid')
            : t('payment.payableAlreadyPending')}
        </Alert>
      )}

      {/* Special fields for Replaceable */}
      {formData.result_type === 'replaceable' && hasOfferAction && (
        <section className="zzv-case-flow__panel">
          <h2>{t('replacement.details')}</h2>
          <div className="zzv-case-flow__payment-fields">
          <TextField
            fullWidth
            label={t('replacement.productTitle') || 'Replacement Product Title'}
            name="replacement_product_title"
            value={formData.replacement_product_title}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            type="number"
            label={t('replacement.internalPrice') || 'Internal Price'}
            name="replacement_product_price"
            value={formData.replacement_product_price}
            onChange={handleChange}
            inputProps={{ min: 0, step: 0.01 }}
          />
          </div>
        </section>
      )}

      <details className="zzv-case-flow__panel zzv-case-flow__note-panel" open={formData.result_type === 'covered' ? true : undefined}>
        <summary>{t('case.statusNotes')}</summary>
        <div className="zzv-case-flow__panel-content">
          <p className="zzv-case-flow__helper">{t('case.statusNotesHelp')}</p>
          <div className="zzv-case-flow__notes">
        <TextField
          fullWidth
          multiline
          rows={2}
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
          rows={2}
          label={t('common.privateNote')}
          name="note_private"
          value={formData.note_private}
          onChange={handleChange}
          margin="normal"
        />
          </div>
        </div>
      </details>
    </Box>
  );
};

export default StatusChangeForm;
