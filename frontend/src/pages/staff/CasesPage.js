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
  Tooltip,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { casesService } from '../../services/casesService';
import StatusBar from '../../components/cases/StatusBar';
import ResultBar from '../../components/cases/ResultBar';
import SmartDataGrid from '../../components/common/SmartDataGrid';

const CasesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const rawCases = React.useMemo(() => {
    if (!cases) return [];
    if (Array.isArray(cases)) return cases;
    if (Array.isArray(cases?.data)) return cases.data;
    if (Array.isArray(cases?.data?.data)) return cases.data.data;
    return [];
  }, [cases]);

  const rows = React.useMemo(
    () =>
      rawCases.map((case_) => ({
        ...case_,
        id: case_.id,
        customerFullName: `${case_.customer_name || ''} ${case_.customer_last_name || ''}`.trim(),
      })),
    [rawCases]
  );

  const columns = React.useMemo(
    () => [
      {
        field: 'case_number',
        headerName: t('case.caseNumber'),
        minWidth: 180,
      },
      {
        field: 'order_id',
        headerName: t('case.orderId'),
        minWidth: 140,
        valueGetter: (params) => params.value || '-',
      },
      {
        field: 'product_title',
        headerName: t('case.productTitle'),
        flex: 1.2,
        minWidth: 220,
      },
      {
        field: 'product_id',
        headerName: t('case.productId'),
        minWidth: 140,
        valueGetter: (params) => params.value || '-',
      },
      {
        field: 'opened_at',
        headerName: t('case.openDate'),
        minWidth: 150,
        valueGetter: (params) => new Date(params.value).toLocaleDateString(),
      },
      {
        field: 'deadline_at',
        headerName: t('case.deadline'),
        minWidth: 160,
        valueGetter: (params) => new Date(params.value).toLocaleDateString(),
      },
      {
        field: 'customerFullName',
        headerName: t('case.customerName'),
        minWidth: 200,
      },
      {
        field: 'customer_phone',
        headerName: t('case.phone'),
        minWidth: 150,
      },
      {
        field: 'customer_email',
        headerName: t('case.email'),
        minWidth: 200,
        valueGetter: (params) => params.value || '-',
      },
      {
        field: 'status_level',
        headerName: t('common.status'),
        minWidth: 160,
        renderCell: (params) => (
          <StatusBar statusLevel={params.value} size="small" />
        ),
      },
      {
        field: 'result_type',
        headerName: t('common.result'),
        minWidth: 160,
        renderCell: (params) => (
          <ResultBar resultType={params.value} size="small" />
        ),
      },
      {
        field: 'priority',
        headerName: t('common.priority') || 'Priority',
        minWidth: 140,
        renderCell: (params) => (
          <Chip
            label={params.value}
            color={getPriorityColor(params.value)}
            size="small"
            sx={{ textTransform: 'capitalize' }}
          />
        ),
      },
      {
        field: 'tags',
        headerName: t('common.tags'),
        minWidth: 200,
        renderCell: (params) =>
          params.value && params.value.length > 0 ? (
            <Box display="flex" gap={0.5} flexWrap="wrap">
              {params.value.map((tag, idx) => (
                <Chip key={`${params.row.id}-tag-${idx}`} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          ) : (
            '-'
          ),
      },
      {
        field: 'technician',
        headerName: t('case.technician'),
        minWidth: 200,
        valueGetter: (params) =>
          params.row.assigned_technician
            ? `${params.row.assigned_technician.name || ''} ${params.row.assigned_technician.last_name || ''}`.trim()
            : '-',
      },
      {
        field: 'actions',
        headerName: t('common.actions') || 'Actions',
        sortable: false,
        filterable: false,
        minWidth: 120,
        renderCell: (params) => (
          <Tooltip title={t('common.view')}>
            <IconButton size="small" onClick={() => navigate(`/staff/cases/${params.row.id}`)}>
              <ViewIcon />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [t, navigate]
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

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'default',
      normal: 'primary',
      high: 'warning',
      critical: 'error',
    };
    return colors[priority] || 'default';
  };

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

      <SmartDataGrid
        rows={rows}
        columns={columns}
        tableKey="cases-table"
        loading={isLoading}
        rowHeight={64}
      />
    </div>
  );
};

export default CasesPage;
