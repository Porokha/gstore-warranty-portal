import React, { useState, useEffect, useRef } from 'react';
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
  const [wooProgress, setWooProgress] = useState(null);
  const [currentWooJobId, setCurrentWooJobId] = useState(null);
  const [isWooImportRunning, setIsWooImportRunning] = useState(false);
  const [isWooStopping, setIsWooStopping] = useState(false);
  const wooProgressIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (wooProgressIntervalRef.current) {
        clearInterval(wooProgressIntervalRef.current);
      }
    };
  }, []);

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
      setCasesError(t('importPage.cases.downloadError'));
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
        setCasesError(err.response?.data?.message || t('common.errorLoading'));
      },
    }
  );

  const handleCasesFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setCasesError(t('importPage.cases.selectFileError'));
        return;
      }
      setCasesFile(selectedFile);
      setCasesError('');
      setCasesSuccess(null);
    }
  };

  const handleCasesUpload = () => {
    if (!casesFile) {
      setCasesError(t('importPage.cases.selectFileError'));
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
      setWarrantiesError(t('importPage.warranties.downloadError'));
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
        setWarrantiesError(err.response?.data?.message || t('common.errorLoading'));
      },
    }
  );

  const handleWarrantiesFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setWarrantiesError(t('importPage.warranties.selectFileError'));
        return;
      }
      setWarrantiesFile(selectedFile);
      setWarrantiesError('');
      setWarrantiesSuccess(null);
    }
  };

  const handleWarrantiesUpload = () => {
    if (!warrantiesFile) {
      setWarrantiesError(t('importPage.warranties.selectFileError'));
      return;
    }
    warrantiesUploadMutation.mutate(warrantiesFile);
  };

  const stopWooProgressPolling = (resetState = false) => {
    if (wooProgressIntervalRef.current) {
      clearInterval(wooProgressIntervalRef.current);
      wooProgressIntervalRef.current = null;
    }
    if (resetState) {
      setWooProgress(null);
      setIsWooImportRunning(false);
      setIsWooStopping(false);
      setCurrentWooJobId(null);
    }
  };

    const startWooProgressPolling = (jobId) => {
    stopWooProgressPolling();
    setCurrentWooJobId(jobId);
    setIsWooImportRunning(true);
    setIsWooStopping(false);
    wooProgressIntervalRef.current = setInterval(async () => {
      try {
        const response = await api.get(`/woocommerce/sync/progress/${jobId}`);
        const progressData = response.data;
        setWooProgress(progressData);

        if (progressData.status === 'completed') {
          stopWooProgressPolling(true);
          setWooSuccess(
            progressData.result || { imported: progressData.imported, skipped: progressData.skipped }
          );
          setWooError('');
        } else if (progressData.status === 'error') {
          stopWooProgressPolling(true);
          setWooError(progressData.error || t('importPage.woocommerce.errorGeneric'));
          setWooSuccess(null);
        } else if (progressData.status === 'cancelled') {
          stopWooProgressPolling(true);
          setWooSuccess(null);
          setWooError(t('importPage.progress.cancelled'));
        } else if (progressData.status === 'not_found') {
          stopWooProgressPolling(true);
        }
      } catch (error) {
        stopWooProgressPolling(true);
        setWooError(t('importPage.woocommerce.errorGeneric'));
        setWooSuccess(null);
      }
    }, 2000);
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
      } else if (limitType === 'date' && dateLimit) {
        body.dateFrom = dateLimit;
      }
      
      const response = await api.post('/woocommerce/sync/orders', body);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setWooError('');
        if (data.jobId) {
          startWooProgressPolling(data.jobId);
        } else {
          setWooSuccess(data);
          setIsWooImportRunning(false);
        }
      },
      onError: (err) => {
        setWooError(err.response?.data?.message || 'Failed to import from WooCommerce');
         setIsWooImportRunning(false);
         setIsWooStopping(false);
         stopWooProgressPolling(true);
      },
    }
  );

  const handleWooImport = () => {
    if (isWooImportRunning) {
      return;
    }
    if (selectedStatuses.length === 0) {
      setWooError(t('importPage.woocommerce.errorSelectStatus'));
      return;
    }
    if (limitType === 'date' && !dateLimit) {
      setWooError(t('importPage.woocommerce.errorSelectDate'));
      return;
    }
    setWooError('');
    setWooSuccess(null);
    setWooProgress(null);
    setWooSuccess(null);
    setCurrentWooJobId(null);
    setWooError('');
    setIsWooStopping(false);
    stopWooProgressPolling();
    setIsWooImportRunning(true);
    wooImportMutation.mutate();
  };

  const handleWooStop = async () => {
    if (!currentWooJobId || isWooStopping) {
      return;
    }
    try {
      setIsWooStopping(true);
      await api.post(`/woocommerce/sync/cancel/${currentWooJobId}`);
      setWooError(t('importPage.woocommerce.cancelRequested'));
    } catch (err) {
      setIsWooStopping(false);
      setWooError(err.response?.data?.message || t('importPage.woocommerce.errorGeneric'));
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('importPage.title')}
        </Typography>

        <Paper sx={{ p: 3 }}>
          <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} sx={{ mb: 3 }}>
            <Tab label={t('importPage.tabs.cases')} />
            <Tab label={t('importPage.tabs.warranties')} />
            <Tab label={t('importPage.tabs.woocommerce')} />
          </Tabs>

          {/* Tab 1: Import Cases CSV */}
          {tab === 0 && (
            <Box>
              <Box mb={3}>
                <Typography variant="body1" gutterBottom>
                  {t('importPage.cases.description')}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadCasesExample}
                  sx={{ mt: 2 }}
                >
                  {t('importPage.cases.downloadExample')}
                </Button>
              </Box>

              {casesError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCasesError('')}>
                  {casesError}
                </Alert>
              )}

              {casesSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="h6">{t('importPage.cases.successTitle')}</Typography>
                  <Typography>
                    {t('importPage.cases.successImported', { count: casesSuccess.imported })}
                  </Typography>
                  {casesSuccess.skipped > 0 && (
                    <Typography>
                      {t('importPage.cases.skipped', { count: casesSuccess.skipped })}
                    </Typography>
                  )}
                  {casesSuccess.errors > 0 && (
                    <Typography color="warning.main">
                      {t('importPage.cases.errors', { count: casesSuccess.errors })}
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
                    {t('importPage.cases.selectFile')}
                  </Button>
                </label>
                {casesFile && (
                  <Box mt={2}>
                    <Typography variant="body1">{t('importPage.cases.selected')}: {casesFile.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('importPage.cases.size')}: {(casesFile.size / 1024).toFixed(2)} KB
                    </Typography>
                  </Box>
                )}
              </Box>

              {casesUploadMutation.isLoading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1 }} align="center">
                    {t('importPage.cases.importing')}
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
                  {casesUploadMutation.isLoading ? t('importPage.cases.importing') : t('importPage.cases.importButton')}
                </Button>
              </Box>
            </Box>
          )}

          {/* Tab 2: Import Warranties CSV */}
          {tab === 1 && (
            <Box>
              <Box mb={3}>
                <Typography variant="body1" gutterBottom>
                  {t('importPage.warranties.description')}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadWarrantiesExample}
                  sx={{ mt: 2 }}
                >
                  {t('importPage.warranties.downloadExample')}
                </Button>
              </Box>

              {warrantiesError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setWarrantiesError('')}>
                  {warrantiesError}
                </Alert>
              )}

              {warrantiesSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="h6">{t('importPage.cases.successTitle')}</Typography>
                  <Typography>
                    {t('importPage.warranties.successImported', { count: warrantiesSuccess.imported })}
                  </Typography>
                  {warrantiesSuccess.skipped > 0 && (
                    <Typography>
                      {t('importPage.warranties.skipped', { count: warrantiesSuccess.skipped })}
                    </Typography>
                  )}
                  {warrantiesSuccess.errors > 0 && (
                    <Typography color="warning.main">
                      {t('importPage.warranties.errors', { count: warrantiesSuccess.errors })}
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
                    {t('importPage.warranties.selectFile')}
                  </Button>
                </label>
                {warrantiesFile && (
                  <Box mt={2}>
                    <Typography variant="body1">{t('importPage.warranties.selected')}: {warrantiesFile.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('importPage.warranties.size')}: {(warrantiesFile.size / 1024).toFixed(2)} KB
                    </Typography>
                  </Box>
                )}
              </Box>

              {warrantiesUploadMutation.isLoading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1 }} align="center">
                    {t('importPage.warranties.importing')}
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
                  {warrantiesUploadMutation.isLoading ? t('importPage.warranties.importing') : t('importPage.warranties.importButton')}
                </Button>
              </Box>
            </Box>
          )}

          {/* Tab 3: WooCommerce Import */}
          {tab === 2 && (
            <Box>
              <Box mb={3}>
                <Typography variant="body1" gutterBottom>
                  {t('importPage.woocommerce.description')}
                </Typography>
                <Alert severity="info" sx={{ mt: 2 }}>                  <Typography variant="body2">
                    {t('importPage.woocommerce.note')}
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
                  <Typography variant="h6">{t('importPage.cases.successTitle')}</Typography>
                  <Typography>
                    {t('importPage.warranties.successImported', { count: wooSuccess.imported })}
                  </Typography>
                  {wooSuccess.skipped > 0 && (
                    <Typography>
                      {t('importPage.warranties.skipped', { count: wooSuccess.skipped })}
                    </Typography>
                  )}
                </Alert>
              )}

              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  {t('importPage.woocommerce.selectStatuses')}
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
                      label={t(`importPage.statuses.${status}`)}
                    />
                  ))}
                </FormGroup>
              </Box>

              <Box mb={3}>
                <FormControl fullWidth>
                  <InputLabel>{t('importPage.woocommerce.limitType')}</InputLabel>
                  <Select
                    value={limitType}
                    label={t('importPage.woocommerce.limitType')}
                    onChange={(e) => setLimitType(e.target.value)}
                  >
                    <MenuItem value="none">{t('importPage.woocommerce.limitNone')}</MenuItem>
                    <MenuItem value="count">{t('importPage.woocommerce.limitCount')}</MenuItem>
                    <MenuItem value="date">{t('importPage.woocommerce.limitDate')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {limitType === 'count' && (
                <Box mb={3}>
                  <FormControl fullWidth>
                    <InputLabel>{t('importPage.woocommerce.importLimit')}</InputLabel>
                    <Select
                      value={orderLimit}
                      label={t('importPage.woocommerce.importLimit')}
                      onChange={(e) => setOrderLimit(e.target.value)}
                    >
                      <MenuItem value={50}>{t('importPage.woocommerce.ordersCount', { count: 50 })}</MenuItem>
                      <MenuItem value={100}>{t('importPage.woocommerce.ordersCount', { count: 100 })}</MenuItem>
                      <MenuItem value={200}>{t('importPage.woocommerce.ordersCount', { count: 200 })}</MenuItem>
                      <MenuItem value={500}>{t('importPage.woocommerce.ordersCount', { count: 500 })}</MenuItem>
                      <MenuItem value={1000}>{t('importPage.woocommerce.ordersCount', { count: 1000 })}</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              {limitType === 'date' && (
                <Box mb={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label={t('importPage.woocommerce.dateLabel')}
                    value={dateLimit}
                    onChange={(e) => setDateLimit(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Box>
              )}

              {(wooImportMutation.isLoading || wooProgress || isWooImportRunning) && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant={wooProgress?.percentage !== undefined ? 'determinate' : 'indeterminate'}
                    value={wooProgress?.percentage || 0}
                  />
                  <Box sx={{ mt: 1 }} textAlign="center">
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {wooProgress ? t('importPage.progress.title') : t('importPage.woocommerce.importing')}
                    </Typography>
                    {wooProgress && (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {t('importPage.progress.ordersProcessed', {
                            processed: wooProgress.processed || 0,
                            total: wooProgress.total || '?',
                          })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('importPage.progress.summary', {
                            imported: wooProgress.imported || 0,
                            skipped: wooProgress.skipped || 0,
                          })}
                        </Typography>
                        {wooProgress.status && (
                          <Typography variant="body2" color="text.secondary">
                            {t('importPage.progress.status', { status: wooProgress.status })}
                          </Typography>
                        )}
                        {wooProgress.message && (
                          <Typography variant="body2" color="text.secondary">
                            {wooProgress.message}
                          </Typography>
                        )}
                        {typeof wooProgress.percentage === 'number' && (
                          <Typography variant="h6" sx={{ mt: 1 }}>
                            {wooProgress.percentage}%
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                </Box>
              )}

              <Box mt={3} display="flex" gap={2}>
                <Button
                  variant="contained"
                  onClick={handleWooImport}
                  disabled={selectedStatuses.length === 0 || wooImportMutation.isLoading || isWooImportRunning}
                  startIcon={(wooImportMutation.isLoading || isWooImportRunning) ? <CircularProgress size={20} /> : <SyncIcon />}
                >
                  {(wooImportMutation.isLoading || isWooImportRunning)
                    ? t('importPage.woocommerce.importing')
                    : t('importPage.woocommerce.importButton')}
                </Button>
                {isWooImportRunning && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleWooStop}
                    disabled={isWooStopping}
                  >
                    {isWooStopping ? t('importPage.woocommerce.stopping') : t('importPage.woocommerce.stopButton')}
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ImportPage;

