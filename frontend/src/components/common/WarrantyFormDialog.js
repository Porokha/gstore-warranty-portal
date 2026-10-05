import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, CircularProgress, Dialog } from '@mui/material';

const ASSET = '/figma-staff/';
const DEVICE_TYPES = ['Laptop', 'Phone', 'Tablet', 'Desktop', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Excellent', 'Good', 'Fair', 'Poor'];
const empty = {
  sku: '', serial_number: '', device_type: 'Laptop', imei: '', title: '', price: '',
  customer_name: '', customer_last_name: '', customer_phone: '', customer_email: '',
  purchase_date: '', warranty_start: '', warranty_end: '', brand: '', model: '',
  condition: '', personal_identification_number: '', admin_notes: '', thumbnail_url: '',
  order_id: '', product_id: '', extended_days: 0,
};
const dateValue = (value) => value ? String(value).slice(0, 10) : '';

const WarrantyFormDialog = ({ mode, warranty, loading, error, success, saving, onSubmit, onClose }) => {
  const { t, i18n } = useTranslation();
  const ka = i18n.language?.startsWith('ka');
  const edit = mode === 'edit';
  const [form, setForm] = useState(empty);
  const seededWarrantyId = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!warranty || seededWarrantyId.current === warranty.id) return;
    seededWarrantyId.current = warranty.id;
    setForm({
      ...empty, ...warranty,
      purchase_date: dateValue(warranty.purchase_date),
      warranty_start: dateValue(warranty.warranty_start),
      warranty_end: dateValue(warranty.warranty_end),
    });
  }, [warranty]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setValidationError('');
  };
  const field = (name, label, options = {}) => <label className={`zzv-warranty-form__field ${options.wide ? 'is-wide' : ''}`} key={name}>
    <span>{label}{options.required && ' *'}</span>
    <input name={name} type={options.type || 'text'} value={form[name] ?? ''} onChange={(event) => setField(name, event.target.value)}
      required={options.required} min={options.min} step={options.step} autoComplete="off" />
  </label>;
  const select = (name, label, values, required = false) => <label className="zzv-warranty-form__field" key={name}>
    <span>{label}{required && ' *'}</span>
    <select name={name} value={form[name] ?? ''} onChange={(event) => setField(name, event.target.value)} required={required}>
      {!required && <option value="">{ka ? 'არ არის მითითებული' : 'Not specified'}</option>}
      {form[name] && !values.includes(form[name]) && <option value={form[name]}>{form[name]}</option>}
      {values.map((value) => <option key={value} value={value}>{t(`warranty.option${value.replaceAll(' ', '')}`, value)}</option>)}
    </select>
  </label>;
  const submit = (event) => {
    event.preventDefault();
    if (form.warranty_end < form.warranty_start) {
      setValidationError(t('warranty.endBeforeStart'));
      return;
    }
    const payload = { ...form, price: Number(form.price) };
    ['order_id', 'product_id', 'extended_days'].forEach((key) => {
      payload[key] = form[key] === '' || form[key] == null ? undefined : Number(form[key]);
    });
    for (const key of Object.keys(payload)) {
      if (payload[key] !== '') continue;
      if (edit && ['imei', 'personal_identification_number', 'thumbnail_url'].includes(key)) payload[key] = null;
      else if (!['customer_email', 'admin_notes', 'brand', 'model', 'condition'].includes(key)) delete payload[key];
    }
    delete payload.id;
    delete payload.warranty_id;
    delete payload.service_cases;
    delete payload.created_at;
    delete payload.updated_at;
    onSubmit(payload);
  };

  return <Dialog open onClose={saving ? undefined : onClose} maxWidth={false} className="zzv-warranty-form-dialog"
    aria-labelledby="zzv-warranty-form-title" PaperProps={{ className: 'zzv-warranty-form-dialog__paper' }}>
    <form className="zzv-warranty-form" onSubmit={submit}>
      <header className="zzv-warranty-form__head">
        <h1 id="zzv-warranty-form-title">{edit ? t('warranty.editWarranty') : t('warranty.newWarrantyTitle')}</h1>
        <button type="button" aria-label={t('common.close')} onClick={onClose} disabled={saving}>
          <img src={`${ASSET}warranty-form-close.svg`} alt="" />
        </button>
      </header>
      <div className="zzv-warranty-form__body">
        {error && <Alert severity="error">{Array.isArray(error) ? error.join(', ') : error}</Alert>}
        {validationError && <Alert severity="error">{validationError}</Alert>}
        {success && <Alert severity="success">{t('warranty.warrantyUpdated')}</Alert>}
        {loading ? <div className="zzv-warranty-form__loading"><CircularProgress /></div> : <>
          <section className="zzv-warranty-form__section">
            <h2>{t('warranty.productSection')}</h2>
            <div className="zzv-warranty-form__grid">
              {field('sku', t('case.sku'), { required: true })}
              {field('serial_number', t('case.serialNumber'), { required: true })}
              {select('device_type', t('case.deviceType'), DEVICE_TYPES, true)}
              {field('imei', 'IMEI')}
              {field('title', t('warranty.formTitleLabel'), { required: true, wide: true })}
              {field('price', t('common.price'), { required: true, type: 'number', min: '0', step: '0.01', wide: true })}
            </div>
          </section>
          <section className="zzv-warranty-form__section">
            <h2>{t('warranty.customerSection')}</h2>
            <div className="zzv-warranty-form__grid">
              {field('customer_name', t('warranty.firstNameLabel'), { required: true })}
              {field('customer_last_name', t('warranty.lastNameLabel'), { required: true })}
              {field('customer_phone', t('warranty.phoneLabel'), { required: true })}
              {field('customer_email', t('warranty.emailLabel'), { type: 'email' })}
            </div>
          </section>
          <section className="zzv-warranty-form__section">
            <h2>{t('warranty.datesSection')}</h2>
            <div className="zzv-warranty-form__grid zzv-warranty-form__grid--three">
              {field('purchase_date', t('warranty.purchaseDate'), { required: true, type: 'date' })}
              {field('warranty_start', t('warranty.warrantyStart'), { required: true, type: 'date' })}
              {field('warranty_end', t('warranty.warrantyEndDate'), { required: true, type: 'date' })}
            </div>
          </section>
          <section className="zzv-warranty-form__advanced">
            <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{t('warranty.additionalDetails')} <span aria-hidden="true">{expanded ? '−' : '+'}</span></button>
            {expanded && <div className="zzv-warranty-form__advanced-fields">
              <div className="zzv-warranty-form__grid">
                {field('brand', t('warranty.brand'))}
                {field('model', t('warranty.model'))}
                {select('condition', t('warranty.condition'), CONDITIONS)}
                {field('personal_identification_number', t('warranty.personalIdentificationNumber'))}
                {field('thumbnail_url', t('common.thumbnailUrl'), { type: 'url', wide: true })}
                {!edit && <>{field('order_id', t('warranty.orderId'), { type: 'number', min: '0' })}{field('product_id', t('warranty.productId'), { type: 'number', min: '0' })}</>}
                {field('extended_days', t('warranty.extendedDays'), { type: 'number', min: '0' })}
              </div>
              <label className="zzv-warranty-form__field is-wide"><span>{t('warranty.adminNotes')}</span><textarea value={form.admin_notes ?? ''} onChange={(event) => setField('admin_notes', event.target.value)} rows={4} /></label>
            </div>}
          </section>
        </>}
      </div>
      <footer className="zzv-warranty-form__footer">
        <button type="button" className="zzv-warranty-form__cancel" onClick={onClose} disabled={saving}>{t('common.cancel')}</button>
        <button type="submit" className="zzv-warranty-form__submit" disabled={saving || loading}>
          {saving ? <CircularProgress size={16} color="inherit" /> : <img src={`${ASSET}${edit ? 'warranty-form-save.svg' : 'warranty-form-add.svg'}`} alt="" />}
          {edit ? t('common.save') : t('common.create')}
        </button>
      </footer>
    </form>
  </Dialog>;
};

export default WarrantyFormDialog;
