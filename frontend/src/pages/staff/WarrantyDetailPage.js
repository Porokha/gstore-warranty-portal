import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Snackbar,
} from '@mui/material';
import { ArrowBack, Edit, Sms } from '@mui/icons-material';
import { warrantiesService } from '../../services/warrantiesService';
import { useAuth } from '../../contexts/AuthContext';
import { isManagementRole } from '../../utils/roles';

const WarrantyDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageWarranties = isManagementRole(user?.role);
  const [notification, setNotification] = React.useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data: warranty, isLoading, error } = useQuery(
    ['warranty', id],
    () => warrantiesService.getById(id),
    {
      enabled: !!id,
    }
  );

  const resendSmsMutation = useMutation(
    () => warrantiesService.resendCreatedSms(id),
    {
      onSuccess: (result) => {
        setNotification({
          open: true,
          message: result?.message || 'Warranty SMS resent successfully',
          severity: result?.success === false ? 'warning' : 'success',
        });
      },
      onError: (err) => {
        setNotification({
          open: true,
          message: err.response?.data?.message || 'Warranty SMS could not be resent',
          severity: 'error',
        });
      },
    }
  );

  const formatCurrency = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return value;
    }
    return `₾${numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/staff/warranties')}
            sx={{ textTransform: 'none' }}
          >
            {t('common.back') || 'Back'}
          </Button>
        </Box>
        <Alert severity="error">
          {error.response?.status === 404 
            ? (t('warranty.warrantyNotFound') || 'Warranty not found')
            : (t('common.errorLoading') || 'Error loading warranty')}
        </Alert>
      </Box>
    );
  }

  if (!warranty && !isLoading) {
    return (
      <Box>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/staff/warranties')}
            sx={{ textTransform: 'none' }}
          >
            {t('common.back') || 'Back'}
          </Button>
        </Box>
        <Alert severity="warning">
          {t('warranty.warrantyNotFound') || 'Warranty not found'}
        </Alert>
      </Box>
    );
  }

  const isActive = new Date(warranty.warranty_end) >= new Date();
  const daysLeft = Math.ceil((new Date(warranty.warranty_end) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/staff/warranties')}
            sx={{ textTransform: 'none' }}
          >
            {t('common.back') || 'Back'}
          </Button>
          <Typography variant="h4">{t('warranty.warrantyDetails') || 'Warranty Details'}</Typography>
        </Box>
        {canManageWarranties && (
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={resendSmsMutation.isLoading ? <CircularProgress size={16} /> : <Sms />}
              disabled={resendSmsMutation.isLoading || !warranty.customer_phone}
              onClick={() => resendSmsMutation.mutate()}
              sx={{ textTransform: 'none' }}
            >
              {t('warranty.resendWarrantySms') || 'Resend warranty SMS'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate(`/staff/warranties/${id}/edit`)}
              sx={{ textTransform: 'none' }}
            >
              {t('warranty.editWarranty') || 'Edit Warranty'}
            </Button>
          </Box>
        )}
      </Box>

      <Paper sx={{ p: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
              {t('warranty.warrantyId')}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              {warranty.warranty_id}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
              {t('common.status')}
            </Typography>
            <Chip
              label={isActive ? (t('common.active') || 'Active') : (t('common.expired') || 'Expired')}
              color={isActive ? 'success' : 'default'}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
              {t('warranty.product')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {warranty.title}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
              {t('warranty.sku')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {warranty.sku || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
              {t('warranty.price')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {formatCurrency(warranty.price)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
              {t('warranty.serialNumber')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {warranty.serial_number || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
              {t('warranty.deviceType')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {warranty.device_type || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
              {t('warranty.customerName')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {warranty.customer_name} {warranty.customer_last_name || ''}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
              {t('warranty.customerPhone')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {warranty.customer_phone}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
              {t('warranty.purchaseDate')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {new Date(warranty.purchase_date).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
              {t('warranty.warrantyStart')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {new Date(warranty.warranty_start).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
              {t('warranty.warrantyEnd')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {new Date(warranty.warranty_end).toLocaleDateString()}
            </Typography>
          </Grid>
          {isActive && (
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                {t('warranty.daysLeft')}
              </Typography>
              <Chip
                label={`${daysLeft} ${t('common.days')}`}
                color={daysLeft <= 30 ? 'warning' : 'success'}
                sx={{ mb: 2 }}
              />
            </Grid>
          )}

          {canManageWarranties && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, color: '#64748b' }}>
                  {t('warranty.adminOnlyInfo')}
                </Typography>
              </Grid>

              {warranty.brand && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                    {t('warranty.brand') || 'Brand'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {warranty.brand}
                  </Typography>
                </Grid>
              )}

              {warranty.model && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                    {t('warranty.model') || 'Model'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {warranty.model}
                  </Typography>
                </Grid>
              )}

              {warranty.condition && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                    {t('warranty.condition') || 'Condition'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {warranty.condition}
                  </Typography>
                </Grid>
              )}

              {warranty.personal_identification_number && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                    {t('warranty.personalIdentificationNumber') || 'P/N'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {warranty.personal_identification_number}
                  </Typography>
                </Grid>
              )}

              {warranty.admin_notes && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                    {t('warranty.adminNotes') || 'Admin Notes'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                    {warranty.admin_notes}
                  </Typography>
                </Grid>
              )}
            </>
          )}
        </Grid>
      </Paper>
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={notification.severity}
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WarrantyDetailPage;
