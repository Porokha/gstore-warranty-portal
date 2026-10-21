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
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const { data: paymentPage, isLoading, error } = useQuery(
    ['payments', filters, page],
    () => paymentsService.getAll({ ...filters, page, limit: 50 })
  );
  const payments = paymentPage?.data || [];
  const total = paymentPage?.total || 0;
  const pageCount = Math.max(1, Math.ceil(total / 50));

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const csvEscape = (value) => {
    const stringValue = value == null ? '' : String(value);
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const collectNotes = (payment, type) => {
    const history = payment.case_?.status_history || [];
    return history
      .map((entry) => entry?.[type])
      .filter(Boolean)
      .join(' | ');
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    try {
      const rows = [];
      let exportPage = 1;
      let exportTotal = 0;
      do {
        const batch = await paymentsService.getAll({ ...filters, page: exportPage, limit: 200, include_history: true });
        if (!batch.data.length && batch.total > rows.length) throw new Error('Export changed while loading');
        rows.push(...batch.data);
        exportTotal = batch.total;
        exportPage += 1;
      } while (rows.length < exportTotal);
    const headers = [
      'Payment Date',
      'Case Number',
      'Customer Name',
      'Customer Phone',
      'Technician',
      'Payment Type',
      'Amount',
      'Payment Method',
      'Payment Status',
      'Device Type',
      'Product Title',
      'Serial Number',
      'IMEI',
      'Customer Initial Note',
      'Public Notes',
      'Internal Notes',
    ];
    const csvRows = rows.map((payment) => {
      const caseData = payment.case_ || {};
      return [
        payment.created_at ? format(new Date(payment.created_at), 'yyyy-MM-dd HH:mm') : '',
        caseData.case_number || '',
        `${caseData.customer_name || ''} ${caseData.customer_last_name || ''}`.trim(),
        caseData.customer_phone || '',
        `${caseData.assigned_technician?.name || ''} ${caseData.assigned_technician?.last_name || ''}`.trim(),
        payment.offer_type || '',
        payment.offer_amount || 0,
        payment.payment_method || '',
        payment.payment_status || '',
        caseData.device_type || '',
        caseData.product_title || '',
        caseData.serial_number || '',
        caseData.imei || '',
        caseData.customer_initial_note || '',
        collectNotes(payment, 'note_public'),
        collectNotes(payment, 'note_private'),
      ].map(csvEscape).join(',');
    });

    const csv = ['\uFEFF' + headers.map(csvEscape).join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const exportedAt = format(new Date(), 'yyyy-MM-dd-HHmm');
    link.href = url;
    link.download = `zezva-finance-${exportedAt}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    } catch (exportFailure) {
      setExportError(exportFailure.response?.data?.message || t('common.errorLoading'));
    } finally {
      setExporting(false);
    }
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
    <Box className="zzv-staff-workspace zzv-staff-workspace--finance">
      <Box className="zzv-staff-workspace__heading">
        <Box>
          <Typography variant="h4">{t('common.finance')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('staffWorkspace.financeDescription')}</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={!total || exporting}
        >
          {exporting ? t('common.loading') : t('common.export')}
        </Button>
      </Box>
      {exportError && <Alert severity="error">{exportError}</Alert>}

      {/* Filters */}
      <Paper className="zzv-staff-workspace__filters">
        <Box className="zzv-staff-workspace__filter-grid">
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
      <TableContainer component={Paper} className="zzv-staff-workspace__table-wrap">
        <Table className="zzv-staff-workspace__table">
          <TableHead>
            <TableRow>
              <TableCell>{t('common.date') || 'Date'}</TableCell>
              <TableCell>{t('case.caseNumber')}</TableCell>
              <TableCell>{t('case.customerName')}</TableCell>
              <TableCell>{t('case.customerPhone')}</TableCell>
              <TableCell>{t('staffWorkspace.paymentType')}</TableCell>
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
                  <TableCell>{payment.case_?.customer_phone || '-'}</TableCell>
                  <TableCell>{payment.offer_type || '-'}</TableCell>
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
                <TableCell colSpan={9} align="center">
                  {t('common.noPayments') || 'No payments found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2} mt={2}>
        <Typography variant="body2">{total} {t('common.total')}</Typography>
        <Button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>{t('common.previous')}</Button>
        <Typography variant="body2">{page} / {pageCount}</Typography>
        <Button disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>{t('common.next')}</Button>
      </Box>
    </Box>
  );
};

export default FinancePage;
