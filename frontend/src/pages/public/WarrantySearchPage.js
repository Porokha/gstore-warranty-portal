import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Chip, Alert, Grid } from '@mui/material';
import api from '../../services/api';

const WarrantySearchPage = () => {
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

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Search Warranty
      </Typography>
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
              {result.service_cases_count > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Service Cases
                  </Typography>
                  <Typography variant="body1">
                    {result.service_cases_count} case(s) associated with this warranty
                  </Typography>
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
