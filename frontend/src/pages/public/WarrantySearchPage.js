import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, Chip, Alert, Grid, IconButton, Link } from '@mui/material';
import { ArrowBack, Home } from '@mui/icons-material';
import api from '../../services/api';

const WarrantySearchPage = () => {
  const navigate = useNavigate();
  const [warrantyId, setWarrantyId] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await api.post('/public/search/warranty', {
        warranty_id: warrantyId,
        phone,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Warranty not found or phone number does not match');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (level) => {
    const statuses = {
      1: 'Opened',
      2: 'Investigating',
      3: 'Pending',
      4: 'Completed',
    };
    return statuses[level] || 'Unknown';
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => navigate(-1)} aria-label="back">
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component={Link} onClick={() => navigate('/')} sx={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
            Search Warranty
          </Typography>
        </Box>
        <IconButton onClick={() => navigate('/')} aria-label="home">
          <Home />
        </IconButton>
      </Box>
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSearch}>
          <TextField
            fullWidth
            label="Warranty ID"
            value={warrantyId}
            onChange={(e) => setWarrantyId(e.target.value)}
            margin="normal"
            required
            placeholder="e.g., WP-0001-1234"
          />
          <TextField
            fullWidth
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            margin="normal"
            required
            placeholder="e.g., +995 555 123 456"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </form>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Warranty Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Warranty ID
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {result.warranty_id}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={result.is_active ? 'Active' : 'Expired'}
                  color={result.is_active ? 'success' : 'default'}
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Product
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {result.title}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  SKU
                </Typography>
                <Typography variant="body1">{result.sku}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Serial Number
                </Typography>
                <Typography variant="body1">{result.serial_number}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Device Type
                </Typography>
                <Typography variant="body1">{result.device_type}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Purchase Date
                </Typography>
                <Typography variant="body1">
                  {new Date(result.purchase_date).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Warranty Start
                </Typography>
                <Typography variant="body1">
                  {new Date(result.warranty_start).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Warranty End
                </Typography>
                <Typography variant="body1">
                  {new Date(result.warranty_end).toLocaleDateString()}
                </Typography>
              </Grid>
              {result.is_active && result.days_left !== null && (
                <Grid item xs={12}>
                  <Alert severity={result.days_left <= 30 ? 'warning' : 'info'}>
                    {result.days_left} days remaining
                  </Alert>
                </Grid>
              )}
              {!result.is_active && result.days_after_warranty !== null && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    Warranty expired {result.days_after_warranty} days ago
                  </Alert>
                </Grid>
              )}
              {result.extended_days > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Extended Days
                  </Typography>
                  <Typography variant="body1">+{result.extended_days} days</Typography>
                </Grid>
              )}
              {result.service_cases && result.service_cases.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Service Cases ({result.service_cases.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                    {result.service_cases.map((serviceCase) => (
                      <Paper
                        key={serviceCase.id}
                        sx={{
                          p: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: '1px solid #e0e0e0',
                        }}
                      >
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {serviceCase.case_number}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Status: {getStatusLabel(serviceCase.status_level)} • Opened: {new Date(serviceCase.opened_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/search/case?case_number=${serviceCase.case_number}&phone=${phone}`)}
                        >
                          View Case
                        </Button>
                      </Paper>
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default WarrantySearchPage;
