import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import {
  Typography,
  Grid,
  Paper,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Button,
} from '@mui/material';
import { dashboardService } from '../../services/dashboardService';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('all'); // all, week, month, custom
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const { data: stats, isLoading, refetch } = useQuery(
    ['dashboard', startDate, endDate],
    () => dashboardService.getStats(startDate, endDate),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
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
      case 'all':
      default:
        start = null;
        end = null;
        break;
    }

    setStartDate(start);
    setEndDate(end);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const realTime = stats?.realTime || {};
  const timeFiltered = stats?.timeFiltered || {};

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('common.dashboard')}</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t('common.timeFilter') || 'Time Period'}</InputLabel>
          <Select
            value={timeFilter}
            label={t('common.timeFilter') || 'Time Period'}
            onChange={(e) => handleTimeFilterChange(e.target.value)}
          >
            <MenuItem value="all">{t('common.allTime') || 'All Time'}</MenuItem>
            <MenuItem value="week">{t('common.lastWeek') || 'Last Week'}</MenuItem>
            <MenuItem value="month">{t('common.lastMonth') || 'Last Month'}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Row 1: Real-time Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              p: 3,
              cursor: 'pointer',
              '&:hover': { boxShadow: 4 },
            }}
            onClick={() => navigate('/staff/cases?status=1,2,3')}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('common.openCases')}
            </Typography>
            <Typography variant="h3" color="primary">
              {realTime.openCases || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              p: 3,
              cursor: 'pointer',
              '&:hover': { boxShadow: 4 },
            }}
            onClick={() => navigate('/staff/cases?closeToDeadline=true')}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('common.closeToDeadline')}
            </Typography>
            <Typography variant="h3" color="warning.main">
              {realTime.closeToDeadline || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              p: 3,
              cursor: 'pointer',
              '&:hover': { boxShadow: 4 },
            }}
            onClick={() => navigate('/staff/cases?due=true')}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('common.dueCases')}
            </Typography>
            <Typography variant="h3" color="error.main">
              {realTime.dueCases || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Row 2: Warranty Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('common.closedCases')}
            </Typography>
            <Typography variant="h3">{timeFiltered.closedCases || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('common.activeWarranties')}
            </Typography>
            <Typography variant="h3" color="success.main">
              {timeFiltered.activeWarranties || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('common.expiredWarranties')}
            </Typography>
            <Typography variant="h3" color="text.secondary">
              {timeFiltered.expiredWarranties || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Row 3: Performance Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('common.avgCompletionTime') || 'Avg. Completion Time'}
            </Typography>
            <Typography variant="h3">
              {timeFiltered.avgCompletionTime || 0} {t('common.days') || 'days'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('common.onTimeCases') || 'On-time Cases'}
            </Typography>
            <Typography variant="h3" color="success.main">
              {timeFiltered.onTimeCases || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Row 4: Financial Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('common.totalPayments') || 'Total Payments'}
            </Typography>
            <Typography variant="h3">{timeFiltered.totalPayments || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('common.totalMoneyIn') || 'Total Money In'}
            </Typography>
            <Typography variant="h3" color="success.main">
              {timeFiltered.totalMoneyIn?.toFixed(2) || '0.00'} ₾
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default DashboardPage;
