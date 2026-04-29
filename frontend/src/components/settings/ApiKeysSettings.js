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
    mobilesentrix_api_url: '',
    mobilesentrix_api_key: '',
    mobilesentrix_username: '',
    mobilesentrix_password: '',
    mobilesentrix_webhook_secret: '',
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
        mobilesentrix_api_url: apiKeys.mobilesentrix_api_url || '',
        mobilesentrix_api_key: apiKeys.mobilesentrix_api_key || '',
        mobilesentrix_username: apiKeys.mobilesentrix_username || '',
        mobilesentrix_password: apiKeys.mobilesentrix_password || '',
        mobilesentrix_webhook_secret: apiKeys.mobilesentrix_webhook_secret || '',
      });
    }
  }, [apiKeys]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const saveMutation = useMutation(
    async (data) => {
      try {
        const response = await api.post('/settings/api-keys', data);
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
        setTimeout(() => setSaveSuccess(false), 5000);
      },
      onError: (error) => {
        const errorMsg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          t('apiKeys.saveError');
        setSaveError(errorMsg);
        setSaveSuccess(false);
        console.error(`${t('apiKeys.saveError')}:`, {
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
          {t('apiKeys.saveSuccess')}
        </Alert>
      )}
      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError('')}>
          {saveError || t('apiKeys.saveError')}
        </Alert>
      )}
      <Grid container spacing={3} component="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        {/* WooCommerce Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            {t('apiKeys.wooSection')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.wooUrl')}
            value={formData.woocommerce_url}
            onChange={(e) => handleChange('woocommerce_url', e.target.value)}
            placeholder={t('apiKeys.wooUrlPlaceholder')}
            helperText={t('apiKeys.wooUrlHint')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.consumerKey')}
            value={formData.woocommerce_consumer_key}
            onChange={(e) => handleChange('woocommerce_consumer_key', e.target.value)}
            type="password"
            helperText={t('apiKeys.consumerKeyHint')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.consumerSecret')}
            value={formData.woocommerce_consumer_secret}
            onChange={(e) => handleChange('woocommerce_consumer_secret', e.target.value)}
            type="password"
            helperText={t('apiKeys.consumerSecretHint')}
          />
        </Grid>

        {/* {t('apiKeys.bogSection')} Section */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('apiKeys.bogSection')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.bogApiUrl')}
            value={formData.bog_api_url}
            onChange={(e) => handleChange('bog_api_url', e.target.value)}
            placeholder={t('apiKeys.bogApiUrlHint')}
            helperText={t('apiKeys.bogApiUrlHint')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.bogMerchantId')}
            value={formData.bog_merchant_id}
            onChange={(e) => handleChange('bog_merchant_id', e.target.value)}
            helperText={t('apiKeys.bogMerchantIdHint')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.bogSecretKey')}
            value={formData.bog_secret_key}
            onChange={(e) => handleChange('bog_secret_key', e.target.value)}
            type="password"
            helperText={t('apiKeys.bogSecretKeyHint')}
          />
        </Grid>

        {/* Sender SMS Section */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('apiKeys.senderSection')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.senderApiUrl')}
            value={formData.sender_api_url}
            onChange={(e) => handleChange('sender_api_url', e.target.value)}
            placeholder={t('apiKeys.senderApiUrlHint')}
            helperText={t('apiKeys.senderApiUrlHint')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.senderApiKey')}
            value={formData.sender_api_key}
            onChange={(e) => handleChange('sender_api_key', e.target.value)}
            type="password"
            helperText={t('apiKeys.senderApiKeyHint')}
          />
        </Grid>

        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('apiKeys.mobileSentrixSection')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.mobileSentrixApiUrl')}
            value={formData.mobilesentrix_api_url}
            onChange={(e) => handleChange('mobilesentrix_api_url', e.target.value)}
            helperText={t('apiKeys.mobileSentrixApiUrlHint')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.mobileSentrixApiKey')}
            value={formData.mobilesentrix_api_key}
            onChange={(e) => handleChange('mobilesentrix_api_key', e.target.value)}
            type="password"
            helperText={t('apiKeys.mobileSentrixApiKeyHint')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.mobileSentrixUsername')}
            value={formData.mobilesentrix_username}
            onChange={(e) => handleChange('mobilesentrix_username', e.target.value)}
            helperText={t('apiKeys.mobileSentrixUsernameHint')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.mobileSentrixPassword')}
            value={formData.mobilesentrix_password}
            onChange={(e) => handleChange('mobilesentrix_password', e.target.value)}
            type="password"
            helperText={t('apiKeys.mobileSentrixPasswordHint')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.mobileSentrixWebhookSecret')}
            value={formData.mobilesentrix_webhook_secret}
            onChange={(e) => handleChange('mobilesentrix_webhook_secret', e.target.value)}
            type="password"
            helperText={t('apiKeys.mobileSentrixWebhookSecretHint')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.mobileSentrixCallbackUrl')}
            value="https://zezva.ge/api/integrations/mobilesentrix/webhook"
            InputProps={{ readOnly: true }}
            helperText={t('apiKeys.mobileSentrixCallbackUrlHint')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.mobileSentrixWhitelistIp')}
            value="3.68.134.145"
            InputProps={{ readOnly: true }}
            helperText={t('apiKeys.mobileSentrixWhitelistIpHint')}
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
            {saveMutation.isLoading ? (t('common.saving') || t('common.save')) : t('apiKeys.saveButton')}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ApiKeysSettings;
