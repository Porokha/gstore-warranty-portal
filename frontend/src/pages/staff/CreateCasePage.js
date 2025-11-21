import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'react-query';
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
  Autocomplete,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { casesService } from '../../services/casesService';
import { warrantiesService } from '../../services/warrantiesService';
import { usersService } from '../../services/usersService';
import { useQueryClient } from 'react-query';

const CreateCasePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('blank'); // 'blank' or 'warranty'
  const [selectedWarranty, setSelectedWarranty] = useState(null);
  const [warrantySearchTerm, setWarrantySearchTerm] = useState('');

  const warrantyIdFromUrl = searchParams.get('warranty_id');

  const [formData, setFormData] = useState({
    warranty_id: warrantyIdFromUrl || '',
    sku: '',
    imei: '',
    serial_number: '',
    device_type: 'Laptop',
    product_title: '',
    customer_name: '',
    customer_last_name: '',
    customer_phone: '',
    customer_email: '',
    customer_initial_note: '',
    order_id: '',
    product_id: '',
    assigned_technician_id: '',
    priority: 'normal',
    deadline_days: 14,
  });

  // Fetch warranties for search
  const { data: warranties, isLoading: isLoadingWarranties } = useQuery(
    ['warranties', warrantySearchTerm],
    () => warrantiesService.getAll({ search: warrantySearchTerm }),
    {
      enabled: mode === 'warranty' && warrantySearchTerm.length > 0,
      keepPreviousData: true,
    }
  );

  // Fetch technicians
  const { data: users } = useQuery('users', usersService.getAll);
  const availableTechnicians = users?.filter(u => u.role === 'technician') || [];

  // If warranty_id is in URL, set mode to warranty and fetch warranty
  useEffect(() => {
    if (warrantyIdFromUrl) {
      setMode('warranty');
      warrantiesService.getById(warrantyIdFromUrl).then((warranty) => {
        setSelectedWarranty(warranty);
        fillFormFromWarranty(warranty);
      });
    }
  }, [warrantyIdFromUrl]);

  // Fill form from warranty data
  const fillFormFromWarranty = (warranty) => {
    if (!warranty) return;
    
    setFormData((prev) => ({
      ...prev,
      warranty_id: warranty.id,
      sku: warranty.sku || '',
      serial_number: warranty.serial_number || '',
      imei: warranty.imei || '',
      device_type: warranty.device_type || 'Laptop',
      product_title: warranty.title || '',
      customer_name: warranty.customer_name || '',
      customer_last_name: warranty.customer_last_name || '',
      customer_phone: warranty.customer_phone || '',
      customer_email: warranty.customer_email || '',
      order_id: warranty.order_id || '',
      product_id: warranty.product_id || '',
    }));
  };

  const handleWarrantySelect = (warranty) => {
    setSelectedWarranty(warranty);
    fillFormFromWarranty(warranty);
  };

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

    // Validate required fields
    if (!formData.customer_phone) {
      setError('Phone number is required');
      return;
    }

    // Validate IMEI for phones
    if (formData.device_type.toLowerCase() === 'phone' && !formData.imei) {
      setError('IMEI is required for phone devices');
      return;
    }

    // Build submit data, converting empty strings to undefined
    const submitData = {
      warranty_id: formData.warranty_id ? parseInt(formData.warranty_id) : undefined,
      sku: formData.sku,
      imei: formData.imei || undefined,
      serial_number: formData.serial_number,
      device_type: formData.device_type,
      product_title: formData.product_title,
      customer_name: formData.customer_name,
      customer_last_name: formData.customer_last_name?.trim() || undefined,
      customer_phone: formData.customer_phone,
      customer_email: formData.customer_email?.trim() || undefined,
      customer_initial_note: formData.customer_initial_note?.trim() || undefined,
      order_id: formData.order_id ? parseInt(formData.order_id) : undefined,
      product_id: formData.product_id ? parseInt(formData.product_id) : undefined,
      assigned_technician_id: formData.assigned_technician_id
        ? parseInt(formData.assigned_technician_id)
        : undefined,
      priority: formData.priority,
      deadline_days: parseInt(formData.deadline_days) || 14,
      tags: tags.length > 0 ? tags : undefined,
    };
    
    // Remove undefined and empty string values
    Object.keys(submitData).forEach(key => {
      if (submitData[key] === undefined || submitData[key] === '' || submitData[key] === null) {
        delete submitData[key];
      }
    });

    createMutation.mutate(submitData);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'blank') {
      setSelectedWarranty(null);
      setFormData({
        warranty_id: '',
        sku: '',
        imei: '',
        serial_number: '',
        device_type: 'Laptop',
        product_title: '',
        customer_name: '',
        customer_last_name: '',
        customer_phone: '',
        customer_email: '',
        customer_initial_note: '',
        order_id: '',
        product_id: '',
        assigned_technician_id: '',
        priority: 'normal',
        deadline_days: 14,
      });
      setTags([]);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ marginTop: 4, marginBottom: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('common.createCase')}
        </Typography>

        <Paper elevation={3} sx={{ padding: 4, mb: 3 }}>
          <Box display="flex" gap={2} mb={3}>
            <Button
              variant={mode === 'warranty' ? 'contained' : 'outlined'}
              onClick={() => handleModeChange('warranty')}
              fullWidth
            >
              {t('case.createFromWarranty') || 'Create from Existing Warranty Product'}
            </Button>
            <Button
              variant={mode === 'blank' ? 'contained' : 'outlined'}
              onClick={() => handleModeChange('blank')}
              fullWidth
            >
              {t('case.createFromBlank') || 'Create from Blank'}
            </Button>
          </Box>

          {mode === 'warranty' && (
            <Box mb={3}>
              <Autocomplete
                options={warranties || []}
                getOptionLabel={(option) => 
                  `${option.warranty_id} - ${option.title} (${option.customer_name} ${option.customer_last_name})`
                }
                loading={isLoadingWarranties}
                value={selectedWarranty}
                onChange={(event, newValue) => {
                  handleWarrantySelect(newValue);
                }}
                onInputChange={(event, newInputValue) => {
                  setWarrantySearchTerm(newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('case.selectWarranty') || 'Search and select warranty product'}
                    placeholder={t('case.searchWarrantyPlaceholder') || 'Type to search by warranty ID, product title, customer name, or phone'}
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {option.warranty_id} - {option.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.customer_name} {option.customer_last_name} | {option.customer_phone}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        SKU: {option.sku} | Serial: {option.serial_number}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
              {selectedWarranty && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {t('case.warrantySelected') || 'Warranty selected. Fields have been pre-filled. Please fill in any missing required fields.'}
                </Alert>
              )}
            </Box>
          )}

          <Divider sx={{ mb: 3 }} />

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
                  error={!formData.sku}
                  helperText={!formData.sku ? t('case.fieldRequired') || 'This field is required' : ''}
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
                  error={!formData.serial_number}
                  helperText={!formData.serial_number ? t('case.fieldRequired') || 'This field is required' : ''}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" required>
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
                    error={!formData.imei}
                    helperText={!formData.imei ? t('case.imeiRequired') || 'IMEI is required for phones' : ''}
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
                  error={!formData.product_title}
                  helperText={!formData.product_title ? t('case.fieldRequired') || 'This field is required' : ''}
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
                  error={!formData.customer_name}
                  helperText={!formData.customer_name ? t('case.fieldRequired') || 'This field is required' : ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
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
                  error={!formData.customer_phone}
                  helperText={!formData.customer_phone ? t('case.phoneRequired') || 'Phone number is required' : ''}
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

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label={t('case.customerInitialNote') || "Customer's Initial Note (Problem Description)"}
                  name="customer_initial_note"
                  value={formData.customer_initial_note}
                  onChange={handleChange}
                  margin="normal"
                  placeholder={t('case.customerInitialNotePlaceholder') || 'Describe what the customer reported as the problem...'}
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

              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>{t('case.technician')}</InputLabel>
                  <Select
                    name="assigned_technician_id"
                    value={formData.assigned_technician_id}
                    onChange={handleChange}
                    label={t('case.technician')}
                  >
                    <MenuItem value="">{t('common.none')}</MenuItem>
                    {availableTechnicians.map((tech) => (
                      <MenuItem key={tech.id} value={tech.id}>
                        {tech.name} {tech.last_name}
                      </MenuItem>
                    ))}
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
