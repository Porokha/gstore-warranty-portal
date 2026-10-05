import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import {
  Typography,
  Box,
  Paper,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { statisticsService } from '../../services/statisticsService';
import { usersService } from '../../services/usersService';
import { isManagementRole, isTechnicianRole } from '../../utils/roles';
// Using native date inputs instead of MUI date picker to avoid dependency

const StatisticsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const hasManagementAccess = isManagementRole(user?.role);
  
  const [selectedTechnician, setSelectedTechnician] = useState(hasManagementAccess ? '' : user?.id || '');
  const [timeFilter, setTimeFilter] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Fetch technicians for admin/manager
  const { data: technicians } = useQuery(
    'technicians',
    () => usersService.getAll(),
    { enabled: hasManagementAccess }
  );

  const handleTimeFilterChange = (value) => {
    setTimeFilter(value);
    const now = new Date();
    let start = null;
    let end = null;

    switch (value) {
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case 'month':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case 'custom':
        // Keep current dates
        break;
      case 'all':
      default:
        start = null;
        end = null;
        break;
    }

    setStartDate(start);
    setEndDate(end);
  };

  const startDateStr = startDate ? startDate.toISOString().split('T')[0] : undefined;
  const endDateStr = endDate ? endDate.toISOString().split('T')[0] : undefined;

  // Fetch statistics
  const { data: stats, isLoading } = useQuery(
    ['technician-stats', selectedTechnician, startDateStr, endDateStr],
    () => statisticsService.getTechnicianStats(
      selectedTechnician ? parseInt(selectedTechnician) : undefined,
      startDateStr,
      endDateStr
    ),
    { enabled: !!selectedTechnician || hasManagementAccess }
  );

  // Fetch all technicians stats for admin/manager
  const { data: allStats, isLoading: isLoadingAll } = useQuery(
    ['all-technicians-stats', startDateStr, endDateStr],
    () => statisticsService.getAllTechniciansStats(startDateStr, endDateStr),
    { enabled: hasManagementAccess && !selectedTechnician }
  );

  const handleExport = () => {
    if (hasManagementAccess && !selectedTechnician) {
      statisticsService.exportAllTechniciansStats(startDateStr, endDateStr);
    } else {
      statisticsService.exportTechnicianStats(
        selectedTechnician ? parseInt(selectedTechnician) : undefined,
        startDateStr,
        endDateStr
      );
    }
  };

  if (isLoading || isLoadingAll) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const displayStats = hasManagementAccess && !selectedTechnician ? null : stats;
  const displayData = hasManagementAccess && !selectedTechnician ? allStats : (stats ? [stats] : []);

  return (
    <div className="zzv-staff-workspace zzv-staff-workspace--statistics">
      <Box className="zzv-staff-workspace__heading">
        <Box>
          <Typography variant="h4">
            {hasManagementAccess ? t('common.technicianStatistics') : t('common.myStatistics')}
          </Typography>
          <Typography variant="body2" color="text.secondary">{t('staffWorkspace.statisticsDescription')}</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={!displayStats && !allStats}
        >
          {t('common.export')} Excel
        </Button>
      </Box>

      {/* Filters */}
      <Paper className="zzv-staff-workspace__filters">
        <Grid container spacing={2} alignItems="center">
          {hasManagementAccess && (
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('staffWorkspace.technician')}</InputLabel>
                <Select
                  value={selectedTechnician}
                  label={t('staffWorkspace.technician')}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                >
                  <MenuItem value="">{t('staffWorkspace.allTechnicians')}</MenuItem>
                  {technicians?.filter(t => isTechnicianRole(t.role)).map((tech) => (
                    <MenuItem key={tech.id} value={tech.id}>
                      {tech.name} {tech.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('common.timeFilter')}</InputLabel>
              <Select
                value={timeFilter}
                label={t('common.timeFilter')}
                onChange={(e) => handleTimeFilterChange(e.target.value)}
              >
                <MenuItem value="all">{t('common.allTime')}</MenuItem>
                <MenuItem value="week">{t('common.lastWeek')}</MenuItem>
                <MenuItem value="month">{t('common.lastMonth')}</MenuItem>
                <MenuItem value="custom">{t('common.custom')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {timeFilter === 'custom' && (
            <>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('common.startDate')}
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('common.endDate')}
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      {/* Single Technician Stats */}
      {displayStats && (
        <Grid container spacing={2} className="zzv-staff-workspace__metrics">
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('staffWorkspace.totalCases')}
              </Typography>
              <Typography variant="h3">{displayStats.totalCases || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('staffWorkspace.runningCases')}
              </Typography>
              <Typography variant="h3" color="primary">
                {displayStats.runningCases || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('staffWorkspace.completedCases')}
              </Typography>
              <Typography variant="h3" color="success.main">
                {displayStats.completedCases || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('common.avgCompletionTime')}
              </Typography>
              <Typography variant="h3">
                {displayStats.avgCompletionTime || 0} {t('common.days')}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('common.onTimeCases')}
              </Typography>
              <Typography variant="h3" color="success.main">
                {displayStats.onTimeCases || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('staffWorkspace.onTimeRate')}
              </Typography>
              <Typography variant="h3">
                {displayStats.onTimeRate || '0'}%
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('common.totalPayments')}
              </Typography>
              <Typography variant="h3">{displayStats.totalPayments || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('staffWorkspace.totalPaidAmount')}
              </Typography>
              <Typography variant="h3" color="success.main">
                {displayStats.totalPaidAmount?.toFixed(2) || '0.00'} ₾
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* All Technicians Table (Admin only) */}
      {hasManagementAccess && !selectedTechnician && allStats && (
        <TableContainer component={Paper} className="zzv-staff-workspace__table-wrap">
          <Table className="zzv-staff-workspace__table">
            <TableHead>
              <TableRow>
                <TableCell>{t('staffWorkspace.technician')}</TableCell>
                <TableCell align="right">{t('staffWorkspace.totalCases')}</TableCell>
                <TableCell align="right">{t('staffWorkspace.runningCases')}</TableCell>
                <TableCell align="right">{t('staffWorkspace.completedCases')}</TableCell>
                <TableCell align="right">{t('common.avgCompletionTime')}</TableCell>
                <TableCell align="right">{t('staffWorkspace.onTimeRate')}</TableCell>
                <TableCell align="right">{t('staffWorkspace.totalPaidAmount')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allStats.map((stat) => (
                <TableRow key={stat.technician.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon />
                      {stat.technician.name} {stat.technician.last_name}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{stat.totalCases}</TableCell>
                  <TableCell align="right">
                    <Chip label={stat.runningCases} color="primary" size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={stat.completedCases} color="success" size="small" />
                  </TableCell>
                  <TableCell align="right">{stat.avgCompletionTime}</TableCell>
                  <TableCell align="right">{stat.onTimeRate}%</TableCell>
                  <TableCell align="right">{stat.totalPaidAmount?.toFixed(2) || '0.00'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
};

export default StatisticsPage;
