import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, Chip, Alert, Grid, IconButton, Link, Accordion, AccordionSummary, AccordionDetails, CircularProgress, Container, InputAdornment } from '@mui/material';
import { ArrowBack, ExpandMore, Visibility, Search as SearchIcon, VerifiedUser as WarrantyIcon } from '@mui/icons-material';
import api from '../../services/api';
import StatusBar from '../../components/cases/StatusBar';
import ResultBar from '../../components/cases/ResultBar';

const WarrantySearchPage = () => {
  const navigate = useNavigate();
  const [warrantyId, setWarrantyId] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCases, setExpandedCases] = useState({});
  const [caseDetails, setCaseDetails] = useState({});
  const [loadingCases, setLoadingCases] = useState({});

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

  const handleCaseExpand = async (caseId, caseNumber) => {
    const isExpanded = expandedCases[caseId];
    setExpandedCases({ ...expandedCases, [caseId]: !isExpanded });

    // Load case details if not already loaded
    if (!isExpanded && !caseDetails[caseId]) {
      setLoadingCases({ ...loadingCases, [caseId]: true });
      try {
        const response = await api.post('/public/search/case', {
          case_number: caseNumber,
          phone: phone,
        });
        setCaseDetails({ ...caseDetails, [caseId]: response.data });
      } catch (err) {
        console.error('Failed to load case details:', err);
      } finally {
        setLoadingCases({ ...loadingCases, [caseId]: false });
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f7fa',
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundSize: 'cover',
        pt: 4,
        pb: 8,
      }}
    >
      <Container maxWidth="md">
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <IconButton
            onClick={() => navigate('/')}
            aria-label="back"
            sx={{
              bgcolor: '#ffffff',
              '&:hover': { bgcolor: '#f1f5f9' },
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography
            variant="h4"
            onClick={() => navigate('/')}
            sx={{
              cursor: 'pointer',
              textDecoration: 'none',
              color: '#ffffff',
              fontWeight: 700,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Search Warranty
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            bgcolor: '#ffffff',
          }}
        >
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WarrantyIcon sx={{ color: '#ffffff', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b' }}>
              Find Your Warranty
            </Typography>
          </Box>

          <form onSubmit={handleSearch}>
            <TextField
              fullWidth
              label="Warranty ID"
              value={warrantyId}
              onChange={(e) => setWarrantyId(e.target.value)}
              margin="normal"
              required
              placeholder="e.g., WP-0001-1234"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#3b82f6',
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              margin="normal"
              required
              placeholder="e.g., +995 555 123 456"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#3b82f6',
                  },
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              startIcon={<SearchIcon />}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                bgcolor: '#3b82f6',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#2563eb',
                },
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </form>

          {error && (
            <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {result && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                Warranty Details
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    Warranty ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '16px' }}>
                    {result.warranty_id}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    Status
                  </Typography>
                  <Chip
                    label={result.is_active ? 'Active' : 'Expired'}
                    sx={{
                      bgcolor: result.is_active ? '#d1fae5' : '#f1f5f9',
                      color: result.is_active ? '#059669' : '#64748b',
                      fontWeight: 500,
                      mt: 0.5,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    Product
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '16px' }}>
                    {result.title}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    SKU
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1e293b', fontSize: '15px' }}>
                    {result.sku}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    Serial Number
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1e293b', fontSize: '15px' }}>
                    {result.serial_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    Device Type
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1e293b', fontSize: '15px' }}>
                    {result.device_type}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    Purchase Date
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1e293b', fontSize: '15px' }}>
                    {new Date(result.purchase_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    Warranty Start
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1e293b', fontSize: '15px' }}>
                    {new Date(result.warranty_start).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    Warranty End
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1e293b', fontSize: '15px' }}>
                    {new Date(result.warranty_end).toLocaleDateString()}
                  </Typography>
                </Grid>
                {result.is_active && result.days_left !== null && (
                  <Grid item xs={12}>
                    <Alert
                      severity={result.days_left <= 30 ? 'warning' : 'info'}
                      sx={{ borderRadius: 2 }}
                    >
                      {result.days_left} days remaining
                    </Alert>
                  </Grid>
                )}
                {!result.is_active && result.days_after_warranty !== null && (
                  <Grid item xs={12}>
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      Warranty expired {result.days_after_warranty} days ago
                    </Alert>
                  </Grid>
                )}
                {result.extended_days > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                      Extended Days
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#1e293b', fontSize: '15px' }}>
                      +{result.extended_days} days
                    </Typography>
                  </Grid>
                )}
                {result.service_cases && result.service_cases.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 1.5, fontSize: '13px', fontWeight: 500 }}>
                      Service Cases ({result.service_cases.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {result.service_cases.map((serviceCase) => {
                        const isExpanded = expandedCases[serviceCase.id];
                        const details = caseDetails[serviceCase.id];
                        const isLoading = loadingCases[serviceCase.id];
                        
                        return (
                          <Accordion
                            key={serviceCase.id}
                            expanded={isExpanded}
                            onChange={() => handleCaseExpand(serviceCase.id, serviceCase.case_number)}
                            sx={{
                              borderRadius: 2,
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                              '&:before': { display: 'none' },
                            }}
                          >
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 2 }}>
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '15px' }}>
                                    {serviceCase.case_number}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px', mt: 0.5 }}>
                                    Status: {getStatusLabel(serviceCase.status_level)} • Opened: {new Date(serviceCase.opened_at).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              {isLoading ? (
                                <Box display="flex" justifyContent="center" p={2}>
                                  <CircularProgress size={24} />
                                </Box>
                              ) : details ? (
                                <Box>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                                        Customer Name
                                      </Typography>
                                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '15px' }}>
                                        {details.customer_name} {details.customer_last_name || ''}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                                        Product
                                      </Typography>
                                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '15px' }}>
                                        {details.product_title}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                      <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontSize: '13px' }}>
                                        Status
                                      </Typography>
                                      <StatusBar statusLevel={details.status_level} size="small" />
                                    </Grid>
                                    {details.result_type && (
                                      <Grid item xs={12}>
                                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontSize: '13px' }}>
                                          Result
                                        </Typography>
                                        <ResultBar resultType={details.result_type} size="small" />
                                      </Grid>
                                    )}
                                    {details.customer_initial_note && (
                                      <Grid item xs={12}>
                                        <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                                          Customer's Initial Note
                                        </Typography>
                                        <Alert severity="info" sx={{ mt: 0.5, borderRadius: 2 }}>
                                          {details.customer_initial_note}
                                        </Alert>
                                      </Grid>
                                    )}
                                    {details.status_history && details.status_history.length > 0 && (
                                      <Grid item xs={12}>
                                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontSize: '13px', fontWeight: 500 }}>
                                          Status Updates
                                        </Typography>
                                        {details.status_history.map((history, idx) => (
                                          <Alert key={idx} severity="info" sx={{ mt: 1, borderRadius: 2 }}>
                                            <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                              {new Date(history.created_at).toLocaleString()}
                                            </Typography>
                                            {history.note_public && (
                                              <Typography variant="body2" sx={{ mt: 0.5, fontSize: '13px' }}>
                                                {history.note_public}
                                              </Typography>
                                            )}
                                          </Alert>
                                        ))}
                                      </Grid>
                                    )}
                                  </Grid>
                                </Box>
                              ) : (
                                <Typography sx={{ color: '#64748b', fontSize: '14px' }}>Click to load case details</Typography>
                              )}
                            </AccordionDetails>
                          </Accordion>
                        );
                      })}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default WarrantySearchPage;
