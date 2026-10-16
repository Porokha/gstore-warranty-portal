import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, TextField, Typography } from '@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import { useMutation, useQuery } from 'react-query';
import QRCode from 'qrcode';
import SignaturePad from '../../components/trade-in/SignaturePad';
import StaffSignatureQrDialog from '../../components/trade-in/StaffSignatureQrDialog';
import { tradeInService } from '../../services/tradeInService';
import '../../components/trade-in/trade-in-agreement.css';

const fields = [
  ['seller_name', 'გამყიდველის სახელი და გვარი'], ['personal_id', 'პირადი ნომერი'],
  ['phone', 'ტელეფონი'], ['address', 'მისამართი'], ['brand_model', 'ბრენდი და მოდელი'],
  ['storage', 'მეხსიერება'], ['color', 'ფერი'], ['imei', 'IMEI'], ['serial', 'Serial Number'],
  ['included_items', 'კომპლექტაცია'], ['defects', 'დაზიანებები / შეკეთებები / დეფექტები'],
];

const fieldLabels = Object.fromEntries(fields);
fieldLabels.final_price = 'ნასყიდობის ფასი (₾)';
fieldLabels.imei = 'IMEI ან Serial Number';

const missingAgreementFields = (details) => {
  if (!details) return [];
  const missing = ['seller_name', 'phone', 'address', 'brand_model', 'color', 'included_items', 'defects']
    .filter((key) => !String(details[key] || '').trim());
  if (!/^\d{11}$/.test(String(details.personal_id || '').trim())) missing.push('personal_id');
  if (!String(details.imei || '').trim() && !String(details.serial || '').trim()) missing.push('imei');
  if (!(Number(details.final_price) > 0)) missing.push('final_price');
  return missing;
};

export const printTradeInAgreement = async (quoteId) => {
  const blob = await tradeInService.getAdminAgreementPdf(quoteId);
  const url = URL.createObjectURL(blob);
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;';
  frame.src = url;
  frame.onload = () => {
    try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (_) { window.open(url, '_blank', 'noopener'); }
    window.setTimeout(() => { frame.remove(); URL.revokeObjectURL(url); }, 120000);
  };
  document.body.appendChild(frame);
};

