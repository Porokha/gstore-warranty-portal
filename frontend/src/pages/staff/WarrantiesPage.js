import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Chip,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { warrantiesService } from '../../services/warrantiesService';
import { useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import CustomDataTable from '../../components/common/CustomDataTable';

const WarrantiesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    sku: searchParams.get('sku') || '',
    serial_number: searchParams.get('serial_number') || '',
    device_type: searchParams.get('device_type') || '',
    customer_phone: searchParams.get('customer_phone') || '',
    active_only: searchParams.get('active_only') || '',
    expired_only: searchParams.get('expired_only') || '',
  });

  const { data: warranties, isLoading, error } = useQuery(
    ['warranties', filters],
    () => warrantiesService.getAll(filters),
    {
      keepPreviousData: true,
    }
  );

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    Object.keys(newFilters).forEach((k) => {
      if (newFilters[k]) params.set(k, newFilters[k]);
    });
    setSearchParams(params);
  };

  const isWarrantyActive = (warrantyEnd) => {
    return new Date(warrantyEnd) >= new Date();
  };

  const getDaysLeft = (warrantyEnd) => {
    const end = new Date(warrantyEnd);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const rawData = useMemo(() => {
    if (!warranties) return [];
    if (Array.isArray(warranties)) return warranties;
    if (Array.isArray(warranties?.data)) return warranties.data;
    if (Array.isArray(warranties?.data?.data)) return warranties.data.data;
    return [];
  }, [warranties]);

  const rows = useMemo(() => rawData.map((warranty) => ({
    ...warranty,
    id: warranty.id,
    isActive: isWarrantyActive(warranty.warranty_end),
    daysLeft: getDaysLeft(warranty.warranty_end),
  })), [rawData]);

  const columns = useMemo(() => [
    {
      key: 'select',
      label: '',
      width: 50,
    },
    {
      key: 'warranty_id',
      label: t('warranty.warrantyId'),
      width: 160,
    },
    {
      key: 'title',
      label: t('case.productTitle'),
      width: 200,
    },
    {
      key: 'sku',
      label: t('case.sku'),
      width: 140,
    },
    {
      key: 'serial_number',
      label: t('case.serialNumber'),
      width: 160,
    },
    {
      key: 'customer',
      label: t('case.customerName'),
      width: 180,
      value: (row) => `${row.customer_name || ''} ${row.customer_last_name || ''}`.trim(),
    },
    {
      key: 'customer_phone',
      label: t('case.phone'),
      width: 160,
    },
    {
      key: 'purchase_date',
      label: t('warranty.purchaseDate'),
      width: 150,
      value: (row) => new Date(row.purchase_date).toLocaleDateString(),
    },
    {
      key: 'warranty_end',
      label: t('warranty.warrantyEndDate'),
      width: 170,
      value: (row) => new Date(row.warranty_end).toLocaleDateString(),
    },
    {
      key: 'daysLeft',
      label: t('warranty.daysLeft'),
      width: 150,
      render: (row) => {
        const active = row.isActive;
        const days = row.daysLeft;
        return (
          <Chip
            label={
              active
                ? `${days} ${t('warranty.daysLeft')}`
                : `${Math.abs(days)} ${t('warranty.daysAfterWarranty')}`
            }
            color={active ? (days <= 30 ? 'warning' : 'success') : 'default'}
            size="small"
          />
        );
      },
    },
    {
      key: 'status',
      label: t('common.status'),
      width: 140,
      render: (row) => (
        <Chip
          label={row.isActive ? (t('common.active') || 'Active') : (t('common.expired') || 'Expired')}
          color={row.isActive ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      key: 'actions',
      label: t('common.actions'),
      width: 180,
      render: (row) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title={t('common.view')}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/staff/warranties/${row.id}`);
              }}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.createCase')}>
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/staff/cases/new?warranty_id=${row.id}`);
              }}
            >
              <BuildIcon />
            </IconButton>
          </Tooltip>
          {isAdmin && (
            <Tooltip title={t('warranty.deleteWarranty')}>
              <IconButton
                size="small"
                color="error"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (window.confirm(t('warranty.deleteWarrantyConfirm'))) {
                    try {
                      await warrantiesService.delete(row.id);
                      queryClient.invalidateQueries('warranties');
                      alert(t('warranty.warrantyDeleted'));
                    } catch (err) {
                      alert(err.response?.data?.message || t('common.errorLoading'));
                    }
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ], [t, isAdmin, navigate, queryClient]);

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
        {t('common.errorLoading') || 'Error loading warranties'}
      </Alert>
    );
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('common.warranties')}</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            onClick={() => navigate('/staff/warranties/import/csv')}
          >
            {t('common.importCSV') || 'Import CSV'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/staff/warranties/import/woocommerce')}
          >
            {t('common.importWooCommerce') || 'Import from WooCommerce'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/staff/warranties/new')}
          >
            {t('common.createWarranty')}
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            size="small"
            label={t('common.search')}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <TextField
            size="small"
            label={t('case.sku')}
            value={filters.sku}
            onChange={(e) => handleFilterChange('sku', e.target.value)}
            sx={{ minWidth: 150 }}
          />
          <TextField
            size="small"
            label={t('case.serialNumber')}
            value={filters.serial_number}
            onChange={(e) => handleFilterChange('serial_number', e.target.value)}
            sx={{ minWidth: 150 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('case.deviceType')}</InputLabel>
            <Select
              value={filters.device_type}
              label={t('case.deviceType')}
              onChange={(e) => handleFilterChange('device_type', e.target.value)}
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              <MenuItem value="Laptop">Laptop</MenuItem>
              <MenuItem value="Phone">Phone</MenuItem>
              <MenuItem value="Tablet">Tablet</MenuItem>
              <MenuItem value="Desktop">Desktop</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('common.status')}</InputLabel>
            <Select
              value={filters.active_only || filters.expired_only || ''}
              label={t('common.status')}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange('active_only', value === 'active' ? 'true' : '');
                handleFilterChange('expired_only', value === 'expired' ? 'true' : '');
              }}
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              <MenuItem value="active">{t('common.active') || 'Active'}</MenuItem>
              <MenuItem value="expired">{t('common.expired') || 'Expired'}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <CustomDataTable
        columns={columns}
        data={rows}
        tableKey="warranties-table"
        frozenColumns={['select', 'warranty_id']}
        defaultColumnWidth={150}
        onRowClick={(row) => navigate(`/staff/warranties/${row.id}`)}
      />
    </div>
  );
};

export default WarrantiesPage;
