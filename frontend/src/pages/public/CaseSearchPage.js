import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, TextField, Button, Typography, Paper, Chip, Alert, Grid, Divider, IconButton, Link, Container, InputAdornment } from '@mui/material';
import { ArrowBack, Search as SearchIcon, FolderOpen as CaseIcon } from '@mui/icons-material';
import api from '../../services/api';
import StatusBar from '../../components/cases/StatusBar';
import ResultBar from '../../components/cases/ResultBar';

const CaseSearchPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [caseNumber, setCaseNumber] = useState(searchParams.get('case_number') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-search if params are provided
  React.useEffect(() => {
    if (caseNumber && phone && !result) {
      handleSearch({ preventDefault: () => {} });
    }
  }, []);

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
      setSearchParams({ case_number: caseNumber, phone });
    } catch (err) {
      setError(err.response?.data?.message || t('caseSearch.notFound'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (level) => {
    const statuses = {
      1: t('status.opened'),
      2: t('status.investigating'),
      3: t('status.pending'),
      4: t('status.completed'),
    };
    return statuses[level] || 'Unknown';
  };

  const getResultLabel = (result) => {
    const results = {
      covered: t('result.covered'),
      payable: t('result.payable'),
      returned: t('result.returned'),
      replaceable: t('result.replaceable'),
    };
    return results[result] || result;
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 70px)',
        background: 'linear-gradient(180deg, #fbf9ff 0%, #f3ecff 100%)',
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
              border: '1px solid #e3d7ff',
              '&:hover': { bgcolor: '#f3ecff' },
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
              color: '#18181b',
              fontWeight: 700,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {t('caseSearch.title')}
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            boxShadow: '0 28px 90px rgba(63, 30, 120, 0.1)',
            bgcolor: '#ffffff',
            border: '1px solid #e3d7ff',
          }}
        >
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: '#18181b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CaseIcon sx={{ color: '#ffffff', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#18181b' }}>
              {t('caseSearch.findCase')}
            </Typography>
          </Box>

          <form onSubmit={handleSearch}>
            <TextField
              fullWidth
              label={t('caseSearch.caseNumber')}
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              margin="normal"
              required
              placeholder="e.g., SCN-000001"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#fbf9ff',
                  '& fieldset': {
                    borderColor: '#e3d7ff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#a576ff',
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label={t('caseSearch.phoneNumber')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              margin="normal"
              required
              placeholder="e.g., +995 555 123 456"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#fbf9ff',
                  '& fieldset': {
                    borderColor: '#e3d7ff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#a576ff',
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
                bgcolor: '#a576ff',
                color: '#111111',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#8f5ef0',
                  color: '#ffffff',
                },
              }}
            >
              {loading ? t('caseSearch.searching') : t('caseSearch.search')}
            </Button>
          </form>

          {error && (
            <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {result && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#18181b', mb: 3 }}>
                {t('caseSearch.caseDetails')}
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: '#5b5568', mb: 0.5, fontSize: '13px' }}>
                    {t('caseSearch.customerName')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#18181b', fontSize: '16px' }}>
                    {result.customer_name} {result.customer_last_name || ''}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: '#5b5568', mb: 0.5, fontSize: '13px' }}>
                    {t('caseSearch.caseNumber')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#18181b', fontSize: '16px' }}>
                    {result.case_number}
                  </Typography>
                </Grid>
                {result.warranty_id && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ color: '#5b5568', mb: 0.5, fontSize: '13px' }}>
                      {t('caseSearch.warrantyId')}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1" sx={{ color: '#18181b', fontSize: '15px' }}>
                        {result.warranty_id}
                      </Typography>
                      {result.warranty_status && (
                        <Chip
                          label={result.warranty_status.is_active ? t('caseSearch.activeWarranty') : t('caseSearch.expiredWarranty')}
                          sx={{
                            bgcolor: result.warranty_status.is_active ? '#efe7ff' : '#f2f2f2',
                            color: result.warranty_status.is_active ? '#6d28d9' : '#5b5568',
                            fontWeight: 500,
                            fontSize: '11px',
                            height: 24,
                          }}
                          size="small"
                        />
                      )}
                    </Box>
                  </Grid>
                )}
                {result.customer_initial_note && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                      {t('caseSearch.customerNote')}
                    </Typography>
                    <Alert severity="info" sx={{ mt: 0.5, borderRadius: 2 }}>
                      {result.customer_initial_note}
                    </Alert>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: '#5b5568', mb: 0.5, fontSize: '13px' }}>
                    {t('caseSearch.product')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#18181b', fontSize: '16px' }}>
                    {result.product_title}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#5b5568', mb: 0.5, fontSize: '13px' }}>
                    {t('caseSearch.deviceType')}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#18181b', fontSize: '15px' }}>
                    {result.device_type}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#5b5568', mb: 0.5, fontSize: '13px' }}>
                    {t('caseSearch.openedDate')}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#18181b', fontSize: '15px' }}>
                    {new Date(result.opened_at).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#5b5568', mb: 0.5, fontSize: '13px' }}>
                    {t('caseSearch.deadline')}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#18181b', fontSize: '15px' }}>
                    {new Date(result.deadline_at).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: '#5b5568', mb: 1, fontSize: '13px' }}>
                    {t('caseSearch.status')}
                  </Typography>
                  <StatusBar statusLevel={result.status_level} size="medium" />
                  <Typography variant="body2" sx={{ mt: 1, color: '#5b5568', fontSize: '13px' }}>
                    {getStatusLabel(result.status_level)}
                  </Typography>
                </Grid>
                {result.result_type && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: '#5b5568', mb: 1, fontSize: '13px' }}>
                      {t('caseSearch.result')}
                    </Typography>
                    <ResultBar resultType={result.result_type} size="medium" />
                    <Typography variant="body2" sx={{ mt: 1, color: '#5b5568', fontSize: '13px' }}>
                      {getResultLabel(result.result_type)}
                    </Typography>
                  </Grid>
                )}
                {result.assigned_technician && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ color: '#5b5568', mb: 0.5, fontSize: '13px' }}>
                      {t('caseSearch.assignedTechnician')}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#18181b', fontSize: '15px' }}>
                      {result.assigned_technician.name} {result.assigned_technician.last_name}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {result.status_history && result.status_history.length > 0 && (
                <>
                  <Divider sx={{ my: 4 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
                    {t('caseSearch.statusUpdates')}
                  </Typography>
                  {result.status_history.map((history, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2.5,
                        mb: 2,
                        border: '1px solid #e3d7ff',
                        borderRadius: 2,
                        bgcolor: '#fbf9ff',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#5b5568', fontSize: '12px' }}>
                        {new Date(history.created_at).toLocaleString()}
                      </Typography>
                      {history.new_status_level && (
                        <Typography variant="body2" sx={{ mt: 0.5, color: '#18181b', fontSize: '14px' }}>
                          {t('caseSearch.status')}: {getStatusLabel(history.new_status_level)}
                        </Typography>
                      )}
                      {history.new_result && (
                        <Typography variant="body2" sx={{ mt: 0.5, color: '#18181b', fontSize: '14px' }}>
                          {t('caseSearch.result')}: {getResultLabel(history.new_result)}
                        </Typography>
                      )}
                      {history.note_public && (
                        <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>
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
      </Container>
    </Box>
  );
};

export default CaseSearchPage;
