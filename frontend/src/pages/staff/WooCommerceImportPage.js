import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import {
  Sync as SyncIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const WooCommerceImportPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedStatuses, setSelectedStatuses] = useState(['completed']);
  const [limit, setLimit] = useState(100);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [progress, setProgress] = useState(null);
  const [jobId, setJobId] = useState(null);

  const availableStatuses = [
    'pending',
    'processing',
    'on-hold',
    'completed',
    'cancelled',
    'refunded',
    'failed',
  ];

  const handleStatusToggle = (status) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  const importMutation = useMutation(
    async () => {
        statuses: selectedStatuses,
        limit,
      });
      
      const response = await api.post('/woocommerce/sync/orders', {
        statuses: selectedStatuses,
        limit,
      });
      
      
      // If we got a jobId, start polling for progress
      if (response.data.jobId) {
        setJobId(response.data.jobId);
        startProgressPolling(response.data.jobId);
        return { ...response.data, polling: true };
      }
      
      return response.data;
    },
    {
      onSuccess: (data) => {
        if (!data.polling) {
          setSuccess(data);
        }
      },
      onError: (err) => {
        
        let errorMessage = 'Failed to import from WooCommerce';
        if (err.response?.data) {
          const errorData = err.response.data;
          errorMessage = errorData.message || 
                        errorData.error || 
                        (typeof errorData === 'string' ? errorData : JSON.stringify(errorData)) ||
                        errorMessage;
        } else if (err.message) {
          errorMessage = err.message;
        }
        setError(errorMessage);
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message,
        });
      },
    }
  );

  const progressIntervalRef = useRef(null);

  const startProgressPolling = (jobId) => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Poll every 2 seconds
    progressIntervalRef.current = setInterval(async () => {
      try {
        const response = await api.get(`/woocommerce/sync/progress/${jobId}`);
        const progressData = response.data;
        
        setProgress(progressData);

        if (progressData.status === 'completed') {
          clearInterval(progressIntervalRef.current);
          setSuccess(progressData.result || { imported: progressData.imported, skipped: progressData.skipped });
          setJobId(null);
        } else if (progressData.status === 'error') {
          clearInterval(progressIntervalRef.current);
          setError(progressData.error || 'Import failed');
          setJobId(null);
        }
      } catch (err) {
        // Continue polling even if one request fails
      }
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleImport = () => {
    if (selectedStatuses.length === 0) {
      setError('Please select at least one order status');
      return;
    }
    setError('');
    setSuccess(null);
    setProgress(null);
    setJobId(null);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    importMutation.mutate();
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Typography variant="h4">Import Warranties from WooCommerce</Typography>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Box mb={3}>
            <Typography variant="body1" gutterBottom>
              Select order statuses to import warranties from WooCommerce. Only orders with selected statuses will be imported.
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Automatic webhooks only process "completed" orders. 
                This manual import allows you to import from other statuses as well.
              </Typography>
            </Alert>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Import Failed
              </Typography>
              <Typography variant="body2">
                {error}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontSize: '12px', color: 'text.secondary' }}>
                Make sure WooCommerce API keys are configured in Settings > API Keys
              </Typography>
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="h6">Import Complete!</Typography>
              <Typography>Successfully imported: {success.imported} warranties</Typography>
            </Alert>
          )}

          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Select Order Statuses
            </Typography>
            <FormGroup>
              {availableStatuses.map((status) => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      checked={selectedStatuses.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                    />
                  }
                  label={status.charAt(0).toUpperCase() + status.slice(1)}
                />
              ))}
            </FormGroup>
          </Box>

          <Box mb={3}>
            <FormControl fullWidth>
              <InputLabel>Import Limit</InputLabel>
              <Select
                value={limit}
                label="Import Limit"
                onChange={(e) => setLimit(e.target.value)}
              >
                <MenuItem value={50}>50 orders</MenuItem>
                <MenuItem value={100}>100 orders</MenuItem>
                <MenuItem value={200}>200 orders</MenuItem>
                <MenuItem value={500}>500 orders</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {(importMutation.isLoading || progress) && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress 
                variant={progress?.percentage !== undefined ? "determinate" : "indeterminate"}
                value={progress?.percentage || 0}
              />
              <Box sx={{ mt: 2 }}>
                {progress && (
                  <>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }} align="center">
                      Importing warranties from WooCommerce...
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Progress: {progress.processed || 0} / {progress.total || '?'} orders processed
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Imported: {progress.imported || 0} warranties | Skipped: {progress.skipped || 0}
                    </Typography>
                    {progress.percentage !== undefined && (
                      <Typography variant="h6" align="center" sx={{ mt: 1, color: 'primary.main' }}>
                        {progress.percentage}%
                      </Typography>
                    )}
                  </>
                )}
                {!progress && (
                  <>
                    <Typography variant="body2" sx={{ mt: 1 }} align="center">
                      Starting import...
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }} align="center" color="text.secondary">
                      This may take several minutes depending on the number of orders. Please wait...
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          )}

          <Box mt={3} display="flex" gap={2}>
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={selectedStatuses.length === 0 || importMutation.isLoading}
              startIcon={importMutation.isLoading ? <CircularProgress size={20} /> : <SyncIcon />}
            >
              {importMutation.isLoading ? 'Importing...' : 'Import from WooCommerce'}
            </Button>
            <Button variant="outlined" onClick={() => navigate('/staff/warranties')}>
              Cancel
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default WooCommerceImportPage;

