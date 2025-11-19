import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import api from '../../services/api';

const WarrantySearchPage = () => {
  const [warrantyId, setWarrantyId] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/public/search/warranty', {
        warranty_id: warrantyId,
        phone,
      });
      setResult(response.data);
    } catch (error) {
      setResult({ error: 'Warranty not found' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
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
          />
          <TextField
            fullWidth
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            margin="normal"
            required
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
        {result && (
          <Box sx={{ mt: 3 }}>
            {result.error ? (
              <Typography color="error">{result.error}</Typography>
            ) : (
              <Typography>Warranty details will be displayed here</Typography>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default WarrantySearchPage;

