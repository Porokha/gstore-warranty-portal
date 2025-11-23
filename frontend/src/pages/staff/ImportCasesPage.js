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
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const ImportCasesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const downloadExample = async () => {
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
      setError('Failed to download example CSV');
    }
  };

  const uploadMutation = useMutation(
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
        setSuccess(data);
        setFile(null);
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to import cases');
      },
    }
  );

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
      setSuccess(null);
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError('Please select a file');
      return;
    }
    uploadMutation.mutate(file);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Typography variant="h4">Import Cases from CSV</Typography>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Box mb={3}>
            <Typography variant="body1" gutterBottom>
              Upload a CSV file to import multiple service cases at once.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadExample}
              sx={{ mt: 2 }}
            >
              Download Example CSV
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="h6">Import Complete!</Typography>
              <Typography>Successfully imported: {success.imported} cases</Typography>
              {success.errors > 0 && (
                <Typography color="warning.main">
                  Errors: {success.errors} rows failed
                </Typography>
              )}
            </Alert>
          )}

          <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 4, textAlign: 'center' }}>
            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="csv-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="csv-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                size="large"
              >
                Select CSV File
              </Button>
            </label>
            {file && (
              <Box mt={2}>
                <Typography variant="body1">Selected: {file.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Size: {(file.size / 1024).toFixed(2)} KB
                </Typography>
              </Box>
            )}
          </Box>

          {uploadMutation.isLoading && (
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
              onClick={handleUpload}
              disabled={!file || uploadMutation.isLoading}
              startIcon={uploadMutation.isLoading ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              {uploadMutation.isLoading ? 'Importing...' : 'Import Cases'}
            </Button>
            <Button variant="outlined" onClick={() => navigate('/staff/cases')}>
              Cancel
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ImportCasesPage;

