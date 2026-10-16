import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useQuery } from 'react-query';
import QRCode from 'qrcode';
import { tradeInService } from '../../services/tradeInService';
import './trade-in-agreement.css';

const StaffSignatureQrDialog = ({ quoteId, onClose, onSigned }) => {
  const [link, setLink] = useState(null);
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const started = useRef(false);
  const reported = useRef(false);
  const url = link ? `${window.location.origin}/trade-in/staff-sign/${link.token}` : '';
  const { data: status } = useQuery(
    ['trade-in-staff-signing-status', link?.id],
    () => tradeInService.getStaffSigningStatus(link.id),
    { enabled: Boolean(link?.id), refetchInterval: link && !reported.current ? 2500 : false, retry: false },
  );

  const issueLink = async () => {
    setLoading(true);
    setError('');
    setImage('');
    try {
      const next = quoteId === undefined
        ? await tradeInService.createOwnSignatureSigningLink()
        : await tradeInService.createRepresentativeSigningLink(quoteId);
      reported.current = false;
      setLink(next);
    } catch (failure) {
      setError(failure.response?.data?.message || 'QR კოდის შექმნა ვერ მოხერხდა.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    issueLink();
  }, []); // The dialog is mounted only while the QR flow is open.

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 360, margin: 2, errorCorrectionLevel: 'M' })
      .then(setImage).catch(() => setError('QR კოდის გამოსახვა ვერ მოხერხდა.'));
  }, [url]);

  useEffect(() => {
    if (!status?.signed || reported.current) return;
    reported.current = true;
    onSigned();
  }, [status?.signed, onSigned]);

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth className="zzv-agreement-dialog__qr-modal">
      <DialogTitle>{quoteId === undefined ? 'ჩემი ხელმოწერის შენახვა ტელეფონით' : 'წარმომადგენლის ხელმოწერა ტელეფონით'}</DialogTitle>
      <DialogContent className="zzv-agreement-dialog__qr">
        {image && <img src={image} alt="წარმომადგენლის ხელმოწერის QR კოდი" />}
        {loading && <Typography>QR კოდი იქმნება...</Typography>}
        <Typography sx={{ fontSize: 13 }}>დაასკანერეთ QR თქვენს ტელეფონზე და დახატეთ ხელმოწერა. ბმული მოქმედებს 15 წუთი და გამოიყენება ერთხელ.</Typography>
        {url && <code>{url}</code>}
        {status?.signed && <Alert severity="success">ხელმოწერა მიღებულია.</Alert>}
        {status?.expired && <Alert severity="warning">ბმულს ვადა გაუვიდა. შექმენით ახალი QR კოდი.</Alert>}
        {error && <Alert severity="error">{String(error)}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>დახურვა</Button>
        <Button onClick={issueLink} disabled={loading}>ახალი QR</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StaffSignatureQrDialog;
