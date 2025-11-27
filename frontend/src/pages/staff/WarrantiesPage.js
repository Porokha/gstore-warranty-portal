import React, { useState } from 'react';
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
import SmartDataGrid from '../../components/common/SmartDataGrid';

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

  const rawData = React.useMemo(() => {
    if (!warranties) return [];
    if (Array.isArray(warranties)) return warranties;
    if (Array.isArray(warranties?.data)) return warranties.data;
    if (Array.isArray(warranties?.data?.data)) return warranties.data.data;
    return [];
  }, [warranties]);

  const rows = React.useMemo(() => rawData.map((warranty) => ({
    ...warranty,
    id: warranty.id,
    isActive: isWarrantyActive(warranty.warranty_end),
    daysLeft: getDaysLeft(warranty.warranty_end),
  })), [rawData]);

  const columns = React.useMemo(() => [
    {
      field: 'warranty_id',
      headerName: t('warranty.warrantyId'),
      minWidth: 160,
      flex: 1,
    },
    {
      field: 'title',
      headerName: t('case.productTitle'),
      flex: 1.4,
      minWidth: 200,
    },
    {
      field: 'sku',
      headerName: t('case.sku'),
      minWidth: 140,
    },
    {
      field: 'serial_number',
      headerName: t('case.serialNumber'),
      minWidth: 160,
    },
    {
      field: 'customer',
      headerName: t('case.customerName'),
      flex: 1.2,
      minWidth: 180,
      valueGetter: (params) =>
        `${params.row.customer_name || ''} ${params.row.customer_last_name || ''}`.trim(),
    },
    {
      field: 'customer_phone',
      headerName: t('case.phone'),
      minWidth: 160,
    },
    {
      field: 'purchase_date',
      headerName: t('warranty.purchaseDate'),
      minWidth: 150,
      valueGetter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'warranty_end',
      headerName: t('warranty.warrantyEndDate'),
      minWidth: 170,
      valueGetter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'daysLeft',
      headerName: t('warranty.daysLeft'),
      minWidth: 150,
      renderCell: (params) => {
        const active = params.row.isActive;
        const days = params.value;
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
      field: 'status',
      headerName: t('common.status'),
      minWidth: 140,
      renderCell: (params) => (
        <Chip
          label={params.row.isActive ? (t('common.active') || 'Active') : (t('common.expired') || 'Expired')}
          color={params.row.isActive ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      minWidth: 180,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title={t('common.view')}>
            <IconButton
              size="small"
              onClick={() => navigate(`/staff/warranties/${params.row.id}`)}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.createCase')}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/staff/cases/new?warranty_id=${params.row.id}`)}
            >
              <BuildIcon />
            </IconButton>
          </Tooltip>
          {isAdmin && (
            <Tooltip title={t('warranty.deleteWarranty')}>
              <IconButton
                size="small"
                color="error"
                onClick={async () => {
                  if (window.confirm(t('warranty.deleteWarrantyConfirm'))) {
                    try {
                      await warrantiesService.delete(params.row.id);
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

      <SmartDataGrid
        rows={rows}
        columns={columns}
        tableKey="warranties-table"
        loading={isLoading}
      />
    </div>
  );
};

export default WarrantiesPage;
