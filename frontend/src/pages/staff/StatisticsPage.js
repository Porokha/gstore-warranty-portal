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
// Using native date inputs instead of MUI date picker to avoid dependency

const StatisticsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [selectedTechnician, setSelectedTechnician] = useState(isAdmin ? '' : user.id);
  const [timeFilter, setTimeFilter] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Fetch technicians for admin
  const { data: technicians } = useQuery(
    'technicians',
    () => usersService.getAll(),
    { enabled: isAdmin }
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
    { enabled: !!selectedTechnician || isAdmin }
  );

  // Fetch all technicians stats for admin
  const { data: allStats, isLoading: isLoadingAll } = useQuery(
    ['all-technicians-stats', startDateStr, endDateStr],
    () => statisticsService.getAllTechniciansStats(startDateStr, endDateStr),
    { enabled: isAdmin && !selectedTechnician }
  );

  const handleExport = () => {
    if (isAdmin && !selectedTechnician) {
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

  const displayStats = isAdmin && !selectedTechnician ? null : stats;
  const displayData = isAdmin && !selectedTechnician ? allStats : (stats ? [stats] : []);

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {isAdmin ? t('common.technicianStatistics') || 'Technician Statistics' : t('common.myStatistics') || 'My Statistics'}
        </Typography>
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
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {isAdmin && (
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Technician</InputLabel>
                <Select
                  value={selectedTechnician}
                  label="Technician"
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                >
                  <MenuItem value="">All Technicians</MenuItem>
                  {technicians?.filter(t => t.role === 'technician').map((tech) => (
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
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Cases
              </Typography>
              <Typography variant="h3">{displayStats.totalCases || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Running Cases
              </Typography>
              <Typography variant="h3" color="primary">
                {displayStats.runningCases || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Completed Cases
              </Typography>
              <Typography variant="h3" color="success.main">
                {displayStats.completedCases || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Avg Completion Time
              </Typography>
              <Typography variant="h3">
                {displayStats.avgCompletionTime || 0} {t('common.days')}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                On-time Cases
              </Typography>
              <Typography variant="h3" color="success.main">
                {displayStats.onTimeCases || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                On-time Rate
              </Typography>
              <Typography variant="h3">
                {displayStats.onTimeRate || '0'}%
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Payments
              </Typography>
              <Typography variant="h3">{displayStats.totalPayments || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Paid Amount
              </Typography>
              <Typography variant="h3" color="success.main">
                {displayStats.totalPaidAmount?.toFixed(2) || '0.00'} ₾
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* All Technicians Table (Admin only) */}
      {isAdmin && !selectedTechnician && allStats && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Technician</TableCell>
                <TableCell align="right">Total Cases</TableCell>
                <TableCell align="right">Running</TableCell>
                <TableCell align="right">Completed</TableCell>
                <TableCell align="right">Avg Completion (days)</TableCell>
                <TableCell align="right">On-time Rate (%)</TableCell>
                <TableCell align="right">Total Paid (₾)</TableCell>
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

