import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { tradeInService } from '../../services/tradeInService';
import VoucherBarcode from './VoucherBarcode';
import './trade-in-voucher.css';

const TradeInVoucherPage = () => {
  const { token } = useParams();
  const { data, isLoading, isError } = useQuery(['trade-in-voucher', token], () => tradeInService.getVoucher(token), {
    retry: false, refetchOnWindowFocus: true, refetchInterval: 60000,
  });

  return <main className="zzv-voucher-page">
    {isLoading && <p>ვაუჩერი იტვირთება...</p>}
    {isError && <p>ვაუჩერი ვერ მოიძებნა. გადაამოწმეთ ბმული.</p>}
    {data && <article className={`zzv-voucher zzv-voucher--${data.status}`}>
      <div className="zzv-voucher__main">
        <span className="zzv-voucher__brand">ZEZVA <small>TRADE-IN</small></span>
        <p>Gstore-ში ახალი ტექნიკის შესაძენად</p>
        <strong>₾{Number(data.amount).toLocaleString('ka-GE', { minimumFractionDigits: 2 })}</strong>
        <span className="zzv-voucher__expiry">მოქმედებს {new Date(data.expires_at).toLocaleDateString('ka-GE')}-მდე</span>
      </div>
      <div className="zzv-voucher__stub">
        <span className="zzv-voucher__label">ვაუჩერის კოდი</span>
        <strong className="zzv-voucher__code">{data.code}</strong>
        {data.status === 'active' && <VoucherBarcode code={data.code} />}
        <span className="zzv-voucher__instruction">წარუდგინეთ კოდი Gstore-ის თანამშრომელს</span>
        {data.status !== 'active' && <span className="zzv-voucher__stamp">{data.status === 'used' ? 'გამოყენებულია' : 'ვადა ამოიწურა'}</span>}
      </div>
    </article>}
    {data?.status === 'used' && <p className="zzv-voucher-page__note">ეს ვაუჩერი უკვე გამოყენებულია.</p>}
    {data?.status === 'expired' && <p className="zzv-voucher-page__note">ამ ვაუჩერის მოქმედების ვადა ამოიწურა.</p>}
  </main>;
};

export default TradeInVoucherPage;
