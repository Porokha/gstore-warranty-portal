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
} from '@mui/icons-material';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import { casesService } from '../../services/casesService';

const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('30');

  const { data: stats, isLoading } = useQuery(
    ['dashboard', timeFilter],
    () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - parseInt(timeFilter));
      return dashboardService.getStats(start, end);
    },
    {
      refetchInterval: 30000,
    }
  );

  const { data: recentCases } = useQuery(
    'recent-cases',
    () => casesService.getAll({ limit: 5, sort: 'created_at', order: 'DESC' }),
    {
      refetchInterval: 30000,
    }
  );

  const realTime = stats?.realTime || {};
  const timeFiltered = stats?.timeFiltered || {};

  // Chart data
  const completionTimeData = [
    { name: 'Smartphones', value: 3.5 },
    { name: 'Laptops', value: 5.0 },
    { name: 'Tablets', value: 4.0 },
    { name: 'Wearables', value: 3.0 },
    { name: 'Accessories', value: 3.5 },
  ];

  const statusData = [
    { name: 'Completed', value: 44, color: '#10b981' },
    { name: 'Investigating', value: 23, color: '#f59e0b' },
    { name: 'Pending', value: 18, color: '#3b82f6' },
    { name: 'Opened', value: 15, color: '#8b5cf6' },
  ];

  const getStatusColor = (status) => {
    const statusMap = {
      'opened': '#8b5cf6',
      'investigating': '#f59e0b',
      'pending': '#3b82f6',
      'completed': '#10b981',
    };
    return statusMap[status?.toLowerCase()] || '#64748b';
  };

  const getPriorityColor = (priority) => {
    const priorityMap = {
      'high': '#ef4444',
      'normal': '#64748b',
      'low': '#10b981',
    };
    return priorityMap[priority?.toLowerCase()] || '#64748b';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <Box>
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Welcome back, here's what's happening today.
        </Typography>
      </Box>

      {/* Summary Cards Row 1 */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: '#3b82f6',
              color: '#ffffff',
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              '&:hover': { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
            }}
            onClick={() => navigate('/staff/cases')}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <FolderIcon sx={{ fontSize: 32, opacity: 0.9 }} />
                <Chip label="Active" size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {realTime.openCases || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Open Service Cases
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: '#f59e0b',
              color: '#ffffff',
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              '&:hover': { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
            }}
            onClick={() => navigate('/staff/cases?closeToDeadline=true')}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <CalendarIcon sx={{ fontSize: 32, opacity: 0.9 }} />
                <Chip label="Due Soon" size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {realTime.closeToDeadline || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Cases Close to Deadline
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: '#ef4444',
              color: '#ffffff',
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              '&:hover': { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
            }}
            onClick={() => navigate('/staff/cases?due=true')}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <WarningIcon sx={{ fontSize: 32, opacity: 0.9 }} />
                <Chip label="Urgent" size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {realTime.dueCases || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Overdue Cases
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: '#10b981',
              color: '#ffffff',
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              '&:hover': { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
            }}
            onClick={() => navigate('/staff/cases/closed')}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <CheckCircleIcon sx={{ fontSize: 32, opacity: 0.9 }} />
                <Chip label="Completed" size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {timeFiltered.closedCases || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Closed This Month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Summary Cards Row 2 */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              bgcolor: '#10b981',
              color: '#ffffff',
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              '&:hover': { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
            }}
            onClick={() => navigate('/staff/warranties?status=active')}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <WarrantyIcon sx={{ fontSize: 32, opacity: 0.9 }} />
                <Chip label="Active" size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {timeFiltered.activeWarranties || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Active Warranties
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              bgcolor: '#64748b',
              color: '#ffffff',
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              '&:hover': { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
            }}
            onClick={() => navigate('/staff/warranties?status=expired')}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <WarrantyIcon sx={{ fontSize: 32, opacity: 0.9 }} />
                <Chip label="Expired" size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {timeFiltered.expiredWarranties || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Expired Warranties
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              bgcolor: '#8b5cf6',
              color: '#ffffff',
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              '&:hover': { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
            }}
            onClick={() => navigate('/staff/finance')}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <PaymentIcon sx={{ fontSize: 32, opacity: 0.9 }} />
                <Chip label="Revenue" size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                ₾{timeFiltered.totalMoneyIn?.toFixed(0) || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Payments This Month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                Service Completion Time
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  IconComponent={ArrowDropDownIcon}
                  sx={{ fontSize: '14px' }}
                >
                  <MenuItem value="7">Last 7 Days</MenuItem>
                  <MenuItem value="30">Last 30 Days</MenuItem>
                  <MenuItem value="90">Last 90 Days</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={completionTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
              Cases by Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Box display="flex" justifyContent="center" gap={2} mt={2} flexWrap="wrap">
              {statusData.map((item, index) => (
                <Box key={index} display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: item.color,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '12px' }}>
                    {item.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* KPI Section */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                Average Service Time
              </Typography>
              <TrendingDownIcon sx={{ color: '#10b981', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
              {timeFiltered.avgCompletionTime?.toFixed(1) || 0} days
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                12% faster
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                vs last month
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                On-Time Performance
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
              87.5%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={87.5}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: '#e2e8f0',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#10b981',
                  borderRadius: 4,
                },
              }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                Customer Satisfaction
              </Typography>
              <StarIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
              4.6/5.0
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <TrendingUpIcon sx={{ color: '#10b981', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                0.3 points
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                vs last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Service Cases Table */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
            Recent Service Cases
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
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            View All
          </Link>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                  CASE ID
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                  CUSTOMER
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                  PRODUCT
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                  STATUS
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                  PRIORITY
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                  TECHNICIAN
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                  DEADLINE
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentCases?.data?.slice(0, 4).map((caseItem) => (
                <TableRow key={caseItem.id} hover>
                  <TableCell>
                    <Link
                      component="button"
                      onClick={() => navigate(`/staff/cases/${caseItem.id}`)}
                      sx={{
                        color: '#3b82f6',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        fontWeight: 500,
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      #{caseItem.case_number}
                    </Link>
                  </TableCell>
                  <TableCell>
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
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                          {caseItem.customer_name} {caseItem.customer_last_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
                          {caseItem.customer_phone}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#1e293b' }}>
                      {caseItem.product_title || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: getStatusColor(caseItem.status),
                        }}
                      />
                      <Typography variant="body2" sx={{ color: '#1e293b', textTransform: 'capitalize' }}>
                        {caseItem.status || 'Opened'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={caseItem.priority || 'Normal'}
                      size="small"
                      sx={{
                        bgcolor: getPriorityColor(caseItem.priority) === '#ef4444' ? '#fee2e2' : '#f1f5f9',
                        color: getPriorityColor(caseItem.priority),
                        fontWeight: 500,
                        fontSize: '11px',
                        height: 24,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#1e293b' }}>
                      {caseItem.technician?.name || 'Unassigned'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {isOverdue(caseItem.deadline_at) ? (
                      <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 500 }}>
                        ▲ Overdue
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {formatDate(caseItem.deadline_at)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/staff/cases/${caseItem.id}`)}
                      sx={{ color: '#64748b' }}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default DashboardPage;
