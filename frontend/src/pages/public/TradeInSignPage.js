import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, Checkbox, FormControlLabel } from '@mui/material';
import { useMutation, useQuery } from 'react-query';
import SignaturePad from '../../components/trade-in/SignaturePad';
import { tradeInService } from '../../services/tradeInService';
import '../../components/trade-in/trade-in-agreement.css';

const TradeInSignPage = () => {
  const { token } = useParams();
  const [signature, setSignature] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [finished, setFinished] = useState(false);
  const { data, isLoading, error } = useQuery(['trade-in-signing', token], () => tradeInService.getPublicAgreementToSign(token), {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const submit = useMutation(() => tradeInService.submitPublicAgreementSignature(token, signature), {
    onSuccess: () => setFinished(true),
  });

  return (
    <main className="zzv-sign-page">
      <div className="zzv-sign-page__card">
        <div className="zzv-sign-page__eyebrow">ZEZVA TRADE-IN · GSTORE</div>
        {finished ? (
          <div className="zzv-sign-page__success"><h1>ხელმოწერა მიღებულია</h1><p>მადლობა. შეგიძლიათ დახუროთ ეს გვერდი; ჩვენი წარმომადგენელი დაასრულებს გაფორმებას.</p></div>
        ) : isLoading ? <p>იტვირთება...</p> : error ? (
          <Alert severity="error">{error.response?.data?.message || 'ბმული არ არის ხელმისაწვდომი. მოითხოვეთ ახალი QR კოდი.'}</Alert>
        ) : (
          <>
            <h1>ნასყიდობისა და მიღება-ჩაბარების ხელშეკრულება</h1>
            <p>№ {data.agreement_number}</p>
            <p className="zzv-sign-page__intro">გთხოვთ, ხელმოწერამდე გადაამოწმოთ შეთანხმებული პირობები.</p>
            <div className="zzv-sign-page__summary">
              <div><span>გამყიდველი</span><strong>{data.details.seller_name}</strong></div>
              <div><span>პირადი ნომერი</span><strong>{data.details.personal_id}</strong></div>
              <div><span>ტელეფონი</span><strong>{data.details.phone}</strong></div>
              <div><span>მისამართი</span><strong>{data.details.address}</strong></div>
              <div><span>მოწყობილობა</span><strong>{data.details.brand_model}</strong></div>
              <div><span>მეხსიერება / ფერი</span><strong>{data.details.storage} / {data.details.color}</strong></div>
              <div><span>IMEI / Serial Number</span><strong>{data.details.imei || '—'} / {data.details.serial || '—'}</strong></div>
              <div><span>კომპლექტაცია</span><strong>{data.details.included_items}</strong></div>
              <div><span>დაზიანებები / დეფექტები</span><strong>{data.details.defects}</strong></div>
              <div><span>ანგარიშსწორება</span><strong>{data.details.settlement_method === 'gstore_credit' ? 'Gstore კრედიტი' : data.details.settlement_method === 'bank' ? 'საბანკო გადარიცხვა' : 'ნაღდი'}</strong></div>
              <div><span>ნასყიდობის ფასი</span><strong>₾{Number(data.details.final_price).toFixed(2)}</strong></div>
              {data.details.settlement_method === 'gstore_credit' && <div><span>Gstore კრედიტი ბონუსით</span><strong>₾{(Number(data.details.final_price) + Number(data.details.credit_bonus)).toFixed(2)}</strong></div>}
              {data.details.settlement_method === 'gstore_credit' && data.details.gstore_product && <div><span>არჩეული Gstore პროდუქტი</span><strong>{data.details.gstore_product}</strong></div>}
              <div><span>მყიდველი</span><strong>{data.buyer}</strong></div>
            </div>
            <details className="zzv-sign-page__terms" open><summary>ხელშეკრულების პირობები</summary><ol>{data.terms.map((term) => <li key={term}>{term}</li>)}</ol></details>
            <h2>თქვენი ხელმოწერა</h2>
            <SignaturePad onChange={setSignature} clearLabel="წაშლა და ხელახლა დახატვა" />
            <FormControlLabel control={<Checkbox checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />} label="გავეცანი და ვეთანხმები ზემოთ მოცემულ პირობებს" />
            {submit.isError && <Alert severity="error">{submit.error?.response?.data?.message || 'ხელმოწერის შენახვა ვერ მოხერხდა.'}</Alert>}
            <Button variant="contained" fullWidth size="large" disabled={!signature || !accepted || submit.isLoading} onClick={() => submit.mutate()}>ხელმოწერის დასრულება</Button>
          </>
        )}
      </div>
    </main>
  );
};

export default TradeInSignPage;
