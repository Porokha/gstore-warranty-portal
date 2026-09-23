import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowBack, ChevronRight, DescriptionOutlined, DownloadOutlined, ImageOutlined, PrintOutlined, ShieldOutlined, SmartphoneOutlined } from '@mui/icons-material';
import '../../styles/warranty-result-figma.css';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date).replaceAll('/', '.');
};

const WarrantyResultView = ({ warranty, onBack, onDownload, onPrint, onOpenCase }) => {
  const { i18n } = useTranslation();
  const ka = i18n.language === 'ka';
  const cases = warranty.service_cases || [];
  const productName = warranty.title || '—';
  const shortName = productName.split(/\b(?:128GB|256GB|512GB|1TB|Unlocked|Graphite)\b/i)[0].trim() || productName;
  const rows = [
    [ka ? 'პროდუქტი' : 'Product', productName],
    [ka ? 'სერიული ნომერი' : 'Serial number', warranty.serial_number || warranty.imei || '—'],
    [ka ? 'შეძენის თარიღი' : 'Purchase date', formatDate(warranty.purchase_date)],
    ['SKU', warranty.sku || '—'],
  ];

  return (
    <main className="zzv-warranty-result">
      <div className="zzv-warranty-result-wrap">
        <button className="zzv-warranty-result-back" type="button" onClick={onBack}>
          <span><ArrowBack aria-hidden="true" /></span>
          {ka ? 'გარანტია' : 'Warranty'}
        </button>

        <div className="zzv-warranty-result-layout">
          <section className="zzv-warranty-device" aria-label={ka ? 'მოწყობილობა' : 'Device'}>
            <div className="zzv-warranty-device-image"><ImageOutlined aria-hidden="true" /></div>
            <div className="zzv-warranty-device-copy">
              <h1>{shortName}</h1>
              {warranty.brand && <p>{warranty.brand}</p>}
              <span>{warranty.warranty_id}</span>
            </div>
            <SmartphoneOutlined className="zzv-warranty-device-mobile-icon" aria-hidden="true" />
          </section>

          <div className="zzv-warranty-result-content">
            <section className={`zzv-warranty-state ${warranty.is_active ? 'is-active' : 'is-expired'}`}>
              <div className="zzv-warranty-state-heading">
                <ShieldOutlined aria-hidden="true" />
                <strong>{warranty.is_active
                  ? (ka ? 'გარანტია მოქმედებს' : 'Warranty active')
                  : (ka ? 'გარანტიის ვადა ამოიწურა' : 'Warranty expired')}</strong>
              </div>
              <p>{warranty.is_active
                ? `${ka ? 'კიდევ' : ''} ${warranty.days_left ?? '—'} ${ka ? 'დღე' : 'days left'} · ${formatDate(warranty.warranty_end)}${ka ? '-მდე' : ''}`
                : `${ka ? 'ვადა დასრულდა' : 'Ended'} · ${formatDate(warranty.warranty_end)}`}</p>
            </section>

            <section className="zzv-warranty-detail-card" aria-label={ka ? 'გარანტიის დეტალები' : 'Warranty details'}>
              {rows.map(([label, value]) => (
                <div className="zzv-warranty-detail-row" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </section>

            <section className="zzv-warranty-result-group">
              <h2>{ka ? 'დოკუმენტი' : 'Document'}</h2>
              <div className="zzv-warranty-document">
                <DescriptionOutlined aria-hidden="true" />
                <div><strong>{ka ? 'გარანტიის ტალონი' : 'Warranty certificate'}</strong><small>{warranty.warranty_id} · PDF</small></div>
                <button type="button" onClick={onDownload} aria-label={ka ? 'PDF ჩამოტვირთვა' : 'Download PDF'}><DownloadOutlined aria-hidden="true" /></button>
                <button type="button" onClick={onPrint} aria-label={ka ? 'დაბეჭდვა' : 'Print'}><PrintOutlined aria-hidden="true" /></button>
              </div>
            </section>

            {cases.length > 0 && <section className="zzv-warranty-result-group">
              <h2>{ka ? 'დაკავშირებული სერვისი' : 'Related service'} ({cases.length})</h2>
              <div className="zzv-warranty-related-list">
                {cases.map((serviceCase) => (
                  <button type="button" className="zzv-warranty-related" key={serviceCase.id || serviceCase.case_number} onClick={() => onOpenCase(serviceCase.case_number)}>
                    <span className="zzv-warranty-related-icon"><SmartphoneOutlined aria-hidden="true" /></span>
                    <span className="zzv-warranty-related-copy"><strong>{shortName}</strong><small>{serviceCase.case_number}</small></span>
                    <span className="zzv-warranty-related-status">{serviceCase.status_level === 4 ? (ka ? 'დასრულებული' : 'Completed') : (ka ? 'მიმდინარე' : 'In progress')}</span>
                    <ChevronRight aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>}
          </div>
        </div>
      </div>
    </main>
  );
};

export default WarrantyResultView;