const TradeInFinalizeDialog = ({ quote, onClose, onFinalized }) => {
  const [details, setDetails] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [qr, setQr] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [repMode, setRepMode] = useState('saved');
  const [drawnSignature, setDrawnSignature] = useState('');
  const [representativeQrOpen, setRepresentativeQrOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [attemptedFinish, setAttemptedFinish] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewBusy, setPreviewBusy] = useState(false);
  const agreementQuery = useQuery(['trade-in-agreement', quote?.id], () => tradeInService.openAdminAgreement(quote.id), {
    enabled: Boolean(quote), retry: false, refetchInterval: qr || representativeQrOpen ? 3000 : false,
  });
  const savedSignatureQuery = useQuery(['trade-in-own-signature'], tradeInService.getOwnTradeInSignature, { enabled: Boolean(quote), retry: false });

  useEffect(() => {
    if (savedSignatureQuery.data && !savedSignatureQuery.data.signature) setRepMode('draw');
  }, [savedSignatureQuery.data]);
  const saveMutation = useMutation(() => tradeInService.saveAdminAgreement(quote.id, details));
  const linkMutation = useMutation(() => tradeInService.createAgreementSigningLink(quote.id));
  const repMutation = useMutation((payload) => tradeInService.setAgreementRepresentativeSignature(quote.id, payload));
  const finalizeMutation = useMutation(() => tradeInService.finalizeAdminAgreement(quote.id));

  useEffect(() => {
    if (agreementQuery.data && details === null) setDetails(agreementQuery.data.details);
  }, [agreementQuery.data, details]);

  useEffect(() => {
    if (!qr?.token) return;
    QRCode.toDataURL(`${window.location.origin}/trade-in/sign/${qr.token}`, { width: 360, margin: 2, errorCorrectionLevel: 'M' })
      .then(setQrImage).catch(() => setQrImage(''));
  }, [qr]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  if (!quote) return null;
  const agreement = agreementQuery.data;
  const finalized = Boolean(agreement?.finalized_at);
  const busy = saveMutation.isLoading || linkMutation.isLoading || repMutation.isLoading || finalizeMutation.isLoading || previewBusy;
  const missing = missingAgreementFields(details);
  const update = (key, value) => { setDirty(true); setMessage(''); setDetails((current) => ({ ...current, [key]: value })); };
  const save = async () => {
    const result = await saveMutation.mutateAsync();
    setDetails(result.details);
    setDirty(false);
    await agreementQuery.refetch();
    return result;
  };
  const issueLink = async () => {
    setError('');
    try {
      const link = await linkMutation.mutateAsync();
      setQrImage('');
      setQr(link);
      await agreementQuery.refetch();
    } catch (failure) { setError(failure.response?.data?.message || 'QR-ის გენერირება ვერ მოხერხდა.'); }
  };
  const preview = async () => {
    setError('');
    setPreviewBusy(true);
    try {
      if (dirty) await save();
      const blob = await tradeInService.getAdminAgreementPreviewPdf(quote.id);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (failure) { setError(failure.response?.data?.message || 'PDF-ის წინასწარი ნახვა ვერ გაიხსნა.'); }
    finally { setPreviewBusy(false); }
  };
  const applyRepresentative = async () => {
    setError('');
    try {
      if (dirty) await save();
      await repMutation.mutateAsync(repMode === 'saved' ? { use_saved: true } : { signature: drawnSignature });
      await agreementQuery.refetch();
      setMessage('წარმომადგენლის ხელმოწერა გამოყენებულია.');
    } catch (failure) { setError(failure.response?.data?.message || 'ხელმოწერის გამოყენება ვერ მოხერხდა.'); }
  };
  const finalize = async () => {
    setError('');
    if (missing.length) {
      setAttemptedFinish(true);
      setError(`გაფორმებამდე შეავსეთ: ${missing.map((key) => fieldLabels[key]).join(', ')}.`);
      return;
    }
    try {
      if (dirty) await save();
      const latest = await agreementQuery.refetch();
      if (!latest.data?.customer_signed_at) {
        setError('მომხმარებლის ხელმოწერა ჯერ არ არის მიღებული. დაასკანერეთ QR კოდი და სცადეთ ხელახლა.');
        return;
      }
      if (!latest.data.representative_signed) {
        if (repMode === 'saved' && savedSignatureQuery.data?.signature) {
          await repMutation.mutateAsync({ use_saved: true });
        } else if (repMode === 'draw' && drawnSignature) {
          await repMutation.mutateAsync({ signature: drawnSignature });
        } else {
          setError('წარმომადგენლის ხელმოწერაც საჭიროა. აირჩიეთ შენახული ხელმოწერა ან დახატეთ ახალი.');
          return;
        }
        await agreementQuery.refetch();
      }
      await finalizeMutation.mutateAsync();
      await agreementQuery.refetch();
      onFinalized();
      try { await printTradeInAgreement(quote.id); }
      catch (_) { setMessage('დასრულებულია, მაგრამ ბეჭდვა ვერ გაიხსნა. გამოიყენეთ ხელახალი ბეჭდვის ღილაკი.'); }
    } catch (failure) { setError(failure.response?.data?.message || 'გაფორმება ვერ დასრულდა.'); }
  };

  return (
    <>
      <Dialog open onClose={busy ? undefined : onClose} className="zzv-agreement-dialog" maxWidth={false} fullWidth>
        <DialogTitle className="zzv-agreement-dialog__title"><Box><Typography className="zzv-agreement-dialog__eyebrow">TRADE-IN · {quote.quote_number}</Typography><h2>{finalized ? 'გაფორმებული ხელშეკრულება' : 'Trade-in-ის გაფორმება'}</h2><p>შეავსეთ შეთანხმება, მიიღეთ ხელმოწერები და დაასრულეთ განაცხადი.</p></Box><IconButton aria-label="დახურვა" onClick={onClose} disabled={busy}><CloseRounded fontSize="small" /></IconButton></DialogTitle>
        <DialogContent className="zzv-agreement-dialog__content">
          {agreementQuery.isLoading ? <Typography sx={{ p: 3 }}>იტვირთება...</Typography> : agreementQuery.isError ? <Alert severity="error">{agreementQuery.error?.response?.data?.message || 'ხელშეკრულება ვერ გაიხსნა.'}</Alert> : details && (
            <div className="zzv-agreement-dialog__body">
              {error && <Alert severity="error">{String(error)}</Alert>}
              {message && <Alert severity="success">{message}</Alert>}
              {!finalized && <div className={`zzv-agreement-dialog__readiness${missing.length ? ' is-incomplete' : ''}`}><strong>{missing.length ? `გაფორმებამდე შესავსებია ${missing.length} ველი` : 'ყველა აუცილებელი ველი შევსებულია'}</strong><span>{missing.length ? missing.map((key) => fieldLabels[key]).join(' · ') : 'შეგიძლიათ დაასრულოთ გაფორმება ხელმოწერების მიღების შემდეგ.'}</span><span>ხელმოწერის QR კოდის შექმნა შეგიძლიათ ამ ველების შევსებამდეც.</span></div>}
              <section className="zzv-agreement-dialog__section"><h3><span>01</span> გამყიდველი</h3><div className="zzv-agreement-dialog__grid">{fields.slice(0, 4).map(([key, label]) => <div className="zzv-agreement-dialog__field" key={key}><label htmlFor={`agreement-${key}`}>{label} *</label><TextField id={`agreement-${key}`} size="small" fullWidth value={details[key] || ''} disabled={finalized} error={attemptedFinish && missing.includes(key)} onChange={(event) => update(key, event.target.value)} inputProps={{ maxLength: key === 'personal_id' ? 11 : 1000 }} /></div>)}</div></section>
              <section className="zzv-agreement-dialog__section"><h3><span>02</span> მოწყობილობა და ინსპექტირება</h3><div className="zzv-agreement-dialog__grid">{fields.slice(4).map(([key, label]) => <div className="zzv-agreement-dialog__field" key={key}><label htmlFor={`agreement-${key}`}>{label}{['brand_model', 'color', 'included_items', 'defects'].includes(key) ? ' *' : ''}{key === 'imei' || key === 'serial' ? ' (ერთ-ერთი *)' : ''}</label><TextField id={`agreement-${key}`} size="small" fullWidth value={details[key] || ''} disabled={finalized} error={attemptedFinish && (missing.includes(key) || (key === 'serial' && missing.includes('imei')))} onChange={(event) => update(key, event.target.value)} multiline={key === 'defects'} minRows={key === 'defects' ? 2 : undefined} /></div>)}</div><p className="zzv-agreement-dialog__hint">IMEI ან Serial Number-დან ერთ-ერთი სავალდებულოა. თუ დეფექტი არ არის, ჩაწერეთ „არ აქვს“.</p></section>
              <section className="zzv-agreement-dialog__section"><h3><span>03</span> შეთანხმებული ფასი და ანგარიშსწორება</h3><div className="zzv-agreement-dialog__grid"><div className="zzv-agreement-dialog__field"><label htmlFor="agreement-price">ნასყიდობის ფასი (₾) *</label><TextField id="agreement-price" size="small" fullWidth type="number" value={details.final_price ?? ''} disabled={finalized} error={attemptedFinish && missing.includes('final_price')} onChange={(event) => update('final_price', event.target.value)} inputProps={{ min: 0, step: 0.01 }} /></div><div className="zzv-agreement-dialog__field"><label htmlFor="agreement-method">ანგარიშსწორება *</label><TextField id="agreement-method" size="small" fullWidth select value={details.settlement_method || 'cash'} disabled={finalized} onChange={(event) => update('settlement_method', event.target.value)}><MenuItem value="cash">ნაღდი</MenuItem><MenuItem value="bank">საბანკო გადარიცხვა</MenuItem><MenuItem value="gstore_credit">Gstore კრედიტი</MenuItem></TextField></div></div>{details.settlement_method === 'gstore_credit' && <p className="zzv-agreement-dialog__hint">ბონუსი: ₾{Number(details.credit_bonus || 0).toFixed(2)} · ჯამური კრედიტი: ₾{(Number(details.final_price || 0) + Number(details.credit_bonus || 0)).toFixed(2)}. ახალი თანხის ბონუსი შენახვისას გადაითვლება.</p>}</section>
              <section className="zzv-agreement-dialog__section">
                <h3><span>04</span> ხელმოწერები</h3>
                <div className="zzv-agreement-dialog__signatures">
                  <div className="zzv-agreement-dialog__sign-box">
                    <h4>მომხმარებელი</h4>
                    <p>{agreement?.customer_signed_at ? `ხელმოწერილია · ${new Date(agreement.customer_signed_at).toLocaleString('ka-GE')}` : 'მომხმარებლის ხელმოწერა ჯერ არ არის.'}</p>
                    {!finalized && <Button variant="outlined" onClick={issueLink} disabled={busy}>{agreement?.customer_signed_at || qr ? 'ახალი QR · ხელახლა ხელმოწერა' : 'QR კოდის გენერირება'}</Button>}
                  </div>
                  <div className="zzv-agreement-dialog__sign-box">
                    <h4>წარმომადგენელი</h4>
                    <p>{agreement?.representative_signed ? 'ხელმოწერა გამოყენებულია.' : 'წარმომადგენლის ხელმოწერა ჯერ არ არის.'}</p>
                    {!finalized && <>
                      <div className="zzv-agreement-dialog__field">
                        <label htmlFor="agreement-signature-source">ხელმოწერის წყარო</label>
                        <TextField id="agreement-signature-source" fullWidth size="small" select value={repMode} onChange={(event) => { setRepMode(event.target.value); setDrawnSignature(''); }} SelectProps={{ IconComponent: KeyboardArrowDownRounded, MenuProps: { PaperProps: { className: 'zzv-agreement-dialog__menu' } } }}>
                          <MenuItem value="saved" disabled={!savedSignatureQuery.data?.signature}>ჩემი შენახული ხელმოწერა</MenuItem>
                          <MenuItem value="draw">ახლავე დახატვა</MenuItem>
                        </TextField>
                      </div>
                      {repMode === 'draw' && <Box sx={{ mt: 1 }}><SignaturePad onChange={setDrawnSignature} clearLabel="წაშლა" /></Box>}
                      <Button sx={{ mt: 1 }} variant="outlined" onClick={applyRepresentative} disabled={busy || (repMode === 'draw' && !drawnSignature) || (repMode === 'saved' && !savedSignatureQuery.data?.signature)}>გამოყენება / შეცვლა</Button>
                      <Button sx={{ mt: 1, ml: 1 }} variant="outlined" onClick={() => setRepresentativeQrOpen(true)} disabled={busy}>QR · ტელეფონზე ხელმოწერა</Button>
                      {!savedSignatureQuery.data?.signature && <Typography sx={{ fontSize: 11, color: '#667085' }}>შეგიძლიათ ხელმოწერა შეინახოთ Shop Admin → Settings-ში.</Typography>}
                    </>}
                  </div>
                </div>
              </section>
              <p className="zzv-agreement-dialog__footnote">მიღებული ხელმოწერები შენარჩუნდება მონახაზის ცვლილებისას და დაემატება საბოლოო PDF-ს.</p>
            </div>
          )}
        </DialogContent>
        <DialogActions className="zzv-agreement-dialog__actions"><Box sx={{ display: 'flex', gap: 1 }}><Button onClick={onClose}>დახურვა</Button>{finalized && <Button onClick={() => printTradeInAgreement(quote.id).catch(() => setError('PDF-ის გახსნა ვერ მოხერხდა.'))}>ხელახლა ბეჭდვა</Button>}</Box>{!finalized && <Box sx={{ display: 'flex', gap: 1 }}><Button variant="outlined" disabled={busy || !details} onClick={() => save().then(() => setMessage('მონახაზი შენახულია.')).catch((failure) => setError(failure.response?.data?.message || 'შენახვა ვერ მოხერხდა.'))}>მონახაზის შენახვა</Button><Button variant="outlined" disabled={busy || !details} onClick={preview}>PDF-ის ნახვა</Button><Button variant="contained" disabled={busy || !details} onClick={finalize}>გაფორმების დასრულება</Button></Box>}</DialogActions>
      </Dialog>
      <Dialog open={Boolean(previewUrl)} onClose={() => setPreviewUrl('')} maxWidth="lg" fullWidth className="zzv-agreement-dialog__preview-modal">
        <DialogTitle>ხელშეკრულების წინასწარი ნახვა</DialogTitle>
        <DialogContent>{previewUrl && <iframe title="ხელშეკრულების მონახაზი" src={previewUrl} />}</DialogContent>
        <DialogActions><Button onClick={() => setPreviewUrl('')}>დახურვა</Button></DialogActions>
      </Dialog>
      <Dialog open={Boolean(qr)} onClose={() => setQr(null)} maxWidth="xs" fullWidth className="zzv-agreement-dialog__qr-modal"><DialogTitle>მომხმარებლის ხელმოწერა</DialogTitle><DialogContent className="zzv-agreement-dialog__qr">{qrImage && <img src={qrImage} alt="ხელმოწერის QR კოდი" />}<Typography sx={{ fontSize: 13 }}>მომხმარებელმა დაასკანეროს QR და მოაწეროს ხელი საკუთარ ტელეფონზე. ბმული მოქმედებს 15 წუთი, ერთხელ.</Typography><code>{qr && `${window.location.origin}/trade-in/sign/${qr.token}`}</code>{agreement?.customer_signed_at && <Alert severity="success">ხელმოწერა მიღებულია.</Alert>}</DialogContent><DialogActions><Button onClick={() => setQr(null)}>დახურვა</Button><Button onClick={issueLink} disabled={busy}>ახალი QR</Button></DialogActions></Dialog>
      {representativeQrOpen && <StaffSignatureQrDialog quoteId={quote.id} onClose={() => setRepresentativeQrOpen(false)} onSigned={() => { agreementQuery.refetch(); setMessage('წარმომადგენლის ხელმოწერა მიღებულია.'); }} />}
    </>
  );
};

export default TradeInFinalizeDialog;
