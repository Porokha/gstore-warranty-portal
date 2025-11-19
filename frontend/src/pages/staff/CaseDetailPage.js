import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { casesService } from '../../services/casesService';
import StatusBar from '../../components/cases/StatusBar';
import ResultBar from '../../components/cases/ResultBar';
import StatusChangeForm from '../../components/cases/StatusChangeForm';

const CaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);

  const { data: case_, isLoading } = useQuery(
    ['case', id],
    () => casesService.getById(id),
    { enabled: !!id }
  );

  const statusChangeMutation = useMutation(
    (data) => casesService.changeStatus(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['case', id]);
        queryClient.invalidateQueries('cases');
        queryClient.invalidateQueries('dashboard');
      },
    }
  );

  const handleStatusChange = (data) => {
    statusChangeMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!case_) {
    return <Alert severity="error">Case not found</Alert>;
  }

  return (
    <Dialog open={true} onClose={() => navigate('/staff/cases')} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{case_.case_number}</Typography>
          <Button onClick={() => navigate('/staff/cases')}>Close</Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} sx={{ mb: 3 }}>
          <Tab label={t('common.details') || 'Details'} />
          <Tab label={t('common.status')} />
          <Tab label={t('common.result')} />
          <Tab label={t('common.history') || 'History'} />
        </Tabs>

        {tab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.caseNumber')}
                value={case_.case_number}
                disabled
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.productTitle')}
                value={case_.product_title}
                disabled
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.customerName')}
                value={case_.customer_name}
                disabled
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.phone')}
                value={case_.customer_phone}
                disabled
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.openDate')}
                value={new Date(case_.opened_at).toLocaleString()}
                disabled
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.deadline')}
                value={new Date(case_.deadline_at).toLocaleString()}
                disabled
                margin="normal"
              />
            </Grid>
          </Grid>
        )}

        {tab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('common.currentStatus') || 'Current Status'}
            </Typography>
            <StatusBar statusLevel={case_.status_level} size="large" />
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                {t('common.changeStatus') || 'Change Status'}
              </Typography>
              <StatusChangeForm
                case_={case_}
                onStatusChange={handleStatusChange}
                isLoading={statusChangeMutation.isLoading}
              />
            </Box>
          </Box>
        )}

        {tab === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('common.result')}
            </Typography>
            <ResultBar resultType={case_.result_type} size="large" />
          </Box>
        )}

        {tab === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('common.history') || 'History'}
            </Typography>
            {case_.status_history && case_.status_history.length > 0 ? (
              case_.status_history
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map((history) => (
                  <Box
                    key={history.id}
                    mb={2}
                    p={2}
                    sx={{
                      border: '1px solid #ccc',
                      borderRadius: 1,
                      backgroundColor: '#f9f9f9',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {new Date(history.created_at).toLocaleString()}
                    </Typography>
                    {history.previous_status_level !== null && (
                      <Typography variant="body1" gutterBottom>
                        <strong>Status:</strong>{' '}
                        {history.previous_status_level} → {history.new_status_level}
                      </Typography>
                    )}
                    {history.new_result && (
                      <Typography variant="body1" gutterBottom>
                        <strong>Result:</strong> {history.new_result}
                      </Typography>
                    )}
                    {history.note_public && (
                      <Box mt={1} p={1} sx={{ backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                        <Typography variant="body2">
                          <strong>Public Note:</strong> {history.note_public}
                        </Typography>
                      </Box>
                    )}
                    {history.note_private && (
                      <Box mt={1} p={1} sx={{ backgroundColor: '#fff3e0', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Private Note:</strong> {history.note_private}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))
            ) : (
              <Typography>{t('common.noHistory') || 'No history available'}</Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => navigate('/staff/cases')}>{t('common.close') || 'Close'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CaseDetailPage;

