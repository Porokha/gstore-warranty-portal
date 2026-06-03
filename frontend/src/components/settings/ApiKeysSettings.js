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
  Chip,
  Stack,
} from '@mui/material';
import { Save as SaveIcon, Link as LinkIcon, Search as SearchIcon } from '@mui/icons-material';
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
    mobilesentrix_consumer_name: '',
    mobilesentrix_consumer_key: '',
    mobilesentrix_consumer_secret: '',
    mobilesentrix_access_token: '',
    mobilesentrix_access_token_secret: '',
    mobilesentrix_connected: false,
    mobilesentrix_webhook_secret: '',
    pos_warranty_webhook_secret: '',
  });
  const [mobileSentrixTestQuery, setMobileSentrixTestQuery] = useState('iphone lcd');
  const [mobileSentrixTestResult, setMobileSentrixTestResult] = useState(null);

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
        mobilesentrix_consumer_name: apiKeys.mobilesentrix_consumer_name || '',
        mobilesentrix_consumer_key: apiKeys.mobilesentrix_consumer_key || '',
        mobilesentrix_consumer_secret: apiKeys.mobilesentrix_consumer_secret || '',
        mobilesentrix_access_token: apiKeys.mobilesentrix_access_token || '',
        mobilesentrix_access_token_secret: apiKeys.mobilesentrix_access_token_secret || '',
        mobilesentrix_connected: Boolean(apiKeys.mobilesentrix_connected),
        mobilesentrix_webhook_secret: apiKeys.mobilesentrix_webhook_secret || '',
        pos_warranty_webhook_secret: apiKeys.pos_warranty_webhook_secret || '',
      });
    }
  }, [apiKeys]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [mobileSentrixStatusMessage, setMobileSentrixStatusMessage] = useState('');

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

  const mobileSentrixConnectMutation = useMutation(
    async () => {
      const response = await api.post('/integrations/mobilesentrix/oauth/connect');
      return response.data;
    },
    {
      onSuccess: (data) => {
        if (data?.authorize_url) {
          window.open(data.authorize_url, '_blank', 'noopener,noreferrer');
        }
        queryClient.invalidateQueries('api-keys');
        setMobileSentrixStatusMessage(t('apiKeys.mobileSentrixConnectSuccess'));
        setSaveError('');
      },
      onError: (error) => {
        setMobileSentrixStatusMessage('');
        setSaveError(
          error.response?.data?.message || error.message || t('apiKeys.mobileSentrixConnectError'),
        );
      },
    },
  );

  const mobileSentrixTestMutation = useMutation(
    async () => {
      const response = await api.get('/integrations/mobilesentrix/test-search', {
        params: { q: mobileSentrixTestQuery },
        skipAuthRedirect: true,
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setMobileSentrixTestResult(data);
        setSaveError('');
      },
      onError: (error) => {
        setMobileSentrixTestResult(null);
        setSaveError(
          error.response?.data?.message || error.message || t('apiKeys.mobileSentrixTestError'),
        );
      },
    },
  );

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
            label={t('apiKeys.mobileSentrixConsumerName')}
            value={formData.mobilesentrix_consumer_name}
            onChange={(e) => handleChange('mobilesentrix_consumer_name', e.target.value)}
            helperText={t('apiKeys.mobileSentrixConsumerNameHint')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.mobileSentrixConsumerKey')}
            value={formData.mobilesentrix_consumer_key}
            onChange={(e) => handleChange('mobilesentrix_consumer_key', e.target.value)}
            type="password"
            helperText={t('apiKeys.mobileSentrixConsumerKeyHint')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.mobileSentrixConsumerSecret')}
            value={formData.mobilesentrix_consumer_secret}
            onChange={(e) => handleChange('mobilesentrix_consumer_secret', e.target.value)}
            type="password"
            helperText={t('apiKeys.mobileSentrixConsumerSecretHint')}
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
            label={t('apiKeys.mobileSentrixOauthCallbackUrl')}
            value="https://zezva.ge/api/integrations/mobilesentrix/oauth/callback"
            InputProps={{ readOnly: true }}
            helperText={t('apiKeys.mobileSentrixOauthCallbackUrlHint')}
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
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.mobileSentrixWebhookUrl')}
            value="https://zezva.ge/api/integrations/mobilesentrix/webhook"
            InputProps={{ readOnly: true }}
            helperText={t('apiKeys.mobileSentrixCallbackUrlHint')}
          />
        </Grid>
        <Grid item xs={12}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Chip
              color={formData.mobilesentrix_connected ? 'success' : 'default'}
              label={
                formData.mobilesentrix_connected
                  ? t('apiKeys.mobileSentrixConnected')
                  : t('apiKeys.mobileSentrixDisconnected')
              }
            />
            <Button
              variant="outlined"
              startIcon={
                mobileSentrixConnectMutation.isLoading ? (
                  <CircularProgress size={18} />
                ) : (
                  <LinkIcon />
                )
              }
              onClick={() => mobileSentrixConnectMutation.mutate()}
              disabled={mobileSentrixConnectMutation.isLoading || saveMutation.isLoading}
            >
              {t('apiKeys.mobileSentrixConnectButton')}
            </Button>
          </Stack>
          {mobileSentrixStatusMessage && (
            <Typography variant="body2" color="success.main" sx={{ mt: 1.25 }}>
              {mobileSentrixStatusMessage}
            </Typography>
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.mobileSentrixTestQuery')}
            value={mobileSentrixTestQuery}
            onChange={(e) => setMobileSentrixTestQuery(e.target.value)}
            helperText={t('apiKeys.mobileSentrixTestQueryHint')}
          />
        </Grid>
        <Grid item xs={12} md={6} display="flex" alignItems="center">
          <Button
            variant="outlined"
            startIcon={
              mobileSentrixTestMutation.isLoading ? <CircularProgress size={18} /> : <SearchIcon />
            }
            onClick={() => mobileSentrixTestMutation.mutate()}
            disabled={mobileSentrixTestMutation.isLoading}
          >
            {t('apiKeys.mobileSentrixTestButton')}
          </Button>
        </Grid>
        {mobileSentrixTestResult && (
          <Grid item xs={12}>
            <Alert severity="info">
              {t('apiKeys.mobileSentrixTestSummary', {
                total: mobileSentrixTestResult.total_items,
                shown: mobileSentrixTestResult.items_count,
              })}
            </Alert>
          </Grid>
        )}

        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('apiKeys.posWarrantySection')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.posWarrantyWebhookSecret')}
            value={formData.pos_warranty_webhook_secret}
            onChange={(e) => handleChange('pos_warranty_webhook_secret', e.target.value)}
            type="password"
            helperText={t('apiKeys.posWarrantyWebhookSecretHint')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('apiKeys.posWarrantyWebhookUrl')}
            value="https://zezva.ge/api/integrations/pos/order-upsert"
            InputProps={{ readOnly: true }}
            helperText={t('apiKeys.posWarrantyWebhookUrlHint')}
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
