import React, { useState, useMemo, useEffect } from 'react';
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
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Button,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { warrantiesService } from '../../services/warrantiesService';
import { useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import WarrantyFigmaTable from '../../components/common/WarrantyFigmaTable';
import WarrantyDeleteDialog from '../../components/common/WarrantyDeleteDialog';
import WarrantyHistoryDialog from '../../components/common/WarrantyHistoryDialog';
import { isManagementRole } from '../../utils/roles';

const WarrantiesPage = () => {
  const { t, i18n } = useTranslation();
  const ka = i18n.language?.startsWith('ka');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canManageWarranties = isManagementRole(user?.role);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    device_type: searchParams.get('device_type') || '',
    customer_phone: searchParams.get('customer_phone') || '',
    active_only: searchParams.get('active_only') || '',
    expired_only: searchParams.get('expired_only') || '',
  });
  const [tablePage, setTablePage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [tablePageSize, setTablePageSize] = useState(() => {
    if (typeof window === 'undefined') return 50;
    const stored = localStorage.getItem('warranties-table_pageSize');
    const parsed = parseInt(stored, 10);
    return [25, 50, 100, 250].includes(parsed) ? parsed : 25;
  });

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    count: 0,
    warranties: [],
    onConfirm: null,
  });
  const [historyWarrantyId, setHistoryWarrantyId] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const warrantyQueryParams = useMemo(
    () => ({
      device_type: filters.device_type,
      customer_phone: filters.customer_phone,
      active_only: filters.active_only,
      expired_only: filters.expired_only,
      search: debouncedSearch,
      page: tablePage,
      limit: tablePageSize,
    }),
    [filters.device_type, filters.customer_phone, filters.active_only, filters.expired_only, debouncedSearch, tablePage, tablePageSize],
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const { data: warranties, isLoading, error } = useQuery(
    ['warranties', warrantyQueryParams],
    () => warrantiesService.getAll(warrantyQueryParams),
    {
      keepPreviousData: true,
    }
  );

  const { data: deviceTypes = [] } = useQuery(
    'warranties-device-types',
    () => warrantiesService.getDeviceTypes(),
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  const handleFilterChange = (changes) => {
    const newFilters = { ...filters, ...changes };
    setFilters(newFilters);
    setTablePage(1);
    
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

  const totalWarranties = useMemo(() => {
    if (Array.isArray(warranties)) return warranties.length;
    if (typeof warranties?.total === 'number') return warranties.total;
    if (typeof warranties?.data?.total === 'number') return warranties.data.total;
    return rawData.length;
  }, [rawData.length, warranties]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalWarranties / tablePageSize));
    if (tablePage > totalPages) {
      setTablePage(1);
    }
  }, [tablePage, tablePageSize, totalWarranties]);

  const rows = useMemo(() => rawData.map((warranty) => ({
    ...warranty,
    id: warranty.id,
    isActive: isWarrantyActive(warranty.warranty_end),
    daysLeft: getDaysLeft(warranty.warranty_end),
  })), [rawData]);

  const csvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

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
      key: 'device_type',
      label: t('case.deviceType'),
      width: 150,
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
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDialog({
                    open: true,
                    count: 1,
                    warranties: [row],
                    onConfirm: async () => {
                      setIsDeleting(true);
                      try {
                        await warrantiesService.delete(row.id);
                        queryClient.invalidateQueries('warranties');
                        setDeleteDialog({ open: false, count: 0, onConfirm: null });
                        setNotification({
                          open: true,
                          message: t('warranty.warrantyDeleted'),
                          severity: 'success',
                        });
                      } catch (err) {
                        setNotification({
                          open: true,
                          message: err.response?.data?.message || t('common.errorLoading'),
                          severity: 'error',
                        });
                      } finally {
                        setIsDeleting(false);
                      }
                    },
                  });
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
    <div className="zzv-admin-page zzv-admin-page--warranties">
      <div className="zzv-warranties__card">
      <Box className="zzv-admin-page-head" display="flex" justifyContent="space-between" alignItems="center">
        <div><Typography variant="h4">{t('common.warranties')}</Typography><p>{t('warranty.listSubtitle', 'Warranty products, terms and customers')}</p></div>
        <Box className="zzv-warranties__head-actions" display="flex" gap={1}>
          {isAdmin && (
            <>
              <Button
                variant="outlined"
                startIcon={<img src="/figma-staff/file-upload.svg" alt="" width="16" height="16" />}
                onClick={() => navigate('/staff/warranties/import/csv')}
              >
                {t('common.importCSV') || 'Import CSV'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<img src="/figma-staff/case-import.svg" alt="" width="16" height="16" />}
                onClick={() => navigate('/staff/warranties/import/woocommerce')}
              >
                {t('common.importWooCommerce') || 'Import from WooCommerce'}
              </Button>
            </>
          )}
          {canManageWarranties && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/staff/warranties/new')}
            >
              {t('common.createWarranty')}
            </Button>
          )}
        </Box>
      </Box>

      <Paper className="zzv-admin-filter-card" elevation={0}>
        <Box className="zzv-warranties__filters" display="flex" gap={2} flexWrap="wrap">
          <TextField
            size="small"
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            placeholder={t('warranty.searchPlaceholder', 'Search by number, SKU, serial, customer or phone')}
            inputProps={{ 'aria-label': t('common.search') }}
            InputProps={{ startAdornment: <InputAdornment position="start"><img src="/figma-staff/case-search.svg" alt="" width="20" height="20" /></InputAdornment> }}
            sx={{ width: '100%' }}
          />
          <div className="zzv-warranties__selects">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={filters.device_type}
              displayEmpty
              inputProps={{ 'aria-label': t('case.deviceType') }}
              renderValue={(value) => value || (ka ? 'მოწყობილობა: ყველა' : 'Device: all')}
              onChange={(e) => handleFilterChange({ device_type: e.target.value })}
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              {deviceTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type || '(Unknown)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={filters.active_only ? 'active' : filters.expired_only ? 'expired' : ''}
              displayEmpty
              inputProps={{ 'aria-label': t('common.status') }}
              renderValue={(value) => value === 'active' ? t('common.active') : value === 'expired' ? t('common.expired') : (ka ? 'სტატუსი: ყველა' : 'Status: all')}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange({
                  active_only: value === 'active' ? 'true' : '',
                  expired_only: value === 'expired' ? 'true' : '',
                });
              }}
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              <MenuItem value="active">{t('common.active') || 'Active'}</MenuItem>
              <MenuItem value="expired">{t('common.expired') || 'Expired'}</MenuItem>
            </Select>
          </FormControl>
          </div>
        </Box>
      </Paper>

      {error && <Alert severity="error">{t('common.errorLoading')}</Alert>}
      <Box className="zzv-admin-table-card" aria-busy={isLoading}>
      <WarrantyFigmaTable
        columns={columns}
        data={rows}
        pageSizeOptions={[25, 50, 100, 250]}
        isLoading={isLoading}
        serverPagination={{
          page: tablePage,
          pageSize: tablePageSize,
          total: totalWarranties,
          onPageChange: setTablePage,
          onPageSizeChange: (nextPageSize) => {
            setTablePageSize(nextPageSize);
            setTablePage(1);
          },
        }}
        onRowClick={(row) => navigate(`/staff/warranties/${row.id}`)}
        onOpenHistory={(row) => setHistoryWarrantyId(row.id)}
        onBulkDelete={isAdmin ? (selectedIds) => {
          setDeleteDialog({
            open: true,
            count: selectedIds.length,
            warranties: rows.filter((row) => selectedIds.includes(row.id)),
            onConfirm: async () => {
              setIsDeleting(true);
              try {
                const result = await warrantiesService.bulkDelete(selectedIds);
                queryClient.invalidateQueries('warranties');
                setDeleteDialog({ open: false, count: 0, onConfirm: null });
                if (result.failed > 0) {
                  setNotification({
                    open: true,
                    message: t('warranty.bulkDeletePartial', {
                      deleted: result.deleted,
                      failed: result.failed,
                    }) || `Deleted ${result.deleted}, failed ${result.failed}`,
                    severity: 'warning',
                  });
                } else {
                  setNotification({
                    open: true,
                    message: t('warranty.bulkDeleteSuccess', { count: result.deleted }) || `Successfully deleted ${result.deleted} warranties`,
                    severity: 'success',
                  });
                }
              } catch (err) {
                setNotification({
                  open: true,
                  message: err.response?.data?.message || t('common.errorLoading') || 'Error deleting warranties',
                  severity: 'error',
                });
              } finally {
                setIsDeleting(false);
              }
            },
          });
        } : undefined}
        onBulkExport={(selectedIds) => {
          const selectedWarranties = rows.filter((w) => selectedIds.includes(w.id));
          const csv = [
            ['Warranty ID', 'Product', 'SKU', 'Serial', 'Customer', 'Phone', 'Purchase Date', 'Warranty End', 'Status'].map(csvValue).join(','),
            ...selectedWarranties.map((w) =>
              [
                w.warranty_id,
                w.title,
                w.sku,
                w.serial_number,
                `${w.customer_name || ''} ${w.customer_last_name || ''}`.trim(),
                w.customer_phone,
                new Date(w.purchase_date).toLocaleDateString(),
                new Date(w.warranty_end).toLocaleDateString(),
                w.isActive ? 'Active' : 'Expired',
              ].map(csvValue).join(',')
            ),
          ].join('\r\n');
          const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `warranties-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        }}
      />
      </Box>
      </div>
      
      <WarrantyDeleteDialog
        open={deleteDialog.open}
        onClose={() => {
          if (!isDeleting) {
            setDeleteDialog({ open: false, count: 0, onConfirm: null });
          }
        }}
        onConfirm={deleteDialog.onConfirm || (() => {})}
        warranties={deleteDialog.warranties}
        loading={isDeleting}
      />
      <WarrantyHistoryDialog
        warrantyId={historyWarrantyId}
        onClose={() => setHistoryWarrantyId(null)}
        onOpenWarranty={(warrantyId) => { setHistoryWarrantyId(null); navigate(`/staff/warranties/${warrantyId}`); }}
        onOpenCase={(caseId) => { setHistoryWarrantyId(null); navigate(`/staff/cases/${caseId}`); }}
      />
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ open: false, message: '', severity: 'success' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification({ open: false, message: '', severity: 'success' })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default WarrantiesPage;
