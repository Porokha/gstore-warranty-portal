import React, { useState } from 'react';
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
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const StatusChangeForm = ({ case_, onStatusChange, isLoading }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [formData, setFormData] = useState({
    new_status_level: case_.status_level,
    result_type: case_.result_type || '',
    note_public: '',
    note_private: '',
  });

  const [error, setError] = useState('');

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!isAdmin && formData.new_status_level <= case_.status_level) {
      setError('Technicians can only move status forward');
      return;
    }

    if (formData.new_status_level === 4 && !formData.result_type) {
      setError('Result type is required when completing a case');
      return;
    }

    onStatusChange(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <FormControl fullWidth margin="normal">
        <InputLabel>{t('common.newStatus') || 'New Status'}</InputLabel>
        <Select
          name="new_status_level"
          value={formData.new_status_level}
          onChange={handleChange}
          label={t('common.newStatus') || 'New Status'}
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
            <MenuItem value="">{t('common.none') || 'None'}</MenuItem>
            <MenuItem value="covered">{t('result.covered')}</MenuItem>
            <MenuItem value="payable">{t('result.payable')}</MenuItem>
            <MenuItem value="returned">{t('result.returned')}</MenuItem>
            <MenuItem value="replaceable">{t('result.replaceable')}</MenuItem>
          </Select>
        </FormControl>
      )}

      <TextField
        fullWidth
        multiline
        rows={3}
        label={t('common.publicNote') || 'Public Note (visible to customer)'}
        name="note_public"
        value={formData.note_public}
        onChange={handleChange}
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label={t('common.privateNote') || 'Private Note (internal only)'}
        name="note_private"
        value={formData.note_private}
        onChange={handleChange}
        margin="normal"
      />

      <Box mt={2}>
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading || formData.new_status_level === case_.status_level}
        >
          {t('common.updateStatus') || 'Update Status'}
        </Button>
      </Box>
    </Box>
  );
};

export default StatusChangeForm;

