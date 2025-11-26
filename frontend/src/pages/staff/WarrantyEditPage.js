import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { warrantiesService } from '../../services/warrantiesService';
const WarrantyEditPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: warranty, isLoading } = useQuery(
    ['warranty', id],
    () => warrantiesService.getById(id),
    {
      enabled: !!id,
    }
  );

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_last_name: '',
    customer_phone: '',
    customer_email: '',
    brand: '',
    model: '',
    condition: '',
    personal_identification_number: '',
    admin_notes: '',
  });

  React.useEffect(() => {
    if (warranty) {
      setFormData({
        customer_name: warranty.customer_name || '',
        customer_last_name: warranty.customer_last_name || '',
        customer_phone: warranty.customer_phone || '',
        customer_email: warranty.customer_email || '',
        brand: warranty.brand || '',
        model: warranty.model || '',
        condition: warranty.condition || '',
        personal_identification_number: warranty.personal_identification_number || '',
        admin_notes: warranty.admin_notes || '',
      });
    }
  }, [warranty]);

  const updateMutation = useMutation(
    (data) => warrantiesService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['warranty', id]);
        setSuccess(true);
        setTimeout(() => {
          navigate(`/staff/warranties/${id}`);
        }, 1500);
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Failed to update warranty');
      },
    }
  );

  const handleChange = (field) => (e) => {
    setFormData({
      ...formData,
      [field]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/staff/warranties/${id}`)}
          sx={{ textTransform: 'none' }}
        >
          {t('common.back') || 'Back'}
        </Button>
        <Typography variant="h4">{t('warranty.editWarranty') || 'Edit Warranty'}</Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('warranty.warrantyUpdated') || 'Warranty updated successfully'}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: '#64748b' }}>
                Customer Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('warranty.customerName') || 'Customer Name'}
                value={formData.customer_name}
                onChange={handleChange('customer_name')}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('warranty.customerName') + ' (Last Name)' || 'Customer Last Name'}
                value={formData.customer_last_name}
                onChange={handleChange('customer_last_name')}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('warranty.customerPhone') || 'Customer Phone'}
                value={formData.customer_phone}
                onChange={handleChange('customer_phone')}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('warranty.customerEmail') || 'Customer Email'}
                type="email"
                value={formData.customer_email}
                onChange={handleChange('customer_email')}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, color: '#64748b' }}>
                Product Information (Admin Only)
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('warranty.brand') || 'Brand'}
                value={formData.brand}
                onChange={handleChange('brand')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('warranty.model') || 'Model'}
                value={formData.model}
                onChange={handleChange('model')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('warranty.condition') || 'Condition'}</InputLabel>
                <Select
                  value={formData.condition}
                  onChange={handleChange('condition')}
                  label={t('warranty.condition') || 'Condition'}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="New">New</MenuItem>
                  <MenuItem value="Like New">Like New</MenuItem>
                  <MenuItem value="Excellent">Excellent</MenuItem>
                  <MenuItem value="Good">Good</MenuItem>
                  <MenuItem value="Fair">Fair</MenuItem>
                  <MenuItem value="Poor">Poor</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('warranty.personalIdentificationNumber') || 'P/N (Personal Identification Number)'}
                value={formData.personal_identification_number}
                onChange={handleChange('personal_identification_number')}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, color: '#64748b' }}>
                Admin Notes
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label={t('warranty.adminNotes') || 'Admin Notes'}
                placeholder={t('warranty.adminNotesPlaceholder') || 'Internal notes (not visible to customers)'}
                value={formData.admin_notes}
                onChange={handleChange('admin_notes')}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/staff/warranties/${id}`)}
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={updateMutation.isLoading ? <CircularProgress size={20} /> : <Save />}
                  disabled={updateMutation.isLoading}
                >
                  {t('warranty.saveChanges') || 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default WarrantyEditPage;

