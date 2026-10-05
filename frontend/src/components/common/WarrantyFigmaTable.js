import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const fmtDate = (value) => value && !Number.isNaN(new Date(value).getTime())
  ? new Date(value).toLocaleDateString('en-GB') : '—';

const WarrantyFigmaTable = ({ data, columns, serverPagination, onRowClick, onOpenHistory, onBulkDelete, onBulkExport, pageSizeOptions, isLoading }) => {
  const { t, i18n } = useTranslation();
  const ka = i18n.language?.startsWith('ka');
  const [selected, setSelected] = useState([]);
  const { page, pageSize, total, onPageChange, onPageSizeChange } = serverPagination;
  const ids = data.map((row) => row.id);
  const selectedIds = selected.filter((id) => ids.includes(id));

  useEffect(() => { setSelected([]); }, [page, pageSize, data]);

  return <div className="zzv-warranty-table">
    <div className="zzv-warranty-table__scroll">
      <table>
        <thead><tr>
          <th className="zzv-warranty-table__check"><input type="checkbox" aria-label={ka ? 'ყველას მონიშვნა' : 'Select all'} checked={ids.length > 0 && selectedIds.length === ids.length} onChange={(event) => setSelected(event.target.checked ? ids : [])} /></th>
          <th>{ka ? 'გარანტია' : 'Warranty'}</th><th>{ka ? 'პროდუქტი' : 'Product'}</th><th>{ka ? 'კლიენტი' : 'Customer'}</th>
          <th>{ka ? 'ტიპი' : 'Type'}</th><th>{ka ? 'ვადა' : 'Term'}</th><th>{ka ? 'ისტორია' : 'History'}</th><th>{t('common.status')}</th><th>{t('common.actions')}</th>
        </tr></thead>
        <tbody>{data.map((row) => {
          const end = new Date(row.warranty_end);
          const active = !Number.isNaN(end.getTime()) && end >= new Date();
          const days = Math.ceil((end - new Date()) / 86400000);
          return <tr key={row.id} onClick={() => onRowClick(row)}>
            <td className="zzv-warranty-table__check" onClick={(event) => event.stopPropagation()}><input type="checkbox" aria-label={`${ka ? 'მონიშნე' : 'Select'} ${row.warranty_id}`} checked={selectedIds.includes(row.id)} onChange={() => setSelected((prev) => prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id])} /></td>
            <td><strong className="zzv-warranty-table__code">{row.warranty_id || '—'}</strong><small>{ka ? 'შეძენილია' : 'Purchased'} {fmtDate(row.purchase_date)}</small></td>
            <td><strong title={row.title || ''}>{row.title || '—'}</strong><small title={`${row.sku || ''} · ${row.serial_number || ''}`}>{row.sku || '—'} · {row.serial_number || '—'}</small></td>
            <td><strong>{`${row.customer_name || ''} ${row.customer_last_name || ''}`.trim() || '—'}</strong><small>{row.customer_phone || '—'}</small></td>
            <td>{row.device_type || '—'}</td>
            <td><strong>{fmtDate(row.warranty_end)}</strong><small>{active ? `${ka ? 'დარჩა' : 'Remaining'} ${days} ${ka ? 'დღე' : 'days'}` : (ka ? 'ვადა გასულია' : 'Expired')}</small></td>
            <td onClick={(event) => event.stopPropagation()}><button type="button" className="zzv-warranty-table__history" onClick={() => onOpenHistory(row)}>
              {row.service_case_count ? `${row.service_case_count} ${ka ? 'სერვისი' : 'services'}` : t('warranty.historyAction')}
            </button></td>
            <td><span className={`zzv-warranty-table__status ${active ? 'is-active' : ''}`}>{active ? t('common.active') : t('common.expired')}</span></td>
            <td><div className="zzv-warranty-table__actions" onClick={(event) => event.stopPropagation()}>{columns.find((column) => column.key === 'actions')?.render(row)}</div></td>
          </tr>;
        })}</tbody>
      </table>
      {isLoading && <div className="zzv-warranty-table__empty">{ka ? 'იტვირთება...' : 'Loading...'}</div>}
      {!isLoading && data.length === 0 && <div className="zzv-warranty-table__empty">{ka ? 'გარანტიები ვერ მოიძებნა' : 'No warranties found'}</div>}
    </div>
    <footer className="zzv-warranty-table__footer">
      <div className="zzv-warranty-table__bulk">
        <span>{ka ? 'ნაჩვენებია' : 'Showing'} {total ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} / {total}</span>
        {selectedIds.length > 0 && <><span>{selectedIds.length} {ka ? 'მონიშნულია' : 'selected'}</span><button type="button" onClick={() => onBulkExport(selectedIds)}>{ka ? 'ექსპორტი' : 'Export'}</button>{onBulkDelete && <button type="button" onClick={() => onBulkDelete(selectedIds)}>{t('common.delete')}</button>}</>}
      </div>
      <div className="zzv-warranty-table__pagination">
        <label><span className="sr-only">{ka ? 'რიგები გვერდზე' : 'Rows per page'}</span><select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>{pageSizeOptions.map((size) => <option key={size} value={size}>{size} {ka ? 'რიგი' : 'rows'}</option>)}</select></label>
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹ {ka ? 'წინა' : 'Previous'}</button>
        <button type="button" disabled={page >= Math.ceil(total / pageSize)} onClick={() => onPageChange(page + 1)}>{ka ? 'შემდეგი' : 'Next'} ›</button>
      </div>
    </footer>
  </div>;
};

export default WarrantyFigmaTable;
