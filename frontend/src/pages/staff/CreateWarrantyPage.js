import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from 'react-query';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { warrantiesService } from '../../services/warrantiesService';
import { useQueryClient } from 'react-query';

const CreateWarrantyPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    sku: '',
    imei: '',
    serial_number: '',
    device_type: 'Laptop',
    title: '',
    thumbnail_url: '',
    price: '',
    customer_name: '',
    customer_last_name: '',
    customer_phone: '',
    customer_email: '',
    purchase_date: '',
    warranty_start: '',
    warranty_end: '',
    extended_days: 0,
    order_id: '',
    product_id: '',
  });

  const createMutation = useMutation(
    (data) => warrantiesService.create(data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('warranties');
        navigate(`/staff/warranties/${data.id}`);
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Failed to create warranty');
      },
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? undefined : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const submitData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      order_id: formData.order_id ? parseInt(formData.order_id) : undefined,
      product_id: formData.product_id ? parseInt(formData.product_id) : undefined,
      extended_days: parseInt(formData.extended_days) || 0,
    };

    createMutation.mutate(submitData);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ marginTop: 4, marginBottom: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('common.createWarranty')}
        </Typography>

        <Paper elevation={3} sx={{ padding: 4 }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label={t('case.sku')}
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label={t('case.serialNumber')}
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>{t('case.deviceType')}</InputLabel>
                  <Select
                    name="device_type"
                    value={formData.device_type}
                    onChange={handleChange}
                    label={t('case.deviceType')}
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
                  name="imei"
                  value={formData.imei}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label={t('case.productTitle')}
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label={t('common.price') || 'Price'}
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  margin="normal"
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('common.thumbnailUrl') || 'Thumbnail URL'}
                  name="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label={t('case.customerName')}
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label={t('case.customerLastName')}
                  name="customer_last_name"
                  value={formData.customer_last_name}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label={t('case.phone')}
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('case.email')}
                  name="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label={t('warranty.purchaseDate')}
                  name="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label={t('warranty.warrantyStart') || 'Warranty Start'}
                  name="warranty_start"
                  type="date"
                  value={formData.warranty_start}
                  onChange={handleChange}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label={t('warranty.warrantyEndDate')}
                  name="warranty_end"
                  type="date"
                  value={formData.warranty_end}
                  onChange={handleChange}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Box mt={3} display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/staff/warranties')}
                disabled={createMutation.isLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createMutation.isLoading}
              >
                {createMutation.isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  t('common.create')
                )}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateWarrantyPage;

