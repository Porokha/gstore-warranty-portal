import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
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
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { warrantiesService } from '../../services/warrantiesService';

const WarrantyDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: warranty, isLoading, error } = useQuery(
    ['warranty', id],
    () => warrantiesService.getById(id),
    {
      enabled: !!id,
    }
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {t('common.errorLoading') || 'Error loading warranty'}
      </Alert>
    );
  }

  if (!warranty) {
    return (
      <Alert severity="warning">
        {t('warranty.warrantyNotFound') || 'Warranty not found'}
      </Alert>
    );
  }

  const isActive = new Date(warranty.warranty_end) >= new Date();
  const daysLeft = Math.ceil((new Date(warranty.warranty_end) - new Date()) / (1000 * 60 * 60 * 24));

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
        <Typography variant="h4">{t('warranty.warrantyDetails') || 'Warranty Details'}</Typography>
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
        </Grid>
      </Paper>
    </Box>
  );
};

export default WarrantyDetailPage;

