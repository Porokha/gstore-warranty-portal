import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import {
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Popover,
  Select,
  TextField,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import { casesService } from '../../services/casesService';
import { useAuth } from '../../contexts/AuthContext';
import { hasFinanceStatisticsAccess, isManagementRole } from '../../utils/roles';
import CaseQuickViewDialog from '../../components/cases/CaseQuickViewDialog';

const STATUS_COLORS = {
  completed: '#1aa078',
  opened: '#eae7f2',
  investigating: '#2563eb',
  pending: '#d2691e',
};

const STATUS_LEVELS = {
  1: 'opened',
  2: 'investigating',
  3: 'pending',
  4: 'completed',
};

const deviceLabel = (name, language) => {
  const labels = {
    Phone: ['სმარტფონები', 'Smartphones'],
    Smartphone: ['სმარტფონები', 'Smartphones'],
    Laptop: ['ლეპტოპები', 'Laptops'],
    Tablet: ['ტაბლეტები', 'Tablets'],
    Desktop: ['დესკტოპები', 'Desktops'],
    Wearable: ['ტარებადი', 'Wearables'],
    Accessory: ['აქსესუარები', 'Accessories'],
  };
  return labels[name]?.[language === 'ka' ? 0 : 1] || name;
};

const DashboardKpi = ({ icon, tone, label, value, details, onClick }) => (
  <button className="zzv-staff-kpi" type="button" onClick={onClick}>
    <span className="zzv-staff-kpi__head">
      <span className={'zzv-staff-kpi__icon zzv-staff-kpi__icon--' + tone}>
        <img src={'/figma-staff/kpi-' + icon + '.svg'} width="20" height="20" alt="" />
      </span>
      <span>{label}</span>
    </span>
    <strong className="zzv-staff-kpi__value">{value}</strong>
    <span className="zzv-staff-kpi__details">
      {details.map((detail) => (
        <span className="zzv-staff-kpi__detail" key={detail.label}>
          <strong style={{ color: detail.color }}>{detail.value}</strong>
          <span>{detail.label}</span>
        </span>
      ))}
    </span>
  </button>
);

const BarPanel = ({ title, data, color, emptyLabel, suffix }) => (
  <section className="zzv-staff-chart">
    <h2>{title}</h2>
    {data.length > 0 ? (
      <div className="zzv-staff-chart__plot">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#eae7f2" strokeDasharray="3 3" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#5b5670', fontSize: 12 }} interval={0} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9c97ae', fontSize: 11 }} width={38} />
            <Tooltip
              cursor={{ fill: '#f6f4fb' }}
              formatter={(value) => [suffix ? value + ' ' + suffix : value, title]}
              contentStyle={{ border: '1px solid #eae7f2', borderRadius: 8, fontFamily: 'Google Sans', fontSize: 12 }}
            />
            <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    ) : <div className="zzv-staff-chart__empty">{emptyLabel}</div>}
  </section>
);

const DashboardPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = isManagementRole(user?.role);
  const canViewFinance = hasFinanceStatisticsAccess(user?.role);
  const locale = i18n.resolvedLanguage === 'ka' ? 'ka-GE' : 'en-US';
  const number = (value) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value || 0);
  const [timeFilter, setTimeFilter] = useState('30');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [appliedStart, setAppliedStart] = useState('');
  const [appliedEnd, setAppliedEnd] = useState('');
  const [previewCaseId, setPreviewCaseId] = useState(null);
  const filterButtonRef = useRef(null);

  const getRange = () => {
    if (timeFilter === 'custom' && appliedStart && appliedEnd) {
      return {
        start: new Date(appliedStart + 'T00:00:00'),
        end: new Date(appliedEnd + 'T23:59:59'),
      };
    }
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - Number(timeFilter));
    return { start, end };
  };
  const range = getRange();
  const queryKey = [timeFilter, appliedStart, appliedEnd];

  const { data: stats, isLoading, isError } = useQuery(
    ['dashboard-stats', ...queryKey],
    () => dashboardService.getStats(range.start, range.end),
    { refetchInterval: 30000 },
  );
  const { data: statusChartData = [] } = useQuery(
    ['dashboard-status', ...queryKey],
    () => dashboardService.getCasesByStatus(range.start, range.end),
    { refetchInterval: 30000 },
  );
  const { data: completionChartData = [] } = useQuery(
    ['dashboard-completion', ...queryKey],
    () => dashboardService.getCompletionTimeByDevice(range.start, range.end),
    { refetchInterval: 30000 },
  );
  const { data: casesByCategory = [] } = useQuery(
    ['dashboard-category', ...queryKey],
    () => dashboardService.getCasesByCategory(range.start, range.end),
    { refetchInterval: 30000 },
  );
  const { data: recentCases = [], isLoading: casesLoading } = useQuery(
    'recent-cases',
    () => casesService.getAll({ limit: 5, sort: 'opened_at', order: 'DESC' }),
    {
      refetchInterval: 30000,
      select: (data) => Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [],
    },
  );

  const realTime = stats?.realTime || {};
  const period = stats?.timeFiltered || {};
  const loadingValue = isLoading ? '…' : isError ? '—' : null;
  const completedCount = Number(period.closedCases || 0);
  const onTimePercent = completedCount ? Math.round((Number(period.onTimeCases || 0) / completedCount) * 1000) / 10 : 0;
  const activeCount = Number(period.activeWarranties || 0);
  const expiredCount = Number(period.expiredWarranties || 0);
  const activeShare = activeCount + expiredCount ? Math.round(activeCount / (activeCount + expiredCount) * 100) : 0;
  const totalPaid = Number(period.totalMoneyIn || 0);
  const totalPayments = Number(period.totalPayments || 0);
  const chartRows = (rows) => (Array.isArray(rows) ? rows : [])
    .filter((item) => Number(item.value) > 0)
    .map((item) => ({ ...item, label: deviceLabel(item.name, i18n.resolvedLanguage) }));
  const completionRows = chartRows(completionChartData);
  const categoryRows = chartRows(casesByCategory);
  const statusRows = (Array.isArray(statusChartData) ? statusChartData : [])
    .map((item) => ({
      ...item,
      status: String(item.name || '').toLowerCase(),
      value: Number(item.value || 0),
    }))
    .filter((item) => item.value > 0);
  const statusTotal = statusRows.reduce((sum, item) => sum + item.value, 0);

  const openCustomFilter = () => setFilterAnchor(filterButtonRef.current);
  const selectPeriod = (event) => {
    if (event.target.value === 'custom') {
      openCustomFilter();
      return;
    }
    setTimeFilter(event.target.value);
    setCustomStart('');
    setCustomEnd('');
    setAppliedStart('');
    setAppliedEnd('');
  };
  const applyCustomFilter = () => {
    if (!customStart || !customEnd || customStart > customEnd) return;
    setAppliedStart(customStart);
    setAppliedEnd(customEnd);
    setTimeFilter('custom');
    setFilterAnchor(null);
  };
  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date).replaceAll('/', '.');
  };

  return (
    <div className="zzv-figma-staff-dashboard">
      <header className="zzv-figma-staff-dashboard__head">
        <div>
          <h1>{t('dashboard.title')}</h1>
          <p>{t('dashboard.welcome')}</p>
        </div>
        <div className="zzv-figma-staff-dashboard__controls">
          <Select
            value={timeFilter}
            onChange={selectPeriod}
            size="small"
            aria-label={t('dashboard.filters.customDateRange')}
            className="zzv-figma-staff-dashboard__period"
            IconComponent={() => <img src="/figma-staff/select-chevron.svg" width="20" height="20" alt="" />}
          >
            <MenuItem value="7">{t('dashboard.filters.last7')}</MenuItem>
            <MenuItem value="30">{t('dashboard.filters.last30')}</MenuItem>
            <MenuItem value="90">{t('dashboard.filters.last90')}</MenuItem>
            <MenuItem value="custom">{t('dashboard.filters.customRange')}</MenuItem>
          </Select>
          <IconButton ref={filterButtonRef} onClick={openCustomFilter} aria-label={t('dashboard.filters.customDateRange')} className="zzv-figma-staff-dashboard__filter">
            <img src="/figma-staff/filter.svg" width="16" height="16" alt="" />
          </IconButton>
        </div>
      </header>
      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <div className="zzv-figma-staff-dashboard__date-filter">
          <strong>{t('dashboard.filters.customDateRange')}</strong>
          <TextField label={t('dashboard.filters.startDate')} type="date" size="small" value={customStart} onChange={(event) => setCustomStart(event.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label={t('dashboard.filters.endDate')} type="date" size="small" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} InputLabelProps={{ shrink: true }} />
          <Button variant="contained" onClick={applyCustomFilter} disabled={!customStart || !customEnd || customStart > customEnd}>{t('dashboard.filters.apply')}</Button>
        </div>
      </Popover>

      {isError && <p className="zzv-figma-staff-dashboard__error" role="alert">{t('dashboard.loadError')}</p>}

      <div className="zzv-staff-kpis">
        <DashboardKpi
          icon="cases" tone="purple" label={t('dashboard.cards.openCases')}
          value={loadingValue ?? number(realTime.openCases)}
          onClick={() => navigate('/staff/cases')}
          details={[
            { value: loadingValue ?? number(realTime.closeToDeadline), label: t('dashboard.cards.closeToDeadline'), color: '#d2691e' },
            { value: loadingValue ?? number(realTime.dueCases), label: t('dashboard.cards.dueCases'), color: '#dc4a4a' },
          ]}
        />
        {canManage && (
          <DashboardKpi
            icon="warranties" tone="blue" label={t('dashboard.cards.activeWarranties')}
            value={loadingValue ?? number(activeCount)}
            onClick={() => navigate('/staff/warranties?status=active')}
            details={[
              { value: loadingValue ?? number(expiredCount), label: t('dashboard.cards.expiredShort'), color: '#9c97ae' },
              { value: loadingValue ?? activeShare + '%', label: t('dashboard.cards.activeShare'), color: '#2563eb' },
            ]}
          />
        )}
        <DashboardKpi
          icon="completed" tone="green" label={t('dashboard.cards.completedInPeriod')}
          value={loadingValue ?? number(completedCount)}
          onClick={() => navigate('/staff/cases/closed')}
          details={[
            { value: loadingValue ?? number(period.avgCompletionTime), label: t('dashboard.kpi.avgTimeShort'), color: '#14121c' },
            { value: loadingValue ?? onTimePercent + '%', label: t('dashboard.kpi.onTimePerformance'), color: '#1aa078' },
          ]}
        />
        {canViewFinance && (
          <DashboardKpi
            icon="payments" tone="purple" label={t('dashboard.cards.payments')}
            value={loadingValue ?? '₾' + number(totalPaid)}
            onClick={() => navigate('/staff/finance')}
            details={[
              { value: loadingValue ?? number(totalPayments), label: t('dashboard.cards.paidPayments'), color: '#1aa078' },
              { value: loadingValue ?? '₾' + number(totalPayments ? totalPaid / totalPayments : 0), label: t('dashboard.cards.averagePayment'), color: '#d2691e' },
            ]}
          />
        )}
      </div>

      <div className="zzv-staff-chart-grid">
        <BarPanel title={t('dashboard.charts.completionTime')} data={completionRows} color="#7c4df5" emptyLabel={t('dashboard.charts.noData')} suffix={t('common.days')} />
        <section className="zzv-staff-chart">
          <h2>{t('dashboard.charts.casesByStatus')}</h2>
          {statusRows.length ? (
            <div className="zzv-staff-status-chart">
              <div className="zzv-staff-status-chart__donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusRows} dataKey="value" cx="50%" cy="50%" innerRadius={65} outerRadius={90} startAngle={90} endAngle={-270} stroke="none">
                      {statusRows.map((item) => <Cell key={item.status} fill={STATUS_COLORS[item.status] || '#9c97ae'} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [value, t('dashboard.table.status')]} />
                  </PieChart>
                </ResponsiveContainer>
                <span><strong>{number(statusTotal)}</strong><small>{t('dashboard.casesCount')}</small></span>
              </div>
              <div className="zzv-staff-status-chart__legend">
                {statusRows.map((item) => (
                  <div key={item.status}>
                    <span className="zzv-staff-status-chart__dot" style={{ background: STATUS_COLORS[item.status] || '#9c97ae' }} />
                    <span>{t('status.' + item.status, { defaultValue: item.name })}</span>
                    <strong>{Math.round(item.value / statusTotal * 100)}%</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="zzv-staff-chart__empty">{t('dashboard.charts.noData')}</div>}
        </section>
        <BarPanel title={t('dashboard.charts.casesByCategory')} data={categoryRows} color="#7c4df5" emptyLabel={t('dashboard.charts.noData')} />
        <BarPanel title={t('dashboard.charts.avgCompletionByCategory')} data={completionRows} color="#1aa078" emptyLabel={t('dashboard.charts.noData')} suffix={t('common.days')} />
      </div>

      <section className="zzv-staff-recent">
        <header>
          <h2>{t('dashboard.table.recentCases')}</h2>
          <button type="button" onClick={() => navigate('/staff/cases')}>{t('dashboard.table.viewAll')}</button>
        </header>
        <div className="zzv-staff-recent__scroll">
          <table>
            <thead><tr>
              {['caseId', 'customer', 'product', 'status', 'priority', 'technician', 'deadline', 'actions'].map((key) => <th key={key}>{t('dashboard.table.' + key)}</th>)}
            </tr></thead>
            <tbody>
              {casesLoading ? (
                <tr><td colSpan="8" className="zzv-staff-recent__empty"><CircularProgress size={20} /></td></tr>
              ) : recentCases.length ? recentCases.slice(0, 5).map((caseItem) => {
                const status = STATUS_LEVELS[caseItem.status_level] || 'opened';
                const priority = String(caseItem.priority || 'normal').toLowerCase();
                const overdue = caseItem.deadline_at && caseItem.status_level < 3 && !caseItem.parts_waiting && new Date(caseItem.deadline_at) < new Date();
                return (
                  <tr key={caseItem.id}>
                    <td><button type="button" className="zzv-staff-recent__link" onClick={() => navigate('/staff/cases/' + caseItem.id)}>{caseItem.case_number || caseItem.id}</button></td>
                    <td>{[caseItem.customer_name, caseItem.customer_last_name].filter(Boolean).join(' ') || '—'}</td>
                    <td title={caseItem.product_title || ''}>{caseItem.product_title || '—'}</td>
                    <td><span className={'zzv-staff-recent__badge zzv-staff-recent__badge--' + status}>{t('status.' + status)}</span></td>
                    <td><span className={'zzv-staff-recent__priority zzv-staff-recent__priority--' + priority}>{t('dashboard.priority.' + priority, { defaultValue: caseItem.priority || 'Normal' })}</span></td>
                    <td>{[caseItem.assigned_technician?.name, caseItem.assigned_technician?.last_name].filter(Boolean).join(' ') || t('dashboard.table.unassigned')}</td>
                    <td className={overdue ? 'is-overdue' : ''}>{overdue ? '↑ ' + t('dashboard.table.overdue') : formatDate(caseItem.deadline_at)}</td>
                    <td><button type="button" className="zzv-staff-recent__view" onClick={() => setPreviewCaseId(caseItem.id)} aria-label={t('dashboard.openCase', { number: caseItem.case_number || caseItem.id })}><img src="/figma-staff/table-view.svg" width="16" height="16" alt="" /></button></td>
                  </tr>
                );
              }) : <tr><td colSpan="8" className="zzv-staff-recent__empty">{t('dashboard.table.noRecentCases')}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <CaseQuickViewDialog caseId={previewCaseId} onClose={() => setPreviewCaseId(null)} />
    </div>
  );
};

export default DashboardPage;
