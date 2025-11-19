import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import api from '../../services/api';

const CaseSearchPage = () => {
  const [caseNumber, setCaseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/public/search/case', {
        case_number: caseNumber,
        phone,
      });
      setResult(response.data);
    } catch (error) {
      setResult({ error: 'Case not found' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Search Service Case
      </Typography>
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSearch}>
          <TextField
            fullWidth
            label="Case Number"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
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
              <Typography>Case details will be displayed here</Typography>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CaseSearchPage;

