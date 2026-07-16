import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from 'react-query';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
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
  Popover,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Add as AddIcon,
  FilterAlt as FilterIcon,
} from '@mui/icons-material';
import { casesService } from '../../services/casesService';
import StatusBar from '../../components/cases/StatusBar';
import ResultBar from '../../components/cases/ResultBar';
import CustomDataTable from '../../components/common/CustomDataTable';

const formatDateTimeForApi = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const getTimeRangeDates = (range) => {
  if (range === 'all') return {};

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (range === 'yesterday') {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
  }

  if (range === 'last30') {
    start.setDate(start.getDate() - 29);
  }

  return {
    start_date: formatDateTimeForApi(start),
    end_date: formatDateTimeForApi(end),
  };
};

const CasesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Handle dashboard filter params
  const closeToDeadline = searchParams.get('closeToDeadline');
  const due = searchParams.get('due');
  const statusParam = searchParams.get('status');
  const defaultTimeRange = closeToDeadline || due ? 'all' : 'today';
  
  const [filters, setFilters] = useState({
    case_scope: searchParams.get('case_scope') || 'all',
    status: statusParam || (closeToDeadline || due ? '' : ''),
    result: searchParams.get('result') || '',
    priority: searchParams.get('priority') || '',
    device_type: searchParams.get('device_type') || '',
    technician_id: searchParams.get('technician_id') || '',
    search: searchParams.get('search') || '',
    customer: searchParams.get('customer') || '',
    time_range: searchParams.get('time_range') || defaultTimeRange,
    closeToDeadline: closeToDeadline === 'true',
    due: due === 'true',
  });
  const [customerFilterAnchor, setCustomerFilterAnchor] = useState(null);
  const [customerFilterDraft, setCustomerFilterDraft] = useState(searchParams.get('customer') || '');

  const queryFilters = useMemo(() => {
    const { case_scope: caseScope, time_range: timeRange, ...baseFilters } = filters;
    const scopedFilters = {
      ...baseFilters,
      ...(caseScope === 'standard' ? { case_type: 'standard' } : {}),
      ...(caseScope === 'partner' ? { case_type: 'partner' } : {}),
    };
    const shouldSearchAllTime = Boolean(scopedFilters.search?.trim());
    if (shouldSearchAllTime) {
      return scopedFilters;
    }
    return {
      ...scopedFilters,
      ...getTimeRangeDates(timeRange),
    };
  }, [filters]);

  const { data: cases, isLoading } = useQuery(
    ['cases', queryFilters],
    () => casesService.getAll(queryFilters),
    {
      keepPreviousData: true,
    }
  );

  const rawCases = useMemo(() => {
    if (!cases) return [];
    if (Array.isArray(cases)) return cases;
    if (Array.isArray(cases?.data)) return cases.data;
    if (Array.isArray(cases?.data?.data)) return cases.data.data;
    return [];
  }, [cases]);

  const rows = useMemo(
    () =>
      rawCases.map((case_) => ({
        ...case_,
        id: case_.id,
        customerFullName: `${case_.customer_name || ''} ${case_.customer_last_name || ''}`.trim(),
      })),
    [rawCases]
  );

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'default',
      normal: 'primary',
      high: 'warning',
      critical: 'error',
    };
    return colors[priority] || 'default';
  };

  const applyCustomerFilter = () => {
    handleFilterChange('customer', customerFilterDraft.trim());
    setCustomerFilterAnchor(null);
  };

  const clearCustomerFilter = () => {
    setCustomerFilterDraft('');
    handleFilterChange('customer', '');
    setCustomerFilterAnchor(null);
  };

  const columns = useMemo(
    () => [
      {
        key: 'select',
        label: '',
        width: 50,
      },
      {
        key: 'case_number',
        label: t('case.caseNumber'),
        width: 180,
      },
      {
        key: 'order_id',
        label: t('case.orderId'),
        width: 140,
        value: (row) => row.order_id || '-',
      },
      {
        key: 'product_title',
        label: t('case.productTitle'),
        width: 220,
      },
      {
        key: 'product_id',
        label: t('case.productId'),
        width: 140,
        value: (row) => row.product_id || '-',
      },
      {
        key: 'opened_at',
        label: t('case.openDate'),
        width: 150,
        value: (row) => new Date(row.opened_at).toLocaleDateString(),
      },
      {
        key: 'deadline_at',
        label: t('case.deadline'),
        width: 160,
        value: (row) => new Date(row.deadline_at).toLocaleDateString(),
      },
      {
        key: 'customerFullName',
        label: t('case.customerName'),
        width: 200,
        headerRender: () => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1 }}>
            <Tooltip title={t('case.customerName')} arrow>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {t('case.customerName')}
              </Typography>
            </Tooltip>
            <Tooltip title={filters.customer ? `Customer: ${filters.customer}` : 'Filter customer'}>
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  setCustomerFilterDraft(filters.customer || '');
                  setCustomerFilterAnchor(event.currentTarget);
                }}
                sx={{
                  p: 0.4,
                  color: filters.customer ? '#7c3aed' : '#9ca3af',
                  bgcolor: filters.customer ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                  flexShrink: 0,
                  '&:hover': {
                    bgcolor: 'rgba(124, 58, 237, 0.14)',
                  },
                }}
              >
                <FilterIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
      {
        key: 'customer_phone',
        label: t('case.phone'),
        width: 150,
      },
      {
        key: 'customer_email',
        label: t('case.email'),
        width: 200,
        value: (row) => row.customer_email || '-',
      },
      {
        key: 'status_level',
        label: t('common.status'),
        width: 160,
        render: (row) => <StatusBar statusLevel={row.status_level} size="small" />,
      },
      {
        key: 'result_type',
        label: t('common.result'),
        width: 160,
        render: (row) => <ResultBar resultType={row.result_type} size="small" />,
      },
      {
        key: 'priority',
        label: t('common.priority') || 'Priority',
        width: 140,
        render: (row) => (
          <Chip
            label={row.priority}
            color={getPriorityColor(row.priority)}
            size="small"
            sx={{ textTransform: 'capitalize' }}
          />
        ),
      },
      {
        key: 'tags',
        label: t('common.tags'),
        width: 200,
        render: (row) =>
          row.tags && row.tags.length > 0 ? (
            <Box display="flex" gap={0.5} flexWrap="wrap">
              {row.tags.map((tag, idx) => (
                <Chip key={`${row.id}-tag-${idx}`} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          ) : (
            '-'
          ),
      },
      {
        key: 'technician',
        label: t('case.technician'),
        width: 200,
        value: (row) =>
          row.assigned_technician
            ? `${row.assigned_technician.name || ''} ${row.assigned_technician.last_name || ''}`.trim()
            : '-',
      },
      {
        key: 'actions',
        label: t('common.actions') || 'Actions',
        width: 120,
        render: (row) => (
          <Tooltip title={t('common.view')}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/staff/cases/${row.id}${location.search}`);
              }}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [t, navigate, location.search, filters.customer]
  );

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    Object.keys(newFilters).forEach((k) => {
      if (newFilters[k] && !['start_date', 'end_date'].includes(k)) params.set(k, newFilters[k]);
    });
    setSearchParams(params);
  };

  const timeRangeOptions = [
    { value: 'today', label: t('case.timeToday') },
    { value: 'yesterday', label: t('case.timeYesterday') },
    { value: 'last30', label: t('case.timeLast30') },
    { value: 'all', label: t('case.timeAll') },
  ];

  const caseScopeOptions = [
    { value: 'all', label: t('case.allCases') },
    { value: 'standard', label: t('case.standardCases') },
    { value: 'partner', label: t('case.partnerCases') },
  ];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('common.openCases')}</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            onClick={() => navigate('/staff/cases/import/csv')}
          >
            {t('common.importCSV') || 'Import CSV'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/staff/cases/new')}
          >
            {t('common.createCase')}
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs
          value={filters.case_scope}
          onChange={(_, value) => handleFilterChange('case_scope', value)}
          sx={{
            mb: 2,
            minHeight: 38,
            '& .MuiTabs-indicator': { height: 3, borderRadius: 999 },
            '& .MuiTab-root': {
              minHeight: 38,
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: '10px 10px 0 0',
            },
          }}
        >
          {caseScopeOptions.map((option) => (
            <Tab key={option.value} value={option.value} label={option.label} />
          ))}
        </Tabs>
        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
          {timeRangeOptions.map((option) => (
            <Button
              key={option.value}
              size="small"
              variant={filters.time_range === option.value ? 'contained' : 'outlined'}
              onClick={() => handleFilterChange('time_range', option.value)}
              sx={{ borderRadius: '10px' }}
            >
              {option.label}
            </Button>
          ))}
          {filters.search?.trim() && (
            <Chip
              size="small"
              color="info"
              label={t('case.searchIgnoresTime')}
              sx={{ ml: 0.5, height: 32, borderRadius: '10px' }}
            />
          )}
        </Box>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            size="small"
            label={t('common.search') || 'Search'}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>{t('case.deviceType')}</InputLabel>
            <Select
              value={filters.device_type}
              label={t('case.deviceType')}
              onChange={(e) => handleFilterChange('device_type', e.target.value)}
            >
              <MenuItem value="">{t('common.all') || 'All'}</MenuItem>
              <MenuItem value="Phone">Phone</MenuItem>
              <MenuItem value="Tablet">Tablet</MenuItem>
              <MenuItem value="Laptop">Laptop</MenuItem>
              <MenuItem value="Desktop">Desktop</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('common.status')}</InputLabel>
            <Select
              value={filters.status}
              label={t('common.status')}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="">{t('common.all') || 'All'}</MenuItem>
              <MenuItem value="1">{t('status.opened')}</MenuItem>
              <MenuItem value="2">{t('status.investigating')}</MenuItem>
              <MenuItem value="3">{t('status.pending')}</MenuItem>
              <MenuItem value="4">{t('status.completed')}</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('common.result')}</InputLabel>
            <Select
              value={filters.result}
              label={t('common.result')}
              onChange={(e) => handleFilterChange('result', e.target.value)}
            >
              <MenuItem value="">{t('common.all') || 'All'}</MenuItem>
              <MenuItem value="covered">{t('result.covered')}</MenuItem>
              <MenuItem value="payable">{t('result.payable')}</MenuItem>
              <MenuItem value="returned">{t('result.returned')}</MenuItem>
              <MenuItem value="replaceable">{t('result.replaceable')}</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('common.priority') || 'Priority'}</InputLabel>
            <Select
              value={filters.priority}
              label={t('common.priority') || 'Priority'}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <MenuItem value="">{t('common.all') || 'All'}</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Popover
        open={Boolean(customerFilterAnchor)}
        anchorEl={customerFilterAnchor}
        onClose={() => setCustomerFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            width: 320,
            p: 2,
            borderRadius: '14px !important',
            border: '1px solid #e5e7eb',
            boxShadow: '0 18px 45px rgba(17, 24, 39, 0.14)',
          },
        }}
      >
        <Typography sx={{ fontWeight: 900, fontSize: 14, color: '#172033' }}>
          Filter by customer
        </Typography>
        <Typography sx={{ mt: 0.5, mb: 1.5, color: '#667085', fontSize: 12 }}>
          Matches first name, last name, or full name.
        </Typography>
        <TextField
          size="small"
          autoFocus
          fullWidth
          label={t('case.customerName')}
          value={customerFilterDraft}
          onChange={(event) => setCustomerFilterDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              applyCustomerFilter();
            }
          }}
        />
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button size="small" onClick={clearCustomerFilter}>
            Clear
          </Button>
          <Button size="small" variant="contained" onClick={applyCustomerFilter}>
            Apply
          </Button>
        </Box>
      </Popover>

      <CustomDataTable
        columns={columns}
        data={rows}
        tableKey="cases-table"
        frozenColumns={['select', 'case_number']}
        defaultColumnWidth={150}
        onRowClick={(row) => navigate(`/staff/cases/${row.id}${location.search}`)}
        onBulkDelete={async (selectedIds) => {
          try {
            for (const id of selectedIds) {
              await casesService.delete(id);
            }
            queryClient.invalidateQueries('cases');
            alert(t('common.deleted') || 'Cases deleted successfully');
          } catch (err) {
            alert(err.response?.data?.message || t('common.errorLoading') || 'Error deleting cases');
          }
        }}
        onBulkExport={(selectedIds) => {
          const selectedCases = rows.filter((c) => selectedIds.includes(c.id));
          const csv = [
            ['Case Number', 'Product', 'Customer', 'Phone', 'Status', 'Priority', 'Deadline'].join(','),
            ...selectedCases.map((c) =>
              [
                c.case_number,
                c.product_title,
                c.customerFullName,
                c.customer_phone,
                c.status_level,
                c.priority,
                new Date(c.deadline_at).toLocaleDateString(),
              ].join(',')
            ),
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `cases-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
        }}
      />
    </div>
  );
};

export default CasesPage;
