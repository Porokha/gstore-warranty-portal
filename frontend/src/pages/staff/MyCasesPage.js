import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  FolderOpen as ActiveCasesIcon,
  WarningAmber as DueCasesIcon,
  CheckCircle as CompletedCasesIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { casesService } from '../../services/casesService';
import StatusBar from '../../components/cases/StatusBar';
import ResultBar from '../../components/cases/ResultBar';
import CustomDataTable from '../../components/common/CustomDataTable';

const metricCardSx = {
  p: 2.5,
  borderRadius: 4,
  border: '1px solid rgba(165, 118, 255, 0.16)',
  boxShadow: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  cursor: 'pointer',
  transition: 'border-color 0.2s ease, transform 0.2s ease',
  '&:hover': {
    borderColor: 'rgba(165, 118, 255, 0.42)',
    transform: 'translateY(-1px)',
  },
};

const metricIconWrapSx = {
  width: 52,
  height: 52,
  borderRadius: 3,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const MyCasesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const technicianId = user?.id;

  const activeFilters = useMemo(
    () => ({ technician_id: technicianId, status: [1, 2, 3] }),
    [technicianId],
  );
  const dueFilters = useMemo(
    () => ({ technician_id: technicianId, due: true }),
    [technicianId],
  );
  const completedFilters = useMemo(
    () => ({ technician_id: technicianId, status: 4 }),
    [technicianId],
  );
  const allFilters = useMemo(
    () => ({ technician_id: technicianId }),
    [technicianId],
  );

  const { data: activeCases, isLoading: isLoadingActive } = useQuery(
    ['technician-cases', 'active', technicianId],
    () => casesService.getAll(activeFilters),
    { enabled: Boolean(technicianId) },
  );

  const { data: dueCases, isLoading: isLoadingDue } = useQuery(
    ['technician-cases', 'due', technicianId],
    () => casesService.getAll(dueFilters),
    { enabled: Boolean(technicianId) },
  );

  const { data: completedCases, isLoading: isLoadingCompleted } = useQuery(
    ['technician-cases', 'completed', technicianId],
    () => casesService.getAll(completedFilters),
    { enabled: Boolean(technicianId) },
  );

  const { data: allCases, isLoading: isLoadingAll } = useQuery(
    ['technician-cases', 'all', technicianId],
    () => casesService.getAll(allFilters),
    { enabled: Boolean(technicianId) },
  );

  const normalizeCases = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
  };

  const rows = useMemo(
    () =>
      normalizeCases(allCases).map((case_) => ({
        ...case_,
        id: case_.id,
        customerFullName: `${case_.customer_name || ''} ${case_.customer_last_name || ''}`.trim(),
      })),
    [allCases],
  );

  const columns = useMemo(
    () => [
      {
        key: 'case_number',
        label: t('case.caseNumber'),
        width: 170,
      },
      {
        key: 'product_title',
        label: t('case.productTitle'),
        width: 220,
      },
      {
        key: 'customerFullName',
        label: t('case.customerName'),
        width: 210,
      },
      {
        key: 'customer_phone',
        label: t('case.phone'),
        width: 150,
      },
      {
        key: 'status_level',
        label: t('common.status'),
        width: 150,
        render: (row) => <StatusBar statusLevel={row.status_level} size="small" />,
      },
      {
        key: 'result_type',
        label: t('common.result'),
        width: 150,
        render: (row) =>
          row.result_type ? <ResultBar resultType={row.result_type} size="small" /> : '-',
      },
      {
        key: 'deadline_at',
        label: t('case.deadline'),
        width: 160,
        value: (row) => (row.deadline_at ? new Date(row.deadline_at).toLocaleDateString() : '-'),
      },
      {
        key: 'actions',
        label: t('common.actions') || 'Actions',
        width: 100,
        render: (row) => (
          <Tooltip title={t('common.view')}>
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/staff/cases/${row.id}`);
              }}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [navigate, t],
  );

  if (isLoadingActive || isLoadingDue || isLoadingCompleted || isLoadingAll) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const activeCount = normalizeCases(activeCases).length;
  const dueCount = normalizeCases(dueCases).length;
  const completedCount = normalizeCases(completedCases).length;

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          {t('common.myServiceCases') || 'My Service Cases'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('dashboard.welcome')}
        </Typography>
      </Box>

      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={4}>
          <Paper
            sx={metricCardSx}
            onClick={() => navigate('/staff/cases?technician_id=' + technicianId + '&status=1,2,3')}
          >
            <Box sx={{ ...metricIconWrapSx, bgcolor: 'rgba(165, 118, 255, 0.14)', color: '#8f5ef0' }}>
              <ActiveCasesIcon />
            </Box>
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                {t('common.openCases')}
              </Typography>
              <Typography variant="h5">{activeCount}</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={metricCardSx}
            onClick={() => navigate('/staff/cases?technician_id=' + technicianId + '&due=true')}
          >
            <Box sx={{ ...metricIconWrapSx, bgcolor: 'rgba(245, 158, 11, 0.14)', color: '#d97706' }}>
              <DueCasesIcon />
            </Box>
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                {t('dashboard.overdueCases')}
              </Typography>
              <Typography variant="h5">{dueCount}</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={metricCardSx}
            onClick={() => navigate('/staff/cases?technician_id=' + technicianId + '&status=4')}
          >
            <Box sx={{ ...metricIconWrapSx, bgcolor: 'rgba(34, 197, 94, 0.14)', color: '#16a34a' }}>
              <CompletedCasesIcon />
            </Box>
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                {t('dashboard.closedCases')}
              </Typography>
              <Typography variant="h5">{completedCount}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <CustomDataTable
        title={t('common.myServiceCases') || 'My Service Cases'}
        subtitle={t('case.caseListSubtitle') || 'Cases currently assigned to you'}
        columns={columns}
        data={rows}
        onRowClick={(row) => navigate(`/staff/cases/${row.id}`)}
        emptyMessage={t('case.noCasesFound') || 'No cases found'}
        searchable={false}
        exportable={false}
        selectable={false}
        defaultRowsPerPage={10}
      />
    </Box>
  );
};

export default MyCasesPage;
