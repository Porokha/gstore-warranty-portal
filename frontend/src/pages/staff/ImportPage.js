import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from 'react-query';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  LinearProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  TextField,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const ImportPage = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  
  // CSV Cases state
  const [casesFile, setCasesFile] = useState(null);
  const [casesError, setCasesError] = useState('');
  const [casesSuccess, setCasesSuccess] = useState(null);
  
  // CSV Warranties state
  const [warrantiesFile, setWarrantiesFile] = useState(null);
  const [warrantiesError, setWarrantiesError] = useState('');
  const [warrantiesSuccess, setWarrantiesSuccess] = useState(null);
  
  // WooCommerce state
  const [selectedStatuses, setSelectedStatuses] = useState(['completed']);
  const [limitType, setLimitType] = useState('count'); // 'count', 'date', 'none'
  const [orderLimit, setOrderLimit] = useState(100);
  const [dateLimit, setDateLimit] = useState('');
  const [wooError, setWooError] = useState('');
  const [wooSuccess, setWooSuccess] = useState(null);

  const availableStatuses = [
    'pending',
    'processing',
    'on-hold',
    'completed',
    'cancelled',
    'refunded',
    'failed',
  ];

  // CSV Cases handlers
  const downloadCasesExample = async () => {
    try {
      const response = await api.get('/import/cases/csv/example', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'cases-example.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setCasesError('Failed to download example CSV');
    }
  };

  const casesUploadMutation = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/import/cases/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setCasesSuccess(data);
        setCasesFile(null);
      },
      onError: (err) => {
        setCasesError(err.response?.data?.message || 'Failed to import cases');
      },
    }
  );

  const handleCasesFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setCasesError('Please select a CSV file');
        return;
      }
      setCasesFile(selectedFile);
      setCasesError('');
      setCasesSuccess(null);
    }
  };

  const handleCasesUpload = () => {
    if (!casesFile) {
      setCasesError('Please select a file');
      return;
    }
    casesUploadMutation.mutate(casesFile);
  };

  // CSV Warranties handlers
  const downloadWarrantiesExample = async () => {
    try {
      const response = await api.get('/import/warranties/csv/example', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'warranties-example.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setWarrantiesError('Failed to download example CSV');
    }
  };

  const warrantiesUploadMutation = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/import/warranties/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setWarrantiesSuccess(data);
        setWarrantiesFile(null);
      },
      onError: (err) => {
        setWarrantiesError(err.response?.data?.message || 'Failed to import warranties');
      },
    }
  );

  const handleWarrantiesFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setWarrantiesError('Please select a CSV file');
        return;
      }
      setWarrantiesFile(selectedFile);
      setWarrantiesError('');
      setWarrantiesSuccess(null);
    }
  };

  const handleWarrantiesUpload = () => {
    if (!warrantiesFile) {
      setWarrantiesError('Please select a file');
      return;
    }
    warrantiesUploadMutation.mutate(warrantiesFile);
  };

  // WooCommerce handlers
  const handleStatusToggle = (status) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  const wooImportMutation = useMutation(
    async () => {
      const body = {
        statuses: selectedStatuses,
        skipDuplicates: true,
      };
      
      if (limitType === 'count') {
        body.limit = orderLimit;
      } else if (limitType === 'date') {
        body.dateFrom = dateLimit;
      }
      // If limitType === 'none', don't add any limit
      
      const response = await api.post('/woocommerce/sync/orders', body);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setWooSuccess(data);
      },
      onError: (err) => {
        setWooError(err.response?.data?.message || 'Failed to import from WooCommerce');
      },
    }
  );

  const handleWooImport = () => {
    if (selectedStatuses.length === 0) {
      setWooError('Please select at least one order status');
      return;
    }
    if (limitType === 'date' && !dateLimit) {
      setWooError('Please select a date');
      return;
    }
    setWooError('');
    setWooSuccess(null);
    wooImportMutation.mutate();
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('common.importCSV') || 'Import Data'}
        </Typography>

        <Paper sx={{ p: 3 }}>
          <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} sx={{ mb: 3 }}>
            <Tab label={t('common.importCSV') + ' - Cases'} />
            <Tab label={t('common.importCSV') + ' - ' + t('common.warranties')} />
            <Tab label={t('common.importWooCommerce')} />
          </Tabs>

          {/* Tab 1: Import Cases CSV */}
          {tab === 0 && (
            <Box>
              <Box mb={3}>
                <Typography variant="body1" gutterBottom>
                  Upload a CSV file to import multiple service cases at once. Duplicate cases will be skipped.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadCasesExample}
                  sx={{ mt: 2 }}
                >
                  Download Example CSV
                </Button>
              </Box>

              {casesError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCasesError('')}>
                  {casesError}
                </Alert>
              )}

              {casesSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="h6">Import Complete!</Typography>
                  <Typography>Successfully imported: {casesSuccess.imported} cases</Typography>
                  {casesSuccess.skipped > 0 && (
                    <Typography>Skipped duplicates: {casesSuccess.skipped}</Typography>
                  )}
                  {casesSuccess.errors > 0 && (
                    <Typography color="warning.main">
                      Errors: {casesSuccess.errors} rows failed
                    </Typography>
                  )}
                </Alert>
              )}

              <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 4, textAlign: 'center' }}>
                <input
                  accept=".csv"
                  style={{ display: 'none' }}
                  id="cases-csv-upload"
                  type="file"
                  onChange={handleCasesFileChange}
                />
                <label htmlFor="cases-csv-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    size="large"
                  >
                    Select CSV File
                  </Button>
                </label>
                {casesFile && (
                  <Box mt={2}>
                    <Typography variant="body1">Selected: {casesFile.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Size: {(casesFile.size / 1024).toFixed(2)} KB
                    </Typography>
                  </Box>
                )}
              </Box>

              {casesUploadMutation.isLoading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1 }} align="center">
                    Importing cases...
                  </Typography>
                </Box>
              )}

              <Box mt={3} display="flex" gap={2}>
                <Button
                  variant="contained"
                  onClick={handleCasesUpload}
                  disabled={!casesFile || casesUploadMutation.isLoading}
                  startIcon={casesUploadMutation.isLoading ? <CircularProgress size={20} /> : <UploadIcon />}
                >
                  {casesUploadMutation.isLoading ? 'Importing...' : 'Import Cases'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Tab 2: Import Warranties CSV */}
          {tab === 1 && (
            <Box>
              <Box mb={3}>
                <Typography variant="body1" gutterBottom>
                  Upload a CSV file to import multiple warranties at once. Duplicate warranties will be skipped.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadWarrantiesExample}
                  sx={{ mt: 2 }}
                >
                  Download Example CSV
                </Button>
              </Box>

              {warrantiesError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setWarrantiesError('')}>
                  {warrantiesError}
                </Alert>
              )}

              {warrantiesSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="h6">Import Complete!</Typography>
                  <Typography>Successfully imported: {warrantiesSuccess.imported} warranties</Typography>
                  {warrantiesSuccess.skipped > 0 && (
                    <Typography>Skipped duplicates: {warrantiesSuccess.skipped}</Typography>
                  )}
                  {warrantiesSuccess.errors > 0 && (
                    <Typography color="warning.main">
                      Errors: {warrantiesSuccess.errors} rows failed
                    </Typography>
                  )}
                </Alert>
              )}

              <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 4, textAlign: 'center' }}>
                <input
                  accept=".csv"
                  style={{ display: 'none' }}
                  id="warranties-csv-upload"
                  type="file"
                  onChange={handleWarrantiesFileChange}
                />
                <label htmlFor="warranties-csv-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    size="large"
                  >
                    Select CSV File
                  </Button>
                </label>
                {warrantiesFile && (
                  <Box mt={2}>
                    <Typography variant="body1">Selected: {warrantiesFile.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Size: {(warrantiesFile.size / 1024).toFixed(2)} KB
                    </Typography>
                  </Box>
                )}
              </Box>

              {warrantiesUploadMutation.isLoading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1 }} align="center">
                    Importing warranties...
                  </Typography>
                </Box>
              )}

              <Box mt={3} display="flex" gap={2}>
                <Button
                  variant="contained"
                  onClick={handleWarrantiesUpload}
                  disabled={!warrantiesFile || warrantiesUploadMutation.isLoading}
                  startIcon={warrantiesUploadMutation.isLoading ? <CircularProgress size={20} /> : <UploadIcon />}
                >
                  {warrantiesUploadMutation.isLoading ? 'Importing...' : 'Import Warranties'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Tab 3: WooCommerce Import */}
          {tab === 2 && (
            <Box>
              <Box mb={3}>
                <Typography variant="body1" gutterBottom>
                  Import warranties from WooCommerce orders. Already imported orders will be skipped.
                </Typography>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> Automatic webhooks only process "completed" orders. 
                    This manual import allows you to import from other statuses as well.
                  </Typography>
                </Alert>
              </Box>

              {wooError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setWooError('')}>
                  {wooError}
                </Alert>
              )}

              {wooSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="h6">Import Complete!</Typography>
                  <Typography>Successfully imported: {wooSuccess.imported} warranties</Typography>
                  {wooSuccess.skipped > 0 && (
                    <Typography>Skipped duplicates: {wooSuccess.skipped}</Typography>
                  )}
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
                  <InputLabel>Limit Type</InputLabel>
                  <Select
                    value={limitType}
                    label="Limit Type"
                    onChange={(e) => setLimitType(e.target.value)}
                  >
                    <MenuItem value="none">No Limit</MenuItem>
                    <MenuItem value="count">Order Count</MenuItem>
                    <MenuItem value="date">Date From</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {limitType === 'count' && (
                <Box mb={3}>
                  <FormControl fullWidth>
                    <InputLabel>Import Limit</InputLabel>
                    <Select
                      value={orderLimit}
                      label="Import Limit"
                      onChange={(e) => setOrderLimit(e.target.value)}
                    >
                      <MenuItem value={50}>50 orders</MenuItem>
                      <MenuItem value={100}>100 orders</MenuItem>
                      <MenuItem value={200}>200 orders</MenuItem>
                      <MenuItem value={500}>500 orders</MenuItem>
                      <MenuItem value={1000}>1000 orders</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              {limitType === 'date' && (
                <Box mb={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Import Orders From Date"
                    value={dateLimit}
                    onChange={(e) => setDateLimit(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Box>
              )}

              {wooImportMutation.isLoading && (
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
                  onClick={handleWooImport}
                  disabled={selectedStatuses.length === 0 || wooImportMutation.isLoading}
                  startIcon={wooImportMutation.isLoading ? <CircularProgress size={20} /> : <SyncIcon />}
                >
                  {wooImportMutation.isLoading ? 'Importing...' : 'Import from WooCommerce'}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ImportPage;

