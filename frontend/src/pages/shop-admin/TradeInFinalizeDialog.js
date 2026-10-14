import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography } from '@mui/material';
import { useMutation, useQuery } from 'react-query';
import QRCode from 'qrcode';
import SignaturePad from '../../components/trade-in/SignaturePad';
import { tradeInService } from '../../services/tradeInService';
import '../../components/trade-in/trade-in-agreement.css';

const fields = [
  ['seller_name', 'გამყიდველის სახელი და გვარი'], ['personal_id', 'პირადი ნომერი'],
  ['phone', 'ტელეფონი'], ['address', 'მისამართი'], ['brand_model', 'ბრენდი და მოდელი'],
  ['storage', 'მეხსიერება'], ['color', 'ფერი'], ['imei', 'IMEI'], ['serial', 'Serial Number'],
  ['included_items', 'კომპლექტაცია'], ['defects', 'დაზიანებები / შეკეთებები / დეფექტები'],
];

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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const agreementQuery = useQuery(['trade-in-agreement', quote?.id], () => tradeInService.openAdminAgreement(quote.id), {
    enabled: Boolean(quote), retry: false, refetchInterval: qr ? 3000 : false,
  });
  const savedSignatureQuery = useQuery(['trade-in-own-signature'], tradeInService.getOwnTradeInSignature, { enabled: Boolean(quote), retry: false });
  const saveMutation = useMutation(() => tradeInService.saveAdminAgreement(quote.id, details));
  const linkMutation = useMutation(() => tradeInService.createAgreementSigningLink(quote.id));
  const repMutation = useMutation((payload) => tradeInService.setAgreementRepresentativeSignature(quote.id, payload));
  const finalizeMutation = useMutation(() => tradeInService.finalizeAdminAgreement(quote.id));

  useEffect(() => {
    if (agreementQuery.data && (!details || !dirty)) setDetails(agreementQuery.data.details);
  }, [agreementQuery.data, details, dirty]);

  useEffect(() => {
    if (!qr?.token) return;
    QRCode.toDataURL(`${window.location.origin}/trade-in/sign/${qr.token}`, { width: 360, margin: 2, errorCorrectionLevel: 'M' })
      .then(setQrImage).catch(() => setQrImage(''));
  }, [qr]);

  if (!quote) return null;
  const agreement = agreementQuery.data;
  const finalized = Boolean(agreement?.finalized_at);
  const busy = saveMutation.isLoading || linkMutation.isLoading || repMutation.isLoading || finalizeMutation.isLoading;
  const update = (key, value) => { setDirty(true); setMessage(''); setDetails((current) => ({ ...current, [key]: value })); };
  const save = async () => {
    const result = await saveMutation.mutateAsync();
    setDirty(false);
    await agreementQuery.refetch();
    return result;
  };
  const issueLink = async () => {
    setError('');
    try {
      if (dirty) await save();
      const link = await linkMutation.mutateAsync();
      setQrImage('');
      setQr(link);
      await agreementQuery.refetch();
    } catch (failure) { setError(failure.response?.data?.message || 'QR-ის გენერირება ვერ მოხერხდა.'); }
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
    try {
      if (dirty) await save();
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
        <DialogTitle className="zzv-agreement-dialog__title"><Box><Typography sx={{ color: '#7856c6', fontSize: 11, fontWeight: 800 }}>GSTORE · TRADE-IN · {quote.quote_number}</Typography><h2>{finalized ? 'გაფორმებული ხელშეკრულება' : 'Trade-in-ის გაფორმება'}</h2></Box><Button onClick={onClose}>დახურვა</Button></DialogTitle>
        <DialogContent sx={{ p: '0 !important' }}>
          {agreementQuery.isLoading ? <Typography sx={{ p: 3 }}>იტვირთება...</Typography> : agreementQuery.isError ? <Alert severity="error">{agreementQuery.error?.response?.data?.message || 'ხელშეკრულება ვერ გაიხსნა.'}</Alert> : details && (
            <div className="zzv-agreement-dialog__body">
              {error && <Alert severity="error">{String(error)}</Alert>}
              {message && <Alert severity="success">{message}</Alert>}
              <section className="zzv-agreement-dialog__section"><h3>1. გამყიდველი</h3><div className="zzv-agreement-dialog__grid">{fields.slice(0, 4).map(([key, label]) => <TextField key={key} size="small" label={label} value={details[key] || ''} disabled={finalized} onChange={(event) => update(key, event.target.value)} inputProps={{ maxLength: key === 'personal_id' ? 11 : 1000 }} />)}</div></section>
              <section className="zzv-agreement-dialog__section"><h3>2. მოწყობილობა და ინსპექტირება</h3><div className="zzv-agreement-dialog__grid">{fields.slice(4).map(([key, label]) => <TextField key={key} size="small" label={label} value={details[key] || ''} disabled={finalized} onChange={(event) => update(key, event.target.value)} multiline={key === 'defects'} minRows={key === 'defects' ? 2 : undefined} />)}</div><Typography sx={{ fontSize: 12, color: '#667085' }}>IMEI ან Serial Number-დან ერთ-ერთი სავალდებულოა. თუ დეფექტი არ არის, ჩაწერეთ „არ აქვს“.</Typography></section>
              <section className="zzv-agreement-dialog__section"><h3>3. შეთანხმებული ფასი და ანგარიშსწორება</h3><div className="zzv-agreement-dialog__grid"><TextField size="small" label="ნასყიდობის ფასი (₾)" type="number" value={details.final_price ?? ''} disabled={finalized} onChange={(event) => update('final_price', event.target.value)} inputProps={{ min: 0, step: 0.01 }} /><TextField size="small" select label="ანგარიშსწორება" value={details.settlement_method || 'cash'} disabled={finalized} onChange={(event) => update('settlement_method', event.target.value)}><MenuItem value="cash">ნაღდი</MenuItem><MenuItem value="bank">საბანკო გადარიცხვა</MenuItem><MenuItem value="gstore_credit">Gstore კრედიტი</MenuItem></TextField></div>{details.settlement_method === 'gstore_credit' && <Typography sx={{ fontSize: 12, color: '#667085' }}>ბონუსი: ₾{Number(details.credit_bonus || 0).toFixed(2)} · ჯამური კრედიტი: ₾{(Number(details.final_price || 0) + Number(details.credit_bonus || 0)).toFixed(2)}. ახალი თანხის ბონუსი შენახვისას გადაითვლება.</Typography>}</section>
          <section className="zzv-agreement-dialog__section"><h3>4. ხელმოწერები</h3><div className="zzv-agreement-dialog__signatures"><div className="zzv-agreement-dialog__sign-box"><h4>მომხმარებელი</h4><p>{agreement?.customer_signed_at ? `ხელმოწერილია · ${new Date(agreement.customer_signed_at).toLocaleString('ka-GE')}` : 'მომხმარებლის ხელმოწერა ჯერ არ არის.'}</p>{!finalized && <Button variant="outlined" onClick={issueLink} disabled={busy}>{agreement?.customer_signed_at || qr ? 'ახალი QR · ხელახლა ხელმოწერა' : 'QR კოდის გენერირება'}</Button>}</div><div className="zzv-agreement-dialog__sign-box"><h4>წარმომადგენელი</h4><p>{agreement?.representative_signed ? 'ხელმოწერა გამოყენებულია.' : 'წარმომადგენლის ხელმოწერა ჯერ არ არის.'}</p>{!finalized && <><TextField fullWidth size="small" select label="ხელმოწერის წყარო" value={repMode} onChange={(event) => { setRepMode(event.target.value); setDrawnSignature(''); }}><MenuItem value="saved" disabled={!savedSignatureQuery.data?.signature}>ჩემი შენახული ხელმოწერა</MenuItem><MenuItem value="draw">ახლავე დახატვა</MenuItem></TextField>{repMode === 'draw' && <Box sx={{ mt: 1 }}><SignaturePad onChange={setDrawnSignature} clearLabel="წაშლა" /></Box>}<Button sx={{ mt: 1 }} variant="outlined" onClick={applyRepresentative} disabled={busy || (repMode === 'draw' && !drawnSignature) || (repMode === 'saved' && !savedSignatureQuery.data?.signature)}>გამოყენება / შეცვლა</Button>{!savedSignatureQuery.data?.signature && <Typography sx={{ fontSize: 11, color: '#667085' }}>შეგიძლიათ ხელმოწერა შეინახოთ Shop Admin → Settings-ში.</Typography>}</>}</div></div></section>
              <Alert severity="info">შპს „ჯისთორ ლლტ“-ის შეთანხმების პირობები უცვლელად დაიბეჭდება PDF-ზე. ფასის ან სხვა მონაცემების შეცვლა აუქმებს უკვე შესრულებულ ხელმოწერებს.</Alert>
            </div>
          )}
        </DialogContent>
        <DialogActions className="zzv-agreement-dialog__actions"><Box sx={{ display: 'flex', gap: 1 }}><Button onClick={onClose}>დახურვა</Button>{finalized && <Button onClick={() => printTradeInAgreement(quote.id).catch(() => setError('PDF-ის გახსნა ვერ მოხერხდა.'))}>ხელახლა ბეჭდვა</Button>}</Box>{!finalized && <Box sx={{ display: 'flex', gap: 1 }}><Button variant="outlined" disabled={busy || !details} onClick={() => save().then(() => setMessage('მონახაზი შენახულია.')).catch((failure) => setError(failure.response?.data?.message || 'შენახვა ვერ მოხერხდა.'))}>მონახაზის შენახვა</Button><Button variant="contained" disabled={busy || !details} onClick={finalize}>გაფორმების დასრულება</Button></Box>}</DialogActions>
      </Dialog>
      <Dialog open={Boolean(qr)} onClose={() => setQr(null)} maxWidth="xs" fullWidth><DialogTitle>მომხმარებლის ხელმოწერა</DialogTitle><DialogContent className="zzv-agreement-dialog__qr">{qrImage && <img src={qrImage} alt="ხელმოწერის QR კოდი" />}<Typography sx={{ fontSize: 13 }}>მომხმარებელმა დაასკანეროს QR და მოაწეროს ხელი საკუთარ ტელეფონზე. ბმული მოქმედებს 15 წუთი, ერთხელ.</Typography><code>{qr && `${window.location.origin}/trade-in/sign/${qr.token}`}</code>{agreement?.customer_signed_at && <Alert severity="success">ხელმოწერა მიღებულია.</Alert>}</DialogContent><DialogActions><Button onClick={() => setQr(null)}>დახურვა</Button><Button onClick={issueLink} disabled={busy}>ახალი QR</Button></DialogActions></Dialog>
    </>
  );
};

export default TradeInFinalizeDialog;
