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
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { casesService } from '../../services/casesService';
import StatusBar from '../../components/cases/StatusBar';
import ResultBar from '../../components/cases/ResultBar';
import CustomDataTable from '../../components/common/CustomDataTable';

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
  
  const [filters, setFilters] = useState({
    status: statusParam || (closeToDeadline || due ? '' : ''),
    result: searchParams.get('result') || '',
    priority: searchParams.get('priority') || '',
    device_type: searchParams.get('device_type') || '',
    technician_id: searchParams.get('technician_id') || '',
    search: searchParams.get('search') || '',
    closeToDeadline: closeToDeadline === 'true',
    due: due === 'true',
  });

  const { data: cases, isLoading } = useQuery(
    ['cases', filters],
    () => casesService.getAll(filters),
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
    [t, navigate, location.search]
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
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            size="small"
            label={t('common.search') || 'Search'}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            sx={{ minWidth: 200 }}
          />
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
