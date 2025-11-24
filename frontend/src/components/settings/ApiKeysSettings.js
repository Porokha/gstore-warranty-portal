import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Typography,
  Divider,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import api from '../../services/api';

const ApiKeysSettings = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    woocommerce_url: '',
    woocommerce_consumer_key: '',
    woocommerce_consumer_secret: '',
    bog_merchant_id: '',
    bog_secret_key: '',
    bog_api_url: '',
    sender_api_key: '',
    sender_api_url: '',
  });

  const { data: apiKeys, isLoading } = useQuery('api-keys', async () => {
    const response = await api.get('/settings/api-keys');
    return response.data;
  });

  useEffect(() => {
    if (apiKeys) {
      setFormData({
        woocommerce_url: apiKeys.woocommerce_url || '',
        woocommerce_consumer_key: apiKeys.woocommerce_consumer_key || '',
        woocommerce_consumer_secret: apiKeys.woocommerce_consumer_secret || '',
        bog_merchant_id: apiKeys.bog_merchant_id || '',
        bog_secret_key: apiKeys.bog_secret_key || '',
        bog_api_url: apiKeys.bog_api_url || '',
        sender_api_key: apiKeys.sender_api_key || '',
        sender_api_url: apiKeys.sender_api_url || '',
      });
    }
  }, [apiKeys]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const saveMutation = useMutation(
    async (data) => {
      console.log('Mutation function called with data:', data);
      try {
        console.log('Making API call to /settings/api-keys');
        const response = await api.post('/settings/api-keys', data);
        console.log('API response received:', response);
        return response.data;
      } catch (error) {
        console.error('API call failed:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response,
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('api-keys');
        setSaveSuccess(true);
        setSaveError('');
        console.log('API keys saved successfully:', data);
        setTimeout(() => setSaveSuccess(false), 5000);
      },
      onError: (error) => {
        const errorMsg = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to save API keys';
        setSaveError(errorMsg);
        setSaveSuccess(false);
        console.error('Failed to save API keys:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      },
    }
  );

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = () => {
    console.log('Saving API keys:', {
      hasUrl: !!formData.woocommerce_url,
      hasKey: !!formData.woocommerce_consumer_key,
      hasSecret: !!formData.woocommerce_consumer_secret,
      url: formData.woocommerce_url,
    });
    console.log('Full formData:', formData);
    console.log('Making POST request to /settings/api-keys');
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveSuccess(false)}>
          API keys saved successfully!
        </Alert>
      )}
      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError('')}>
          {saveError}
        </Alert>
      )}
      <Grid container spacing={3} component="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        {/* WooCommerce Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            WooCommerce Integration
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="WooCommerce URL"
            value={formData.woocommerce_url}
            onChange={(e) => handleChange('woocommerce_url', e.target.value)}
            placeholder="https://yourstore.com"
            helperText="Your WooCommerce store URL"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Consumer Key"
            value={formData.woocommerce_consumer_key}
            onChange={(e) => handleChange('woocommerce_consumer_key', e.target.value)}
            type="password"
            helperText="WooCommerce REST API Consumer Key"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Consumer Secret"
            value={formData.woocommerce_consumer_secret}
            onChange={(e) => handleChange('woocommerce_consumer_secret', e.target.value)}
            type="password"
            helperText="WooCommerce REST API Consumer Secret"
          />
        </Grid>

        {/* BOG Payment Gateway Section */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            BOG Payment Gateway
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="BOG API URL"
            value={formData.bog_api_url}
            onChange={(e) => handleChange('bog_api_url', e.target.value)}
            placeholder="https://api.bog.ge"
            helperText="BOG Payment Gateway API URL"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Merchant ID"
            value={formData.bog_merchant_id}
            onChange={(e) => handleChange('bog_merchant_id', e.target.value)}
            helperText="BOG Merchant ID"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Secret Key"
            value={formData.bog_secret_key}
            onChange={(e) => handleChange('bog_secret_key', e.target.value)}
            type="password"
            helperText="BOG Secret Key for signature generation"
          />
        </Grid>

        {/* Sender SMS Section */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Sender SMS Service
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Sender API URL"
            value={formData.sender_api_url}
            onChange={(e) => handleChange('sender_api_url', e.target.value)}
            placeholder="https://api.sender.ge"
            helperText="Sender SMS API URL"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="API Key"
            value={formData.sender_api_key}
            onChange={(e) => handleChange('sender_api_key', e.target.value)}
            type="password"
            helperText="Sender SMS API Key"
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            startIcon={saveMutation.isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={saveMutation.isLoading}
            size="large"
          >
            {saveMutation.isLoading ? 'Saving...' : t('common.save')}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ApiKeysSettings;

