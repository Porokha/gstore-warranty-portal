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
  Autocomplete,
  Paper,
  Divider,
} from '@mui/material';
import { casesService } from '../../services/casesService';
import { paymentsService } from '../../services/paymentsService';
import { usersService } from '../../services/usersService';
import StatusBar from '../../components/cases/StatusBar';
import ResultBar from '../../components/cases/ResultBar';
import StatusStepper from '../../components/cases/StatusStepper';
import StatusChangeForm from '../../components/cases/StatusChangeForm';
import FileUpload from '../../components/cases/FileUpload';
import { useAuth } from '../../contexts/AuthContext';

const CaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);

  const { data: case_, isLoading } = useQuery(
    ['case', id],
    () => casesService.getById(id),
    { enabled: !!id }
  );

  const { data: payments } = useQuery(
    ['case-payments', id],
    () => paymentsService.getByCase(id),
    { enabled: !!id }
  );

  const { data: technicians } = useQuery(
    'technicians',
    () => usersService.getTechnicians(),
    { enabled: isAdmin }
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

  const updateCaseMutation = useMutation(
    (data) => casesService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['case', id]);
        queryClient.invalidateQueries('cases');
      },
    }
  );

  const handleStatusChange = (data) => {
    statusChangeMutation.mutate(data);
  };

  const handleUpdateCase = (field, value) => {
    updateCaseMutation.mutate({ [field]: value });
  };

  // Extract status timestamps from history
  const getStatusTimestamps = () => {
    if (!case_?.status_history) return {};
    const timestamps = {};
    case_.status_history.forEach((history) => {
      if (history.new_status_level && !timestamps[history.new_status_level]) {
        timestamps[history.new_status_level] = history.created_at;
      }
    });
    return timestamps;
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

  const statusTimestamps = getStatusTimestamps();

  return (
    <Dialog open={true} onClose={() => navigate('/staff/cases')} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{case_.case_number}</Typography>
          <Button onClick={() => navigate('/staff/cases')}>{t('common.close')}</Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} sx={{ mb: 3 }}>
          <Tab label={t('common.details')} />
          <Tab label={t('common.status')} />
          <Tab label={t('common.result')} />
          <Tab label={t('common.files')} />
          <Tab label={t('common.history')} />
        </Tabs>

        {/* Tab 1: Details */}
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
                label={t('case.warrantyId') || 'Warranty ID'}
                value={case_.warranty?.warranty_id || '-'}
                disabled
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.orderId')}
                value={case_.order_id || ''}
                onChange={(e) => handleUpdateCase('order_id', e.target.value ? parseInt(e.target.value) : null)}
                disabled={!isAdmin}
                margin="normal"
                type="number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.productId')}
                value={case_.product_id || ''}
                onChange={(e) => handleUpdateCase('product_id', e.target.value ? parseInt(e.target.value) : null)}
                disabled={!isAdmin}
                margin="normal"
                type="number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.productTitle')}
                value={case_.product_title}
                onChange={(e) => handleUpdateCase('product_title', e.target.value)}
                disabled={!isAdmin}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.sku')}
                value={case_.sku || ''}
                onChange={(e) => handleUpdateCase('sku', e.target.value)}
                disabled={!isAdmin}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.serialNumber')}
                value={case_.serial_number || ''}
                onChange={(e) => handleUpdateCase('serial_number', e.target.value)}
                disabled={!isAdmin}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>{t('case.deviceType')}</InputLabel>
                <Select
                  value={case_.device_type || 'Laptop'}
                  label={t('case.deviceType')}
                  onChange={(e) => handleUpdateCase('device_type', e.target.value)}
                  disabled={!isAdmin}
                >
                  <MenuItem value="Laptop">Laptop</MenuItem>
                  <MenuItem value="Phone">Phone</MenuItem>
                  <MenuItem value="Tablet">Tablet</MenuItem>
                  <MenuItem value="Desktop">Desktop</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="IMEI"
                value={case_.imei || ''}
                onChange={(e) => handleUpdateCase('imei', e.target.value)}
                disabled={!isAdmin}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.customerName')}
                value={case_.customer_name}
                onChange={(e) => handleUpdateCase('customer_name', e.target.value)}
                disabled={!isAdmin}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.customerLastName')}
                value={case_.customer_last_name || ''}
                onChange={(e) => handleUpdateCase('customer_last_name', e.target.value)}
                disabled={!isAdmin}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.phone')}
                value={case_.customer_phone}
                onChange={(e) => handleUpdateCase('customer_phone', e.target.value)}
                disabled={!isAdmin}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('case.email')}
                value={case_.customer_email || ''}
                onChange={(e) => handleUpdateCase('customer_email', e.target.value)}
                disabled={!isAdmin}
                margin="normal"
                type="email"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label={t('case.customerInitialNote') || "Customer's Initial Note (Problem Description)"}
                value={case_.customer_initial_note || ''}
                onChange={(e) => handleUpdateCase('customer_initial_note', e.target.value)}
                disabled={!isAdmin}
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
                value={case_.deadline_at ? new Date(case_.deadline_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => handleUpdateCase('deadline_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                disabled={!isAdmin}
                margin="normal"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {case_.closed_at && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('case.closeDate') || 'Close Date'}
                  value={new Date(case_.closed_at).toLocaleString()}
                  disabled
                  margin="normal"
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>{t('common.priority')}</InputLabel>
                <Select
                  value={case_.priority}
                  label={t('common.priority')}
                  onChange={(e) => handleUpdateCase('priority', e.target.value)}
                  disabled={!isAdmin}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {isAdmin && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>{t('case.technician')}</InputLabel>
                  <Select
                    value={case_.assigned_technician_id || ''}
                    label={t('case.technician')}
                    onChange={(e) => handleUpdateCase('assigned_technician_id', e.target.value)}
                  >
                    <MenuItem value="">{t('common.none')}</MenuItem>
                    {technicians?.map((tech) => (
                      <MenuItem key={tech.id} value={tech.id}>
                        {tech.name} {tech.last_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={[]}
                freeSolo
                value={case_.tags || []}
                onChange={(event, newValue) => handleUpdateCase('tags', newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('common.tags')}
                    margin="normal"
                    disabled={!isAdmin}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={index}
                    />
                  ))
                }
              />
            </Grid>
          </Grid>
        )}

        {/* Tab 2: Status & Notes */}
        {tab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('common.currentStatus')}
            </Typography>
            <StatusStepper currentStatus={case_.status_level} statusTimestamps={statusTimestamps} />
            <StatusBar statusLevel={case_.status_level} size="large" />
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                {t('common.changeStatus')}
              </Typography>
              <StatusChangeForm
                case_={case_}
                onStatusChange={handleStatusChange}
                isLoading={statusChangeMutation.isLoading}
              />
            </Box>
          </Box>
        )}

        {/* Tab 3: Result */}
        {tab === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('common.result')}
            </Typography>
            <ResultBar resultType={case_.result_type} size="large" />
            
            {payments && payments.length > 0 && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  {t('payment.offersAndPayments') || 'Offers & Payments'}
                </Typography>
                {payments.map((payment) => (
                  <Paper key={payment.id} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {payment.offer_type === 'payable' ? t('result.payable') : t('result.replaceable')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('common.amount')}:</strong> {payment.offer_amount || 0} ₾
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('payment.status')}:</strong> {payment.payment_status}
                    </Typography>
                    {payment.payment_method && (
                      <Typography variant="body2">
                        <strong>{t('payment.method')}:</strong> {payment.payment_method}
                      </Typography>
                    )}
                    {payment.generated_code && (
                      <Typography variant="body2">
                        <strong>{t('payment.code') || 'Code'}:</strong> {payment.generated_code}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Box>
            )}

            {isAdmin && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  {t('common.quickActions') || 'Quick Actions'}
                </Typography>
                <Box display="flex" gap={2}>
                  <Button
                    variant="outlined"
                    onClick={() => handleStatusChange({ new_status_level: 4, result_type: 'covered' })}
                  >
                    {t('common.markCovered') || 'Mark Covered'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handleStatusChange({ new_status_level: 4, result_type: 'returned' })}
                  >
                    {t('common.markReturned') || 'Mark Returned'}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Tab 4: Files */}
        {tab === 3 && (
          <Box>
            <FileUpload caseId={id} />
          </Box>
        )}

        {/* Tab 5: History */}
        {tab === 4 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('common.history')}
            </Typography>
            {case_.status_history && case_.status_history.length > 0 ? (
              case_.status_history
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map((history) => (
                  <Paper
                    key={history.id}
                    sx={{ p: 2, mb: 2 }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {new Date(history.created_at).toLocaleString()}
                    </Typography>
                    {history.previous_status_level !== null && (
                      <Typography variant="body1" gutterBottom>
                        <strong>{t('common.status')}:</strong>{' '}
                        {history.previous_status_level} → {history.new_status_level}
                      </Typography>
                    )}
                    {history.new_result && (
                      <Typography variant="body1" gutterBottom>
                        <strong>{t('common.result')}:</strong> {history.new_result}
                      </Typography>
                    )}
                    {history.note_public && (
                      <Box mt={1} p={1} sx={{ backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                        <Typography variant="body2">
                          <strong>{t('common.publicNote')}:</strong> {history.note_public}
                        </Typography>
                      </Box>
                    )}
                    {history.note_private && (
                      <Box mt={1} p={1} sx={{ backgroundColor: '#fff3e0', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>{t('common.privateNote')}:</strong> {history.note_private}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                ))
            ) : (
              <Typography>{t('common.noHistory')}</Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {isAdmin && (
          <Button
            color="error"
            onClick={async () => {
              if (window.confirm(t('case.deleteCaseConfirm'))) {
                try {
                  await casesService.delete(id);
                  queryClient.invalidateQueries('cases');
                  navigate('/staff/cases');
                } catch (error) {
                  alert(error.response?.data?.message || t('common.errorLoading'));
                }
              }
            }}
          >
            {t('case.deleteCase')}
          </Button>
        )}
        <Button onClick={() => navigate('/staff/cases')}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CaseDetailPage;
