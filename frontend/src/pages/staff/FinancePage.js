import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { paymentsService } from '../../services/paymentsService';
import { format } from 'date-fns';

const FinancePage = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    device_type: '',
    payment_status: '',
    payment_method: '',
  });

  const { data: payments, isLoading, error } = useQuery(
    ['payments', filters],
    () => paymentsService.getAll(filters)
  );

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleExport = () => {
    // TODO: Implement CSV/Excel export
    alert('Export functionality coming soon');
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      paid: 'success',
      failed: 'error',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{t('common.errorLoading')}</Alert>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('common.finance')}</Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          {t('common.export')}
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            size="small"
            label={t('common.startDate') || 'Start Date'}
            type="date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            size="small"
            label={t('common.endDate') || 'End Date'}
            type="date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
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
            <InputLabel>{t('payment.status') || 'Payment Status'}</InputLabel>
            <Select
              value={filters.payment_status}
              label={t('payment.status') || 'Payment Status'}
              onChange={(e) => handleFilterChange('payment_status', e.target.value)}
            >
              <MenuItem value="">{t('common.all') || 'All'}</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('payment.method') || 'Payment Method'}</InputLabel>
            <Select
              value={filters.payment_method}
              label={t('payment.method') || 'Payment Method'}
              onChange={(e) => handleFilterChange('payment_method', e.target.value)}
            >
              <MenuItem value="">{t('common.all') || 'All'}</MenuItem>
              <MenuItem value="onsite">Onsite</MenuItem>
              <MenuItem value="online">Online</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Payments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('common.date') || 'Date'}</TableCell>
              <TableCell>{t('case.caseNumber')}</TableCell>
              <TableCell>{t('case.customerName')}</TableCell>
              <TableCell>{t('payment.type') || 'Type'}</TableCell>
              <TableCell>{t('common.amount') || 'Amount'}</TableCell>
              <TableCell>{t('payment.method') || 'Payment Method'}</TableCell>
              <TableCell>{t('payment.status') || 'Payment Status'}</TableCell>
              <TableCell>{t('case.deviceType')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments && payments.length > 0 ? (
              payments.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell>
                    {format(new Date(payment.created_at), 'yyyy-MM-dd')}
                  </TableCell>
                  <TableCell>{payment.case_?.case_number || '-'}</TableCell>
                  <TableCell>
                    {payment.case_?.customer_name} {payment.case_?.customer_last_name}
                  </TableCell>
                  <TableCell>{payment.offer_type}</TableCell>
                  <TableCell>{payment.offer_amount || 0} ₾</TableCell>
                  <TableCell>{payment.payment_method || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={payment.payment_status}
                      color={getPaymentStatusColor(payment.payment_status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{payment.case_?.device_type || '-'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  {t('common.noPayments') || 'No payments found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FinancePage;

