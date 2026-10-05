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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { auditService } from '../../services/auditService';
import { format } from 'date-fns';

const AuditPage = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    start_date: '',
    end_date: '',
  });

  const { data: auditLogs, isLoading, error } = useQuery(
    ['audit', filters],
    () => auditService.getAll(filters)
  );

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
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
    <Box className="zzv-staff-workspace zzv-staff-workspace--audit">
      <Box className="zzv-staff-workspace__heading">
        <Box>
          <Typography variant="h4">{t('common.audit')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('staffWorkspace.auditDescription')}</Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Paper className="zzv-staff-workspace__filters">
        <Box className="zzv-staff-workspace__filter-grid">
          <TextField
            size="small"
            label={t('common.userId') || 'User ID'}
            type="number"
            value={filters.user_id}
            onChange={(e) => handleFilterChange('user_id', e.target.value)}
            sx={{ minWidth: 150 }}
          />
          <TextField
            size="small"
            label={t('common.action') || 'Action'}
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            sx={{ minWidth: 200 }}
          />
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
        </Box>
      </Paper>

      {/* Audit Logs Table */}
      <TableContainer component={Paper} className="zzv-staff-workspace__table-wrap">
        <Table className="zzv-staff-workspace__table">
          <TableHead>
            <TableRow>
              <TableCell>{t('common.date') || 'Date'}</TableCell>
              <TableCell>{t('common.user') || 'User'}</TableCell>
              <TableCell>{t('common.action') || 'Action'}</TableCell>
              <TableCell>{t('common.details') || 'Details'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auditLogs && auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    {log.user ? `${log.user.name} ${log.user.last_name}` : `User ID: ${log.user_id}`}
                  </TableCell>
                  <TableCell>
                    <Chip label={log.action} size="small" />
                  </TableCell>
                  <TableCell>
                    <Accordion className="zzv-staff-workspace__audit-detail" disableGutters elevation={0}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body2">
                          {t('common.viewPayload') || 'View Payload'}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <pre>
                          {JSON.stringify(log.payload_json, null, 2)}
                        </pre>
                      </AccordionDetails>
                    </Accordion>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {t('common.noAuditLogs') || 'No audit logs found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AuditPage;
