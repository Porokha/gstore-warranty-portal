import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Link,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Popover,
  TextField,
  Button,
} from '@mui/material';
import {
  FolderOpen as FolderIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  VerifiedUser as WarrantyIcon,
  AccountBalance as PaymentIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Visibility as ViewIcon,
  ArrowDropDown as ArrowDropDownIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import { casesService } from '../../services/casesService';
import { useAuth } from '../../contexts/AuthContext';

const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasManagementAccess = ['admin', 'manager'].includes(user?.role);
  const brand = {
    violet: '#A576FF',
    violetSoft: '#EFE7FF',
    violetDeep: '#8F5EF0',
    ink: '#18181B',
    muted: '#5B5568',
    border: '#E3D7FF',
    surface: '#FBF9FF',
    black: '#000000',
  };
  const [timeFilter, setTimeFilter] = useState('30');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);

  const getTimeRange = () => {
    const end = new Date();
    const start = new Date();
    if (timeFilter === 'custom' && customStart && customEnd) {
      return { start: customStart, end: customEnd };
    }
    start.setDate(start.getDate() - parseInt(timeFilter));
    return { start, end };
  };

  const timeRange = getTimeRange();

  const { data: stats, isLoading } = useQuery(
    ['dashboard', timeFilter, customStart, customEnd],
    () => dashboardService.getStats(timeRange.start, timeRange.end),
    {
      refetchInterval: 30000,
    }
  );

  const { data: statusChartData } = useQuery(
    ['dashboard', 'cases-by-status', timeFilter, customStart, customEnd],
    () => dashboardService.getCasesByStatus(timeRange.start, timeRange.end),
    {
      refetchInterval: 30000,
    }
  );

  const { data: completionChartData } = useQuery(
    ['dashboard', 'completion-time', timeFilter, customStart, customEnd],
    () => dashboardService.getCompletionTimeByDevice(timeRange.start, timeRange.end),
    {
      refetchInterval: 30000,
    }
  );

  const { data: recentCases } = useQuery(
    'recent-cases',
    () => casesService.getAll({ limit: 5, sort: 'opened_at', order: 'DESC' }),
    {
      refetchInterval: 30000,
      select: (data) => {
        // Handle both array and { data: [...] } response formats
        if (Array.isArray(data)) return data;
        if (data?.data && Array.isArray(data.data)) return data.data;
        return [];
      },
    }
  );

  const { data: casesByCategory } = useQuery(
    ['dashboard', 'cases-by-category', timeFilter, customStart, customEnd],
    () => dashboardService.getCasesByCategory(timeRange.start, timeRange.end),
    {
      refetchInterval: 30000,
    }
  );

  const { data: urgentCasesCount } = useQuery(
    'urgent-cases-count',
    () => casesService.getAll({ status: 'opened,investigating,pending', priority: 'high,critical' }),
    {
      select: (data) => data?.data?.length || 0,
      refetchInterval: 30000,
    }
  );

  const realTime = stats?.realTime || {};
  const timeFiltered = stats?.timeFiltered || {};

  // Calculate on-time percentage
  const totalCompleted = timeFiltered.closedCases || 0;
  const onTimeCount = timeFiltered.onTimeCases || 0;
  const onTimePercentage = totalCompleted > 0 ? Math.round((onTimeCount / totalCompleted) * 100 * 10) / 10 : 0;

  // Chart data from API
  const statusData = statusChartData || [];
  const completionTimeData = completionChartData || [];

  const getStatusColor = (status) => {
    const statusMap = {
      'opened': '#d4befe',
      'investigating': '#a576ff',
      'pending': '#6d28d9',
      'completed': '#000000',
    };
    return statusMap[status?.toLowerCase()] || '#64748b';
  };

  const getStatusFromLevel = (level) => {
    const levelMap = {
      1: 'opened',
      2: 'investigating',
      3: 'pending',
      4: 'completed',
    };
    return levelMap[level] || 'opened';
  };

  const getPriorityColor = (priority) => {
    const priorityMap = {
      'high': '#8f5ef0',
      'critical': '#000000',
      'normal': '#5b5568',
      'low': '#d4befe',
    };
    return priorityMap[priority?.toLowerCase()] || '#5b5568';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (deadline, statusLevel) => {
    if (!deadline || statusLevel === 3) return false;
    return new Date(deadline) < new Date();
  };

  const handleFilterClick = (event) => {
    setFilterAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchor(null);
  };

  const handleFilterChange = (type) => {
    if (type === 'custom') {
      setTimeFilter('custom');
    } else {
      setTimeFilter(type);
      setCustomStart(null);
      setCustomEnd(null);
    }
    handleFilterClose();
  };

  const applyCustomFilter = () => {
    if (customStart && customEnd) {
      setTimeFilter('custom');
      handleFilterClose();
    }
  };

  return (
    <Box>
      {/* Welcome Section */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: brand.ink, mb: 1 }}>
              {t('dashboard.title')}
            </Typography>
            <Typography variant="body1" sx={{ color: brand.muted }}>
              {t('dashboard.welcome')}
            </Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={timeFilter}
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    setTimeFilter(e.target.value);
                  }
                }}
                IconComponent={ArrowDropDownIcon}
                sx={{ fontSize: '14px', bgcolor: '#ffffff', borderRadius: 2 }}
              >
                <MenuItem value="7">{t('dashboard.filters.last7')}</MenuItem>
                <MenuItem value="30">{t('dashboard.filters.last30')}</MenuItem>
                <MenuItem value="90">{t('dashboard.filters.last90')}</MenuItem>
                <MenuItem value="custom">{t('dashboard.filters.customRange')}</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              size="small"
              onClick={handleFilterClick}
              sx={{ border: `1px solid ${brand.border}`, color: brand.muted, bgcolor: '#fff' }}
            >
              <FilterIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, minWidth: 300 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t('dashboard.filters.customDateRange')}</Typography>
            <IconButton size="small" onClick={handleFilterClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <TextField
            fullWidth
            type="date"
            label={t('dashboard.filters.startDate')}
            value={customStart ? customStart.toISOString().split('T')[0] : ''}
            onChange={(e) => setCustomStart(e.target.value ? new Date(e.target.value) : null)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
            size="small"
          />
          <TextField
            fullWidth
            type="date"
            label={t('dashboard.filters.endDate')}
            value={customEnd ? customEnd.toISOString().split('T')[0] : ''}
            onChange={(e) => setCustomEnd(e.target.value ? new Date(e.target.value) : null)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
            size="small"
          />
          <Button
            fullWidth
            variant="contained"
            onClick={applyCustomFilter}
            disabled={!customStart || !customEnd}
            size="small"
          >
            {t('dashboard.filters.apply')}
          </Button>
        </Box>
      </Popover>

      {/* Summary Cards Row 1 - Smaller */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${brand.violet} 0%, ${brand.violetDeep} 100%)`,
              color: '#ffffff',
              borderRadius: 2,
              boxShadow: '0 18px 36px rgba(143, 94, 240, 0.2)',
              cursor: 'pointer',
              '&:hover': { boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' },
            }}
            onClick={() => navigate('/staff/cases')}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                <FolderIcon sx={{ fontSize: 28, opacity: 0.9 }} />
                <Chip label={t('common.active')} size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', height: 22, fontSize: '11px' }} />
              </Box>
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: '#ffffff' }} />
              ) : (
                <>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: '28px' }}>
                    {realTime.openCases || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '13px' }}>
                    {t('dashboard.cards.openCases')}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${brand.black} 0%, #2a2a2f 100%)`,
              color: '#ffffff',
              borderRadius: 2,
              boxShadow: '0 18px 36px rgba(0, 0, 0, 0.18)',
              cursor: 'pointer',
              '&:hover': { boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' },
            }}
            onClick={() => navigate('/staff/cases?closeToDeadline=true')}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                <CalendarIcon sx={{ fontSize: 28, opacity: 0.9 }} />
                <Chip label={t('dashboard.badges.dueSoon')} size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', height: 22, fontSize: '11px' }} />
              </Box>
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: '#ffffff' }} />
              ) : (
                <>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: '28px' }}>
                    {realTime.closeToDeadline || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '13px' }}>
                    {t('dashboard.cards.closeToDeadline')}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${brand.violetDeep} 0%, #6d28d9 100%)`,
              color: '#ffffff',
              borderRadius: 2,
              boxShadow: '0 18px 36px rgba(109, 40, 217, 0.2)',
              cursor: 'pointer',
              '&:hover': { boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' },
            }}
            onClick={() => navigate('/staff/cases?due=true')}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                <WarningIcon sx={{ fontSize: 28, opacity: 0.9 }} />
                <Chip label={t('dashboard.badges.urgent')} size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', height: 22, fontSize: '11px' }} />
              </Box>
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: '#ffffff' }} />
              ) : (
                <>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: '28px' }}>
                    {realTime.dueCases || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '13px' }}>
                    {t('dashboard.cards.dueCases')}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${brand.violetSoft} 0%, ${brand.violet} 100%)`,
              color: brand.ink,
              borderRadius: 2,
              boxShadow: '0 18px 36px rgba(165, 118, 255, 0.18)',
              cursor: 'pointer',
              '&:hover': { boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' },
            }}
            onClick={() => navigate('/staff/cases/closed')}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                <CheckCircleIcon sx={{ fontSize: 28, opacity: 0.9 }} />
                <Chip label={t('dashboard.badges.completed')} size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.55)', color: brand.ink, height: 22, fontSize: '11px' }} />
              </Box>
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: '#ffffff' }} />
              ) : (
                <>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: '28px' }}>
                    {timeFiltered.closedCases || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '13px' }}>
                    {t('dashboard.cards.closedThisMonth')}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {hasManagementAccess && (
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                bgcolor: '#10b981',
                color: '#ffffff',
                borderRadius: 2,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                '&:hover': { boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' },
              }}
              onClick={() => navigate('/staff/warranties?status=active')}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                  <WarrantyIcon sx={{ fontSize: 28, opacity: 0.9 }} />
                  <Chip label={t('common.active')} size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', height: 22, fontSize: '11px' }} />
                </Box>
                {isLoading ? (
                  <CircularProgress size={24} sx={{ color: '#ffffff' }} />
                ) : (
                  <>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: '28px' }}>
                      {timeFiltered.activeWarranties || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '13px' }}>
                      {t('dashboard.cards.activeWarranties')}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                background: `linear-gradient(135deg, #2d2b34 0%, ${brand.black} 100%)`,
                color: '#ffffff',
                borderRadius: 2,
                boxShadow: '0 18px 36px rgba(0, 0, 0, 0.18)',
                cursor: 'pointer',
                '&:hover': { boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' },
              }}
              onClick={() => navigate('/staff/warranties?status=expired')}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                  <WarrantyIcon sx={{ fontSize: 28, opacity: 0.9 }} />
                  <Chip label={t('common.expired')} size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', height: 22, fontSize: '11px' }} />
                </Box>
                {isLoading ? (
                  <CircularProgress size={24} sx={{ color: '#ffffff' }} />
                ) : (
                  <>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: '28px' }}>
                      {timeFiltered.expiredWarranties || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '13px' }}>
                      {t('dashboard.cards.expiredWarranties')}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${brand.violet} 0%, ${brand.black} 100%)`,
                color: '#ffffff',
                borderRadius: 2,
                boxShadow: '0 18px 36px rgba(63, 30, 120, 0.18)',
                cursor: 'pointer',
                '&:hover': { boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' },
              }}
              onClick={() => navigate('/staff/finance')}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                  <PaymentIcon sx={{ fontSize: 28, opacity: 0.9 }} />
                  <Chip label={t('dashboard.badges.revenue')} size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', height: 22, fontSize: '11px' }} />
                </Box>
                {isLoading ? (
                  <CircularProgress size={24} sx={{ color: '#ffffff' }} />
                ) : (
                  <>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: '28px' }}>
                      ₾{timeFiltered.totalMoneyIn?.toFixed(0) || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '13px' }}>
                      {t('dashboard.cards.payments')}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts Section - Same Height */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 18px 48px rgba(63, 30, 120, 0.08)', border: `1px solid ${brand.border}` }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: brand.ink, fontSize: '16px' }}>
                {t('dashboard.charts.completionTime')}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={timeFilter}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setTimeFilter(e.target.value);
                    }
                  }}
                  IconComponent={ArrowDropDownIcon}
                  sx={{ fontSize: '13px' }}
                >
                  <MenuItem value="7">{t('dashboard.filters.last7')}</MenuItem>
                  <MenuItem value="30">{t('dashboard.filters.last30')}</MenuItem>
                  <MenuItem value="90">{t('dashboard.filters.last90')}</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {completionChartData && completionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={completionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={brand.border} />
                  <XAxis dataKey="name" stroke={brand.muted} fontSize={11} />
                  <YAxis stroke={brand.muted} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: `1px solid ${brand.border}`,
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill={brand.violet} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={250}>
                <Typography variant="body2" sx={{ color: brand.muted }}>{t('dashboard.charts.noData')}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 18px 48px rgba(63, 30, 120, 0.08)', border: `1px solid ${brand.border}` }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: brand.ink, mb: 2, fontSize: '16px' }}>
              {t('dashboard.charts.casesByStatus')}
            </Typography>
            {statusChartData && statusChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percentage }) => `${percentage}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box display="flex" justifyContent="center" gap={2} mt={1.5} flexWrap="wrap">
                  {statusChartData.map((item, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={0.75}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: item.color,
                        }}
                      />
                      <Typography variant="caption" sx={{ color: brand.muted, fontSize: '11px' }}>
                        {item.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={250}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>{t('dashboard.charts.noData')}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {hasManagementAccess && (
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '13px' }}>
                {t('dashboard.kpi.avgServiceTime')}
              </Typography>
              <TrendingDownIcon sx={{ color: '#10b981', fontSize: 18 }} />
            </Box>
            {isLoading ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1, fontSize: '24px' }}>
                  {timeFiltered.avgCompletionTime?.toFixed(1) || 0} {t('common.days')}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, fontSize: '11px' }}>
                    {t('dashboard.kpi.faster')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
                    {t('dashboard.kpi.vsLastMonth')}
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '13px' }}>
                {t('dashboard.kpi.onTimePerformance')}
              </Typography>
            </Box>
            {isLoading ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1, fontSize: '24px' }}>
                  {onTimePercentage}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={onTimePercentage}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: '#e2e8f0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#10b981',
                      borderRadius: 3,
                    },
                  }}
                />
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '13px' }}>
                {t('dashboard.kpi.customerSatisfaction')}
              </Typography>
              <StarIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1, fontSize: '24px' }}>
              4.6/5.0
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <TrendingUpIcon sx={{ color: '#10b981', fontSize: 14 }} />
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, fontSize: '11px' }}>
                {t('dashboard.kpi.ratingChange')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
                {t('dashboard.kpi.vsLastMonth')}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      )}

      {/* Cases by Category and Average Completion by Category */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2, fontSize: '16px' }}>
              {t('dashboard.charts.casesByCategory') || 'Cases by Category'}
            </Typography>
            {casesByCategory && casesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={casesByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={250}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>{t('dashboard.charts.noData')}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2, fontSize: '16px' }}>
              {t('dashboard.charts.avgCompletionByCategory') || 'Average Completion by Category'}
            </Typography>
            {completionChartData && completionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={completionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} label={{ value: t('common.days') || 'Days', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`${value} ${t('common.days') || 'days'}`, '']}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={250}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>{t('dashboard.charts.noData')}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* {t('dashboard.table.recentCases')} Table */}
      <Paper sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '16px' }}>
            {t('dashboard.table.recentCases')}
          </Typography>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/staff/cases')}
            sx={{
              color: '#3b82f6',
              textDecoration: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {t('dashboard.table.viewAll')}
          </Link>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '11px', textTransform: 'uppercase', py: 1.5 }}>
                  {t('dashboard.table.caseId')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '11px', textTransform: 'uppercase', py: 1.5 }}>
                  {t('dashboard.table.customer')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '11px', textTransform: 'uppercase', py: 1.5 }}>
                  {t('dashboard.table.product')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '11px', textTransform: 'uppercase', py: 1.5 }}>
                  {t('dashboard.table.status')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '11px', textTransform: 'uppercase', py: 1.5 }}>
                  {t('dashboard.table.priority')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '11px', textTransform: 'uppercase', py: 1.5 }}>
                  {t('dashboard.table.technician')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '11px', textTransform: 'uppercase', py: 1.5 }}>
                  {t('dashboard.table.deadline')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '11px', textTransform: 'uppercase', py: 1.5 }}>
                  {t('dashboard.table.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(!recentCases || recentCases.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                    {t('dashboard.table.noRecentCases') || 'No recent cases'}
                  </TableCell>
                </TableRow>
              ) : (
                recentCases.slice(0, 5).map((caseItem) => (
                <TableRow key={caseItem.id} hover>
                  <TableCell sx={{ py: 1.5 }}>
                    <Link
                      component="button"
                      onClick={() => navigate(`/staff/cases/${caseItem.id}`)}
                      sx={{
                        color: '#3b82f6',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: '13px',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      #{caseItem.case_number}
                    </Link>
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: '#3b82f6',
                          fontSize: '12px',
                        }}
                      >
                        {caseItem.customer_name?.[0] || 'C'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b', fontSize: '13px' }}>
                          {caseItem.customer_name} {caseItem.customer_last_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
                          {caseItem.customer_phone}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Typography variant="body2" sx={{ color: '#1e293b', fontSize: '13px' }}>
                      {caseItem.product_title || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: getStatusColor(getStatusFromLevel(caseItem.status_level)),
                        }}
                      />
                      <Typography variant="body2" sx={{ color: '#1e293b', textTransform: 'capitalize', fontSize: '13px' }}>
                        {getStatusFromLevel(caseItem.status_level)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Chip
                      label={caseItem.priority || 'Normal'}
                      size="small"
                      sx={{
                        bgcolor: getPriorityColor(caseItem.priority) === '#ef4444' ? '#fee2e2' : '#f1f5f9',
                        color: getPriorityColor(caseItem.priority),
                        fontWeight: 500,
                        fontSize: '10px',
                        height: 22,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Typography variant="body2" sx={{ color: '#1e293b', fontSize: '13px' }}>
                      {caseItem.technician?.name || t('dashboard.table.unassigned')}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    {isOverdue(caseItem.deadline_at, caseItem.status_level) ? (
                      <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 500, fontSize: '13px' }}>
                        ▲ {t('dashboard.table.overdue')}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
                        {formatDate(caseItem.deadline_at)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/staff/cases/${caseItem.id}`)}
                      sx={{ color: '#64748b' }}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default DashboardPage;
