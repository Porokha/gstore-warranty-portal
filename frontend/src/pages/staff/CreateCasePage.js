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
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { casesService } from '../../services/casesService';
import { useQueryClient } from 'react-query';

const CreateCasePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    warranty_id: '',
    sku: '',
    imei: '',
    serial_number: '',
    device_type: 'Laptop',
    product_title: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    order_id: '',
    product_id: '',
    assigned_technician_id: '',
    priority: 'normal',
    deadline_days: 14,
  });

  const createMutation = useMutation(
    (data) => casesService.create(data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('cases');
        navigate(`/staff/cases/${data.id}`);
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Failed to create case');
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

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate IMEI for phones
    if (formData.device_type.toLowerCase() === 'phone' && !formData.imei) {
      setError('IMEI is required for phone devices');
      return;
    }

    const submitData = {
      ...formData,
      warranty_id: formData.warranty_id ? parseInt(formData.warranty_id) : undefined,
      order_id: formData.order_id ? parseInt(formData.order_id) : undefined,
      product_id: formData.product_id ? parseInt(formData.product_id) : undefined,
      assigned_technician_id: formData.assigned_technician_id
        ? parseInt(formData.assigned_technician_id)
        : undefined,
      deadline_days: parseInt(formData.deadline_days) || 14,
      tags: tags,
    };

    createMutation.mutate(submitData);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ marginTop: 4, marginBottom: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('common.createCase')}
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
                  label={t('case.sku') || 'SKU'}
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
                  label={t('case.serialNumber') || 'Serial Number'}
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>{t('case.deviceType') || 'Device Type'}</InputLabel>
                  <Select
                    name="device_type"
                    value={formData.device_type}
                    onChange={handleChange}
                    label={t('case.deviceType') || 'Device Type'}
                  >
                    <MenuItem value="Laptop">Laptop</MenuItem>
                    <MenuItem value="Phone">Phone</MenuItem>
                    <MenuItem value="Tablet">Tablet</MenuItem>
                    <MenuItem value="Desktop">Desktop</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {formData.device_type.toLowerCase() === 'phone' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="IMEI"
                    name="imei"
                    value={formData.imei}
                    onChange={handleChange}
                    margin="normal"
                    helperText="Required for phones"
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label={t('case.productTitle')}
                  name="product_title"
                  value={formData.product_title}
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

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('case.deadlineDays') || 'Deadline (days from now)'}
                  name="deadline_days"
                  type="number"
                  value={formData.deadline_days}
                  onChange={handleChange}
                  margin="normal"
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>{t('common.priority')}</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    label={t('common.priority')}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Box>
                  <TextField
                    fullWidth
                    label={t('common.tags') || 'Tags'}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    margin="normal"
                    helperText="Press Enter to add tag"
                  />
                  <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                    {tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Box mt={3} display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/staff/cases')}
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
                  t('common.create') || 'Create'
                )}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateCasePage;

