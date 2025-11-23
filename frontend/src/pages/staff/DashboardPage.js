import React, { useState } from 'react';
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
  IconButton,
  Popover,
  TextField,
  Button,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { dashboardService } from '../../services/dashboardService';
import { useNavigate } from 'react-router-dom';

// Individual Gauge Component with its own filter
const DashboardGauge = ({ 
  title, 
  value, 
  color = 'primary',
  onClick,
  filterKey,
  filters,
  onFilterChange,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [localFilter, setLocalFilter] = useState(filters[filterKey] || { type: 'all' });
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);

  const handleFilterClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleFilterTypeChange = (type) => {
    const now = new Date();
    let start = null;
    let end = null;

    switch (type) {
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case 'month':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case 'custom':
        start = customStart;
        end = customEnd;
        break;
      case 'all':
      default:
        start = null;
        end = null;
        break;
    }

    const newFilter = { type, start, end };
    setLocalFilter(newFilter);
    onFilterChange(filterKey, newFilter);
    handleFilterClose();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Paper
        sx={{
          p: 3,
          position: 'relative',
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': onClick ? { boxShadow: 4 } : {},
        }}
        onClick={onClick}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
          <IconButton
            size="small"
            onClick={handleFilterClick}
            sx={{ mt: -1, mr: -1 }}
          >
            <FilterIcon fontSize="small" />
          </IconButton>
        </Box>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Typography variant="h3" color={color}>
            {value || 0}
          </Typography>
        )}
      </Paper>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, minWidth: 250 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle2">Filter</Typography>
            <IconButton size="small" onClick={handleFilterClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={localFilter.type}
              label="Time Period"
              onChange={(e) => handleFilterTypeChange(e.target.value)}
            >
              <MenuItem value="all">{t('common.allTime')}</MenuItem>
              <MenuItem value="week">{t('common.lastWeek')}</MenuItem>
              <MenuItem value="month">{t('common.lastMonth')}</MenuItem>
              <MenuItem value="custom">{t('common.custom')}</MenuItem>
            </Select>
          </FormControl>
          {localFilter.type === 'custom' && (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label={t('common.startDate')}
                value={customStart ? customStart.toISOString().split('T')[0] : ''}
                onChange={(e) => setCustomStart(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                size="small"
                type="date"
                label={t('common.endDate')}
                value={customEnd ? customEnd.toISOString().split('T')[0] : ''}
                onChange={(e) => setCustomEnd(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                fullWidth
                variant="contained"
                size="small"
                onClick={() => handleFilterTypeChange('custom')}
                sx={{ mt: 1 }}
              >
                Apply
              </Button>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
};

const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Individual filters for each gauge
  const [filters, setFilters] = useState({
    runningCases: { type: 'all', start: null, end: null },
    closeToDeadline: { type: 'all', start: null, end: null },
    dueCases: { type: 'all', start: null, end: null },
    closedCases: { type: 'all', start: null, end: null },
    activeWarranties: { type: 'all', start: null, end: null },
    expiredWarranties: { type: 'all', start: null, end: null },
    avgCompletion: { type: 'all', start: null, end: null, deviceType: '' },
    onTimeCases: { type: 'all', start: null, end: null },
    totalPayments: { type: 'all', start: null, end: null },
    totalMoneyIn: { type: 'all', start: null, end: null },
  });

  const handleFilterChange = (filterKey, newFilter) => {
    setFilters({ ...filters, [filterKey]: newFilter });
  };

  // Individual queries for each gauge (simplified - using main query for now)
  const { data: stats, isLoading } = useQuery(
    ['dashboard', filters],
    () => {
      // Use the most common filter or combine them
      const mainFilter = filters.runningCases;
      return dashboardService.getStats(mainFilter.start, mainFilter.end, filters.avgCompletion.deviceType);
    },
    {
      refetchInterval: 30000,
    }
  );

  const realTime = stats?.realTime || {};
  const timeFiltered = stats?.timeFiltered || {};

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('common.dashboard')}</Typography>
      </Box>

      {/* Row 1: Real-time Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardGauge
            title={t('common.openCases')}
            value={realTime.openCases}
            color="primary"
            onClick={() => navigate('/staff/cases')}
            filterKey="runningCases"
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardGauge
            title={t('common.closeToDeadline')}
            value={realTime.closeToDeadline}
            color="warning.main"
            onClick={() => navigate('/staff/cases?closeToDeadline=true')}
            filterKey="closeToDeadline"
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardGauge
            title={t('common.dueCases')}
            value={realTime.dueCases}
            color="error.main"
            onClick={() => navigate('/staff/cases?due=true')}
            filterKey="dueCases"
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Row 2: Warranty Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardGauge
            title={t('common.closedCases')}
            value={timeFiltered.closedCases}
            onClick={() => navigate('/staff/cases/closed')}
            filterKey="closedCases"
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardGauge
            title={t('common.activeWarranties')}
            value={timeFiltered.activeWarranties}
            color="success.main"
            onClick={() => navigate('/staff/warranties?status=active')}
            filterKey="activeWarranties"
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardGauge
            title={t('common.expiredWarranties')}
            value={timeFiltered.expiredWarranties}
            color="text.secondary"
            onClick={() => navigate('/staff/warranties?status=expired')}
            filterKey="expiredWarranties"
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Row 3: Performance Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, position: 'relative' }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Typography variant="h6" color="text.secondary">
                {t('common.avgCompletionTime')}
                {filters.avgCompletion.deviceType && ` (${filters.avgCompletion.deviceType})`}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120, mt: -1, mr: -1 }}>
                <Select
                  value={filters.avgCompletion.deviceType || ''}
                  onChange={(e) => {
                    const newFilter = { ...filters.avgCompletion, deviceType: e.target.value };
                    handleFilterChange('avgCompletion', newFilter);
                  }}
                  displayEmpty
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Phone">Phone</MenuItem>
                  <MenuItem value="Tablet">Tablet</MenuItem>
                  <MenuItem value="Laptop">Laptop</MenuItem>
                  <MenuItem value="Desktop">Desktop</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Typography variant="h3">
              {filters.avgCompletion.deviceType && timeFiltered.avgCompletionByDeviceType?.[filters.avgCompletion.deviceType]
                ? timeFiltered.avgCompletionByDeviceType[filters.avgCompletion.deviceType]
                : timeFiltered.avgCompletionTime || 0}{' '}
              {t('common.days')}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardGauge
            title={t('common.onTimeCases')}
            value={timeFiltered.onTimeCases}
            color="success.main"
            filterKey="onTimeCases"
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Row 4: Financial Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardGauge
            title={t('common.totalPayments')}
            value={timeFiltered.totalPayments}
            onClick={() => navigate('/staff/finance')}
            filterKey="totalPayments"
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardGauge
            title={t('common.totalMoneyIn')}
            value={timeFiltered.totalMoneyIn?.toFixed(2) + ' ₾'}
            color="success.main"
            onClick={() => navigate('/staff/finance')}
            filterKey="totalMoneyIn"
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </Grid>
      </Grid>
    </div>
  );
};

export default DashboardPage;
