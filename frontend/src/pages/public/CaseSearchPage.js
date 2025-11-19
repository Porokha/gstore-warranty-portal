import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Chip, Alert, Grid, Divider } from '@mui/material';
import api from '../../services/api';
import StatusBar from '../../components/cases/StatusBar';
import ResultBar from '../../components/cases/ResultBar';

const CaseSearchPage = () => {
  const [caseNumber, setCaseNumber] = useState('');
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
      const response = await api.post('/public/search/case', {
        case_number: caseNumber,
        phone,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Case not found or phone number does not match');
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

  const getResultLabel = (result) => {
    const results = {
      covered: 'Covered by Warranty',
      payable: 'Payable',
      returned: 'Returned as is',
      replaceable: 'Replaceable',
    };
    return results[result] || result;
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, mb: 4 }}>
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
            placeholder="e.g., SCN-000001"
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
              Case Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Case Number
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {result.case_number}
                </Typography>
              </Grid>
              {result.warranty_id && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Warranty ID
                  </Typography>
                  <Typography variant="body1">{result.warranty_id}</Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Product
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {result.product_title}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Device Type
                </Typography>
                <Typography variant="body1">{result.device_type}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Opened Date
                </Typography>
                <Typography variant="body1">
                  {new Date(result.opened_at).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Deadline
                </Typography>
                <Typography variant="body1">
                  {new Date(result.deadline_at).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <StatusBar statusLevel={result.status_level} size="medium" />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {getStatusLabel(result.status_level)}
                </Typography>
              </Grid>
              {result.result_type && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Result
                  </Typography>
                  <ResultBar resultType={result.result_type} size="medium" />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {getResultLabel(result.result_type)}
                  </Typography>
                </Grid>
              )}
              {result.assigned_technician && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Assigned Technician
                  </Typography>
                  <Typography variant="body1">
                    {result.assigned_technician.name} {result.assigned_technician.last_name}
                  </Typography>
                </Grid>
              )}
            </Grid>

            {result.status_history && result.status_history.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Status Updates
                </Typography>
                {result.status_history.map((history, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      backgroundColor: '#f9f9f9',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {new Date(history.created_at).toLocaleString()}
                    </Typography>
                    {history.new_status_level && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Status: {getStatusLabel(history.new_status_level)}
                      </Typography>
                    )}
                    {history.new_result && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Result: {getResultLabel(history.new_result)}
                      </Typography>
                    )}
                    {history.note_public && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        {history.note_public}
                      </Alert>
                    )}
                  </Box>
                ))}
              </>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CaseSearchPage;
