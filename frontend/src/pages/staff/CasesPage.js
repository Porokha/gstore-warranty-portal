import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from 'react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { casesService } from '../../services/casesService';
import CaseQuickViewDialog from '../../components/cases/CaseQuickViewDialog';
import StaffDeleteDialog from '../../components/common/StaffDeleteDialog';
import { useAuth } from '../../contexts/AuthContext';

const icon = (name) => `/figma-staff/case-${name}.svg`;
const scopes = ['all', 'standard', 'partner'];
const periods = ['all', 'today', 'yesterday', 'last30'];
const sizes = [25, 50, 100, 250];

const apiDate = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
const periodDates = (period) => {
  if (period === 'all') return {};
  const start = new Date();
  const end = new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  if (period === 'yesterday') {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
  } else if (period === 'last30') start.setDate(start.getDate() - 29);
  return { start_date: apiDate(start), end_date: apiDate(end) };
};
const dateText = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-GB');
};
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const CasesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [params, setParams] = useSearchParams();
  const dashboardFilter = params.get('closeToDeadline') || params.get('due');
  const [filters, setFilters] = useState({
    case_scope: params.get('case_scope') || 'all',
    status: params.get('status') || '',
    result: params.get('result') || '',
    priority: params.get('priority') || '',
    device_type: params.get('device_type') || '',
    technician_id: params.get('technician_id') || '',
    search: params.get('search') || '',
    customer: params.get('customer') || '',
    time_range: params.get('time_range') || (dashboardFilter ? 'all' : 'today'),
    closeToDeadline: params.get('closeToDeadline') === 'true',
    due: params.get('due') === 'true',
  });
  const [advanced, setAdvanced] = useState(Boolean(filters.customer || filters.technician_id));
  const [selected, setSelected] = useState([]);
  const [previewCaseId, setPreviewCaseId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem('cases-table_pageSize');
    if (saved === 'all') return 'all';
    const stored = Number(saved);
    return sizes.includes(stored) ? stored : 25;
  });
  const queryFilters = useMemo(() => {
    const { case_scope, time_range, ...rest } = filters;
    return filters.search.trim() ? rest : { ...rest, ...periodDates(time_range) };
  }, [filters]);
  const { data, isLoading, isFetching, isError } = useQuery(
    ['cases', queryFilters],
    () => casesService.getAll(queryFilters),
    { keepPreviousData: true },
  );
  const allRows = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.data)) return data.data.data;
    return [];
  }, [data]);
  const rows = useMemo(() => allRows.filter((row) => filters.case_scope === 'all'
    || (filters.case_scope === 'partner' ? row.case_type === 'partner' : row.case_type !== 'partner')), [allRows, filters.case_scope]);
  const allAllowed = rows.length <= 500;
  const effectiveSize = pageSize === 'all' && allAllowed ? Math.max(rows.length, 1) : pageSize === 'all' ? 25 : pageSize;
  const pageCount = Math.max(1, Math.ceil(rows.length / effectiveSize));
  const visible = rows.slice((page - 1) * effectiveSize, page * effectiveSize);
  const selectedPage = visible.length > 0 && visible.every((row) => selected.includes(row.id));
  const hasFilters = Boolean(filters.search || filters.customer || filters.status || filters.result || filters.priority || filters.device_type || filters.technician_id || filters.due || filters.closeToDeadline || filters.time_range !== 'all');

  useEffect(() => { setPage(1); setSelected([]); }, [queryFilters, filters.case_scope]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  useEffect(() => {
    if (pageSize === 'all' && !allAllowed) {
      setPageSize(25);
      localStorage.setItem('cases-table_pageSize', '25');
    }
  }, [allAllowed, pageSize]);

  const changeFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    const nextParams = new URLSearchParams();
    Object.entries(next).forEach(([name, item]) => { if (item && item !== 'false') nextParams.set(name, String(item)); });
    setParams(nextParams, { replace: true });
  };
  const clearFilters = () => {
    const next = { ...filters, search: '', customer: '', status: '', result: '', priority: '', device_type: '', technician_id: '', closeToDeadline: false, due: false, time_range: 'all' };
    setFilters(next);
    setParams(next.case_scope === 'all' ? {} : { case_scope: next.case_scope }, { replace: true });
  };
  const toggleRow = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const togglePage = () => setSelected((current) => selectedPage
    ? current.filter((id) => !visible.some((row) => row.id === id))
    : [...new Set([...current, ...visible.map((row) => row.id)])]);
  const openCase = (id) => navigate(`/staff/cases/${id}${location.search}`);
  const exportSelected = () => {
    const lines = [
      ['Case Number', 'Product', 'Customer', 'Phone', 'Status', 'Priority', 'Technician', 'Deadline'],
      ...allRows.filter((row) => selected.includes(row.id)).map((row) => [
        row.case_number, row.product_title,
        [row.customer_name, row.customer_last_name].filter(Boolean).join(' '),
        row.customer_phone, row.status_level, row.priority,
        [row.assigned_technician?.name, row.assigned_technician?.last_name].filter(Boolean).join(' '),
        dateText(row.deadline_at),
      ]),
    ].map((line) => line.map(csvCell).join(','));
    const url = URL.createObjectURL(new Blob([`\ufeff${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `cases-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const deleteSelected = async () => {
    if (!isAdmin || deletePending || selected.length === 0) return;
    setDeletePending(true);
    setDeleteError('');
    const deletedIds = [];
    try {
      for (const id of selected) {
        await casesService.delete(id);
        deletedIds.push(id);
      }
      setDeleteOpen(false);
    } catch (error) {
      setDeleteError(error.response?.data?.message || t('case.bulkDeleteFailed'));
    } finally {
      if (deletedIds.length) {
        setSelected((current) => current.filter((id) => !deletedIds.includes(id)));
        await queryClient.invalidateQueries('cases');
      }
      setDeletePending(false);
    }
  };
  const filterSelect = (label, key, options) => (
    <label className="zzv-case-list__select">
      <span className="zzv-case-list__sr-only">{label}</span>
      <select value={filters[key]} onChange={(event) => changeFilter(key, event.target.value)} aria-label={label}>
        <option value="">{label}: {t('common.all')}</option>
        {options.map(([value, text]) => <option value={value} key={value}>{text}</option>)}
      </select>
      <img src={icon('select')} alt="" />
    </label>
  );

  return <main className="zzv-case-list"><section className="zzv-case-list__card">
    <header className="zzv-case-list__head">
      <div><h1>{t('common.openCases')}</h1><p>{t('case.listSubtitle')}</p></div>
      <div className="zzv-case-list__head-actions">
        {isAdmin && <button type="button" className="zzv-case-list__button zzv-case-list__button--secondary" onClick={() => navigate('/staff/import')}><img src={icon('import')} alt="" />{t('common.importCSV')}</button>}
        <button type="button" className="zzv-case-list__button zzv-case-list__button--primary" onClick={() => navigate('/staff/cases/new')}><img src={icon('plus')} alt="" />{t('case.newCase')}</button>
      </div>
    </header>
    <nav className="zzv-case-list__tabs" aria-label={t('case.caseType')}>
        {scopes.map((scope) => <button key={scope} type="button" className={filters.case_scope === scope ? 'is-active' : ''} onClick={() => changeFilter('case_scope', scope)}>
        {t(scope === 'all' ? 'case.listAll' : scope === 'partner' ? 'case.listPartner' : 'case.listStandard')}
        <span>{scope === 'all' ? allRows.length : allRows.filter((row) => scope === 'partner' ? row.case_type === 'partner' : row.case_type !== 'partner').length}</span>
      </button>)}
    </nav>
    <div className="zzv-case-list__search"><img src={icon('search')} alt="" /><input type="search" value={filters.search} onChange={(event) => changeFilter('search', event.target.value)} placeholder={t('case.listSearchPlaceholder')} aria-label={t('common.search')} />{isFetching && !isLoading && <CircularProgress size={16} />}</div>
    <div className="zzv-case-list__toolbar">
      <div className="zzv-case-list__time" role="group" aria-label={t('case.timeFilter')}>
        {periods.map((period) => <button key={period} type="button" className={filters.time_range === period ? 'is-active' : ''} onClick={() => changeFilter('time_range', period)}>{t(period === 'all' ? 'case.timeAll' : period === 'today' ? 'case.timeToday' : period === 'yesterday' ? 'case.timeYesterday' : 'case.timeLast30')}</button>)}
      </div>
      <div className="zzv-case-list__filters">
        {filterSelect(t('case.deviceType'), 'device_type', [['Phone', t('case.devicePhone')], ['Tablet', t('case.deviceTablet')], ['Laptop', t('case.deviceLaptop')], ['Desktop', t('case.deviceDesktop')]])}
        {filterSelect(t('common.status'), 'status', [['1', t('status.opened')], ['2', t('status.investigating')], ['3', t('status.pending')], ['4', t('status.completed')]])}
        {filterSelect(t('common.result'), 'result', [['covered', t('result.covered')], ['payable', t('result.payable')], ['returned', t('result.returned')], ['replaceable', t('result.replaceable')]])}
        {filterSelect(t('common.priority'), 'priority', [['low', t('dashboard.priority.low')], ['normal', t('dashboard.priority.normal')], ['high', t('dashboard.priority.high')], ['critical', t('dashboard.priority.critical')]])}
        <button type="button" className="zzv-case-list__more" onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>{t('case.moreFilters')}</button>
      </div>
    </div>
    {advanced && <div className="zzv-case-list__advanced">
      <label>{t('case.customerName')}<input value={filters.customer} onChange={(event) => changeFilter('customer', event.target.value)} /></label>
      <label>{t('case.technicianId')}<input type="number" value={filters.technician_id} onChange={(event) => changeFilter('technician_id', event.target.value)} /></label>
      {(filters.closeToDeadline || filters.due) && <button type="button" onClick={clearFilters}>{t('case.clearFilters')}</button>}
    </div>}
    {filters.search.trim() && <p className="zzv-case-list__hint">{t('case.searchIgnoresTime')}</p>}
    {isError && <div className="zzv-case-list__error" role="alert">{t('common.errorLoading')} <button type="button" onClick={() => queryClient.invalidateQueries('cases')}>{t('case.retry')}</button></div>}
    {selected.length > 0 && <div className="zzv-case-list__selection"><strong>{t('case.selectedCount', { count: selected.length })}</strong><div><button type="button" onClick={exportSelected}>{t('common.export')}</button>{isAdmin && <button type="button" className="is-danger" onClick={() => { setDeleteError(''); setDeleteOpen(true); }}>{t('common.delete')}</button>}<button type="button" aria-label={t('common.clear')} onClick={() => setSelected([])}>×</button></div></div>}
    {isLoading ? <div className="zzv-case-list__loading"><CircularProgress size={28} /></div> : rows.length === 0 ? <div className="zzv-case-list__empty">
      <img src={icon(hasFilters ? 'no-results' : 'empty')} alt="" />
      <h2>{t(hasFilters ? 'case.noResultsTitle' : 'case.emptyTitle')}</h2>
      <p>{t(hasFilters ? 'case.noResultsDescription' : 'case.emptyDescription')}</p>
      <button type="button" className={`zzv-case-list__button zzv-case-list__button--${hasFilters ? 'secondary' : 'primary'}`} onClick={hasFilters ? clearFilters : () => navigate('/staff/cases/new')}>{!hasFilters && <img src={icon('plus')} alt="" />}{t(hasFilters ? 'case.clearFilters' : 'case.newCase')}</button>
    </div> : <>
      <div className="zzv-case-list__table-scroll"><table><thead><tr>
        <th className="zzv-case-list__check"><input type="checkbox" checked={selectedPage} onChange={togglePage} aria-label={t('case.selectPage')} /></th>
        <th>{t('case.listCase')}</th><th>{t('case.listCustomer')}</th><th>{t('case.listDevice')}</th><th>{t('case.statusAndResult')}</th><th>{t('common.priority')}</th><th>{t('case.technician')}</th><th>{t('case.listDeadline')}</th><th>{t('common.actions')}</th>
      </tr></thead><tbody>{visible.map((row) => {
        const overdue = row.status_level < 3 && !row.parts_waiting && new Date(row.deadline_at) < new Date();
        const tech = row.assigned_technician;
        return <tr key={row.id} className={selected.includes(row.id) ? 'is-selected' : ''} onClick={() => openCase(row.id)}>
          <td className="zzv-case-list__check"><input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggleRow(row.id)} onClick={(event) => event.stopPropagation()} aria-label={`${t('case.selectCase')} ${row.case_number}`} /></td>
          <td><strong className="zzv-case-list__mono">{row.case_number}</strong><small>{t('case.openedOn', { date: dateText(row.opened_at) })}</small></td>
          <td><strong>{[row.customer_name, row.customer_last_name].filter(Boolean).join(' ') || row.partner?.name || '-'}</strong><small>{[row.customer_phone, row.customer_email].filter(Boolean).join(' · ') || '-'}</small></td>
          <td><strong>{row.product_title || '-'}</strong><small>{row.order_id ? `#${row.order_id}` : t('case.noOrder')}</small></td>
          <td><span className={`zzv-case-list__badge zzv-case-list__badge--status-${row.status_level}`}>{t(['', 'status.opened', 'status.investigating', 'status.pending', 'status.completed'][row.status_level] || 'common.status')}</span><small>{row.result_type ? t(`result.${row.result_type}`) : '-'}</small></td>
          <td><span className={`zzv-case-list__priority zzv-case-list__priority--${row.priority}`}>{t(`dashboard.priority.${row.priority || 'normal'}`)}</span></td>
          <td>{tech ? <span className="zzv-case-list__technician"><i>{[tech.name, tech.last_name].filter(Boolean).map((name) => name[0]).join('')}</i>{[tech.name, tech.last_name].filter(Boolean).join(' ')}</span> : '-'}</td>
          <td className={overdue ? 'is-overdue' : ''}>{dateText(row.deadline_at)}<small>{overdue ? t('case.overdue') : row.parts_waiting ? t('case.partsWaiting') : ''}</small></td>
          <td><button type="button" className="zzv-case-list__view" aria-label={`${t('common.view')} ${row.case_number}`} onClick={(event) => { event.stopPropagation(); setPreviewCaseId(row.id); }}><img src={icon('eye')} alt="" /></button></td>
        </tr>;
      })}</tbody></table></div>
      <footer className="zzv-case-list__pagination">
        <span>{t('case.rangeOfTotal', { from: (page - 1) * effectiveSize + 1, to: Math.min(page * effectiveSize, rows.length), total: rows.length })}</span>
        <div><label><span className="zzv-case-list__sr-only">{t('case.pageSize')}</span><select value={pageSize} onChange={(event) => { const size = event.target.value === 'all' ? 'all' : Number(event.target.value); setPageSize(size); localStorage.setItem('cases-table_pageSize', String(size)); setPage(1); setSelected([]); }}>{sizes.map((size) => <option key={size} value={size}>{size} {t('case.perPage')}</option>)}<option value="all" disabled={!allAllowed}>{t('case.timeAll')}</option></select></label>
          <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}><img src={icon('back')} alt="" />{t('common.previous')}</button>
          <button type="button" disabled={page === pageCount} onClick={() => setPage(page + 1)}>{t('common.next')}<img src={icon('next')} alt="" /></button></div>
      </footer>
    </>}
  </section>
    <CaseQuickViewDialog caseId={previewCaseId} onClose={() => setPreviewCaseId(null)} detailPath={previewCaseId ? `/staff/cases/${previewCaseId}${location.search}` : undefined} />
    <StaffDeleteDialog
      open={deleteOpen}
      title={t('case.deleteSelectedTitle')}
      description={t('case.confirmDeleteSelected', { count: selected.length })}
      error={deleteError}
      loading={deletePending}
      onClose={() => { setDeleteOpen(false); setDeleteError(''); }}
      onConfirm={deleteSelected}
    />
  </main>;
};

export default CasesPage;
