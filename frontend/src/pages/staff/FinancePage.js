import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import {
  Alert, Box, Button, Chip, CircularProgress, FormControl, InputLabel,
  MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { paymentsService } from '../../services/paymentsService';
import { formatFinanceDate, isFinanceRangeValid } from '../../utils/financeReport';

const emptyFilters = {
  date_basis: 'created',
  start_date: '',
  end_date: '',
  device_type: '',
  payment_status: '',
  payment_method: '',
};
const pageSize = 50;
const gel = new Intl.NumberFormat('ka-GE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const statusColors = { pending: 'warning', paid: 'success', failed: 'error', cancelled: 'default' };

const FinancePage = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const validRange = isFinanceRangeValid(filters);

  const { data: paymentPage, isLoading, isFetching, error } = useQuery(
    ['finance-payments', filters, page],
    () => paymentsService.getAll({ ...filters, page, limit: pageSize }),
    { enabled: validRange, keepPreviousData: true },
  );
  const { data: summary } = useQuery(
    ['finance-summary', filters],
    () => paymentsService.getFinanceSummary(filters),
    { enabled: validRange, keepPreviousData: true },
  );
  const payments = paymentPage?.data || [];
  const total = paymentPage?.total || 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstRow = total ? (page - 1) * pageSize + 1 : 0;
  const lastRow = Math.min(page * pageSize, total);

  const changeFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
    setExportError('');
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    try {
      const blob = await paymentsService.exportFinance(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zezva-finance-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) {
      setExportError(t('financeReport.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box className="zzv-staff-workspace zzv-staff-workspace--finance">
      <Box className="zzv-staff-workspace__heading">
        <Box>
          <Typography variant="h4">{t('common.finance')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('financeReport.description')}</Typography>
        </Box>
        <Button variant="outlined" startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
          onClick={handleExport} disabled={!validRange || !total || exporting || isFetching}>
          {exporting ? t('financeReport.exporting') : t('financeReport.exportAll', { count: total })}
        </Button>
      </Box>

      <Paper className="zzv-staff-workspace__filters zzv-finance-filters">
        <div className="zzv-finance-filters__heading">
          <strong>{t('financeReport.filters')}</strong>
          <Button size="small" onClick={() => { setFilters(emptyFilters); setPage(1); setExportError(''); }}>
            {t('financeReport.clearFilters')}
          </Button>
        </div>
        <Box className="zzv-staff-workspace__filter-grid">
          <FormControl size="small">
            <InputLabel>{t('financeReport.dateBasis')}</InputLabel>
            <Select value={filters.date_basis} label={t('financeReport.dateBasis')}
              onChange={(event) => changeFilter('date_basis', event.target.value)}>
              <MenuItem value="created">{t('financeReport.offerCreated')}</MenuItem>
              <MenuItem value="paid">{t('financeReport.paidAt')}</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" label={t('common.startDate')} type="date" value={filters.start_date}
            onChange={(event) => changeFilter('start_date', event.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label={t('common.endDate')} type="date" value={filters.end_date}
            onChange={(event) => changeFilter('end_date', event.target.value)} InputLabelProps={{ shrink: true }} />
          <FormControl size="small">
            <InputLabel>{t('case.deviceType')}</InputLabel>
            <Select value={filters.device_type} label={t('case.deviceType')}
              onChange={(event) => changeFilter('device_type', event.target.value)}>
              <MenuItem value="">{t('common.all')}</MenuItem>
              {['Phone', 'Tablet', 'Laptop', 'Desktop', 'Other'].map((type) =>
                <MenuItem key={type} value={type}>{t(`financeReport.deviceTypes.${type}`)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>{t('payment.status')}</InputLabel>
            <Select value={filters.payment_status} label={t('payment.status')}
              onChange={(event) => changeFilter('payment_status', event.target.value)}>
              <MenuItem value="">{t('common.all')}</MenuItem>
              {['pending', 'paid', 'failed', 'cancelled'].map((status) =>
                <MenuItem key={status} value={status}>{t(`payment.${status}`)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>{t('payment.method')}</InputLabel>
            <Select value={filters.payment_method} label={t('payment.method')}
              onChange={(event) => changeFilter('payment_method', event.target.value)}>
              <MenuItem value="">{t('common.all')}</MenuItem>
              <MenuItem value="onsite">{t('payment.onsite')}</MenuItem>
              <MenuItem value="online">{t('payment.online')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {!validRange && <Alert severity="error" sx={{ mt: 1.5 }}>{t('financeReport.invalidRange')}</Alert>}
        {filters.date_basis === 'paid' && <p className="zzv-finance-filters__hint">{t('financeReport.historicalPaidAtHint')}</p>}
      </Paper>

      {exportError && <Alert severity="error">{exportError}</Alert>}

      <div className="zzv-finance-summary">
        <Paper className="zzv-finance-summary__card"><span>{t('financeReport.matchingRecords')}</span><strong>{summary?.count ?? total}</strong></Paper>
        <Paper className="zzv-finance-summary__card"><span>{t('financeReport.paidTotal')}</span><strong>{gel.format(summary?.paid_amount || 0)} GEL</strong></Paper>
        <Paper className="zzv-finance-summary__card"><span>{t('financeReport.pendingTotal')}</span><strong>{gel.format(summary?.pending_amount || 0)} GEL</strong></Paper>
      </div>
      <p className="zzv-finance-summary__hint">{t('financeReport.totalsHint')}</p>

      <div className="zzv-finance-results">
        <Typography variant="body2">{t('financeReport.showing', { first: firstRow, last: lastRow, total })}</Typography>
        {isFetching && <CircularProgress size={18} />}
      </div>
      {error && <Alert severity="error">{t('common.errorLoading')}</Alert>}
      <TableContainer component={Paper} className="zzv-staff-workspace__table-wrap">
        <Table className="zzv-staff-workspace__table">
          <TableHead><TableRow>
            <TableCell>{t('financeReport.offerCreated')}</TableCell>
            <TableCell>{t('financeReport.paidAt')}</TableCell>
            <TableCell>{t('case.caseNumber')}</TableCell>
            <TableCell>{t('case.customerName')}</TableCell>
            <TableCell>{t('case.customerPhone')}</TableCell>
            <TableCell>{t('staffWorkspace.technician')}</TableCell>
            <TableCell>{t('staffWorkspace.paymentType')}</TableCell>
            <TableCell align="right">{t('common.amount')}</TableCell>
            <TableCell>{t('payment.method')}</TableCell>
            <TableCell>{t('payment.status')}</TableCell>
            <TableCell>{t('case.deviceType')}</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {payments.length ? payments.map((payment) => <TableRow key={payment.id} hover>
              <TableCell>{formatFinanceDate(payment.created_at)}</TableCell>
              <TableCell>{formatFinanceDate(payment.paid_at)}</TableCell>
              <TableCell>{payment.case_?.case_number || '-'}</TableCell>
              <TableCell>{[payment.case_?.customer_name, payment.case_?.customer_last_name].filter(Boolean).join(' ') || '-'}</TableCell>
              <TableCell>{payment.case_?.customer_phone || '-'}</TableCell>
              <TableCell>{[payment.case_?.assigned_technician?.name, payment.case_?.assigned_technician?.last_name].filter(Boolean).join(' ') || '-'}</TableCell>
              <TableCell>{payment.offer_type ? t(`result.${payment.offer_type}`) : '-'}</TableCell>
              <TableCell align="right">{payment.offer_amount == null ? '-' : `${gel.format(Number(payment.offer_amount))} GEL`}</TableCell>
              <TableCell>{payment.payment_method ? t(`payment.${payment.payment_method}`) : '-'}</TableCell>
              <TableCell><Chip label={t(`payment.${payment.payment_status}`)} color={statusColors[payment.payment_status] || 'default'} size="small" /></TableCell>
              <TableCell>{payment.case_?.device_type ? t(`financeReport.deviceTypes.${payment.case_.device_type}`, payment.case_.device_type) : '-'}</TableCell>
            </TableRow>) : <TableRow><TableCell colSpan={11} align="center">
              {isLoading ? <CircularProgress size={22} /> : t('financeReport.noRecords')}
            </TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      <div className="zzv-finance-pagination">
        <Button disabled={page <= 1 || isFetching} onClick={() => setPage((current) => current - 1)}>{t('common.previous')}</Button>
        <span>{page} / {pageCount}</span>
        <Button disabled={page >= pageCount || isFetching} onClick={() => setPage((current) => current + 1)}>{t('common.next')}</Button>
      </div>
    </Box>
  );
};

export default FinancePage;
