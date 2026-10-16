import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button } from '@mui/material';
import { useMutation, useQuery } from 'react-query';
import SignaturePad from '../../components/trade-in/SignaturePad';
import { tradeInService } from '../../services/tradeInService';
import '../../components/trade-in/trade-in-agreement.css';

const TradeInStaffSignPage = () => {
  const { token } = useParams();
  const [signature, setSignature] = useState('');
  const [finished, setFinished] = useState(false);
  const { data, isLoading, error } = useQuery(
    ['trade-in-staff-signing', token],
    () => tradeInService.getStaffSigningPreview(token),
    { retry: false, refetchOnWindowFocus: false },
  );
  const submit = useMutation(() => tradeInService.submitStaffSignature(token, signature), {
    onSuccess: () => setFinished(true),
  });

  return (
    <main className="zzv-sign-page">
      <div className="zzv-sign-page__card">
        <div className="zzv-sign-page__eyebrow">ZEZVA TRADE-IN · GSTORE</div>
        {finished ? (
          <div className="zzv-sign-page__success"><h1>ხელმოწერა მიღებულია</h1><p>შეგიძლიათ დახუროთ ეს გვერდი.</p></div>
        ) : isLoading ? <p>იტვირთება...</p> : error ? (
          <Alert severity="error">{error.response?.data?.message || 'ბმული არ არის ხელმისაწვდომი. შექმენით ახალი QR კოდი.'}</Alert>
        ) : (
          <>
            <h1>წარმომადგენლის ხელმოწერა</h1>
            <p className="zzv-sign-page__intro">{data.signer_name}</p>
            <p className="zzv-sign-page__intro">{data.purpose === 'agreement' ? `განაცხადი № ${data.quote_number} · ხელმოწერა დაემატება ამ ხელშეკრულებას.` : 'ხელმოწერა შეინახება თქვენს Shop Admin Settings-ში მომავალი ხელშეკრულებებისთვის.'}</p>
            <SignaturePad onChange={setSignature} clearLabel="წაშლა და ხელახლა დახატვა" />
            {submit.isError && <Alert severity="error">{submit.error?.response?.data?.message || 'ხელმოწერის შენახვა ვერ მოხერხდა.'}</Alert>}
            <Button variant="contained" fullWidth size="large" disabled={!signature || submit.isLoading} onClick={() => submit.mutate()}>ხელმოწერის დასრულება</Button>
          </>
        )}
      </div>
    </main>
  );
};

export default TradeInStaffSignPage;
