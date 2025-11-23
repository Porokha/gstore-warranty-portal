import React, { useState } from 'react';
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
      const response = await api.post('/woocommerce/sync/orders', {
        statuses: selectedStatuses,
        limit,
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setSuccess(data);
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to import from WooCommerce');
      },
    }
  );

  const handleImport = () => {
    if (selectedStatuses.length === 0) {
      setError('Please select at least one order status');
      return;
    }
    setError('');
    setSuccess(null);
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
              {error}
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

          {importMutation.isLoading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1 }} align="center">
                Importing warranties from WooCommerce...
              </Typography>
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

