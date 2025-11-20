import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { casesService } from '../../services/casesService';
import StatusBar from '../../components/cases/StatusBar';
import ResultBar from '../../components/cases/ResultBar';

const CasesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    result: searchParams.get('result') || '',
    priority: searchParams.get('priority') || '',
    device_type: searchParams.get('device_type') || '',
    technician_id: searchParams.get('technician_id') || '',
    search: searchParams.get('search') || '',
  });

  const { data: cases, isLoading, refetch } = useQuery(
    ['cases', filters],
    () => casesService.getAll(filters),
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

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'default',
      normal: 'primary',
      high: 'warning',
      critical: 'error',
    };
    return colors[priority] || 'default';
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/staff/cases/new')}
        >
          {t('common.createCase')}
        </Button>
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

      {/* Cases Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('case.caseNumber')}</TableCell>
              <TableCell>{t('case.orderId')}</TableCell>
              <TableCell>{t('case.productTitle')}</TableCell>
              <TableCell>{t('case.productId')}</TableCell>
              <TableCell>{t('case.openDate')}</TableCell>
              <TableCell>{t('case.deadline')}</TableCell>
              <TableCell>{t('case.customerName')}</TableCell>
              <TableCell>{t('case.phone')}</TableCell>
              <TableCell>{t('case.email')}</TableCell>
              <TableCell>{t('common.status')}</TableCell>
              <TableCell>{t('common.result')}</TableCell>
              <TableCell>{t('common.priority') || 'Priority'}</TableCell>
              <TableCell>{t('common.tags')}</TableCell>
              <TableCell>{t('case.technician')}</TableCell>
              <TableCell>{t('common.actions') || 'Actions'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cases && cases.length > 0 ? (
              cases.map((case_) => (
                <TableRow key={case_.id} hover>
                  <TableCell>{case_.case_number}</TableCell>
                  <TableCell>{case_.order_id || '-'}</TableCell>
                  <TableCell>{case_.product_title}</TableCell>
                  <TableCell>{case_.product_id || '-'}</TableCell>
                  <TableCell>
                    {new Date(case_.opened_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(case_.deadline_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {case_.customer_name} {case_.customer_last_name}
                  </TableCell>
                  <TableCell>{case_.customer_phone}</TableCell>
                  <TableCell>{case_.customer_email || '-'}</TableCell>
                  <TableCell>
                    <StatusBar statusLevel={case_.status_level} size="small" />
                  </TableCell>
                  <TableCell>
                    <ResultBar resultType={case_.result_type} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={case_.priority}
                      color={getPriorityColor(case_.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {case_.tags && case_.tags.length > 0 ? (
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {case_.tags.slice(0, 2).map((tag, idx) => (
                          <Chip key={idx} label={tag} size="small" variant="outlined" />
                        ))}
                        {case_.tags.length > 2 && (
                          <Chip label={`+${case_.tags.length - 2}`} size="small" />
                        )}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {case_.assigned_technician
                      ? `${case_.assigned_technician.name} ${case_.assigned_technician.last_name}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={t('common.view')}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/staff/cases/${case_.id}`)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={15} align="center">
                  {t('common.noCases') || 'No cases found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default CasesPage;
