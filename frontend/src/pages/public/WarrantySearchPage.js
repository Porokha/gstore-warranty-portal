import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, TextField, Button, Typography, Paper, Chip, Alert, Grid, IconButton, Link, Accordion, AccordionSummary, AccordionDetails, CircularProgress, Container, InputAdornment } from '@mui/material';
import { ArrowBack, ExpandMore, Search as SearchIcon, VerifiedUser as WarrantyIcon, PictureAsPdf as PdfIcon, Print as PrintIcon } from '@mui/icons-material';
import api from '../../services/api';
import StatusBar from '../../components/cases/StatusBar';
import ResultBar from '../../components/cases/ResultBar';
import jsPDF from 'jspdf';

const WarrantySearchPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [warrantyId, setWarrantyId] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCases, setExpandedCases] = useState({});
  const [caseDetails, setCaseDetails] = useState({});
  const [loadingCases, setLoadingCases] = useState({});

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await api.post('/public/search/warranty', {
        warranty_id: warrantyId,
        phone,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || t('warrantySearch.notFound'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (level) => {
    const statuses = {
      1: t('status.opened'),
      2: t('status.investigating'),
      3: t('status.pending'),
      4: t('status.completed'),
    };
    return statuses[level] || 'Unknown';
  };

  const handleCaseExpand = async (caseId, caseNumber) => {
    const isExpanded = expandedCases[caseId];
    setExpandedCases({ ...expandedCases, [caseId]: !isExpanded });

    if (!isExpanded && !caseDetails[caseId]) {
      setLoadingCases({ ...loadingCases, [caseId]: true });
      try {
        const response = await api.post('/public/search/case', {
          case_number: caseNumber,
          phone: phone,
        });
        setCaseDetails({ ...caseDetails, [caseId]: response.data });
      } catch (err) {
        console.error('Failed to load case details:', err);
      } finally {
        setLoadingCases({ ...loadingCases, [caseId]: false });
      }
    }
  };

  const generatePDF = async () => {
    if (!result) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Set background color
    pdf.setFillColor(251, 249, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Rasterize the current brand logo at a sane size for crisp but compact PDFs.
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = process.env.PUBLIC_URL + '/brand-logo-horizontal.svg';

      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          pdf.setFontSize(28);
          pdf.setTextColor(24, 24, 27);
          pdf.setFont(undefined, 'bold');
          pdf.text('ZEZVA', pageWidth / 2, yPos, { align: 'center' });
          yPos += 12;
          resolve();
        }, 2500);

        logoImg.onload = () => {
          clearTimeout(timeout);
          try {
            const canvas = document.createElement('canvas');
            const targetWidth = 600;
            const targetHeight = Math.round((logoImg.height / logoImg.width) * targetWidth);
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(logoImg, 0, 0, targetWidth, targetHeight);

            const logoWidth = 78;
            const logoHeight = (targetHeight / targetWidth) * logoWidth;
            const logoX = (pageWidth - logoWidth) / 2;

            pdf.addImage(canvas.toDataURL('PNG'), 'PNG', logoX, yPos, logoWidth, logoHeight);
            yPos += logoHeight + 15;
            resolve();
          } catch (err) {
            clearTimeout(timeout);
            pdf.setFontSize(28);
            pdf.setTextColor(24, 24, 27);
            pdf.setFont(undefined, 'bold');
            pdf.text('ZEZVA', pageWidth / 2, yPos, { align: 'center' });
            yPos += 12;
            resolve();
          }
        };
        logoImg.onerror = () => {
          clearTimeout(timeout);
          pdf.setFontSize(28);
          pdf.setTextColor(24, 24, 27);
          pdf.setFont(undefined, 'bold');
          pdf.text('ZEZVA', pageWidth / 2, yPos, { align: 'center' });
          yPos += 12;
          resolve();
        };
      });
    } catch (err) {
      // Fallback to text logo
      pdf.setFontSize(28);
      pdf.setTextColor(24, 24, 27);
      pdf.setFont(undefined, 'bold');
      pdf.text('ZEZVA', pageWidth / 2, yPos, { align: 'center' });
      yPos += 12;
    }

    // Title with styling
    pdf.setFontSize(24);
    pdf.setTextColor(24, 24, 27);
    pdf.setFont(undefined, 'bold');
    pdf.text(t('warrantySearch.warrantyDetails'), pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    // Divider line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Warranty Information with styled boxes
    const lineHeight = 9;
    const fieldSpacing = 2;
    const boxPadding = 3;
    const labelWidth = 50;

    const fields = [
      { label: t('warrantySearch.warrantyId'), value: result.warranty_id, highlight: true },
      { label: t('warrantySearch.status'), value: result.is_active ? t('warrantySearch.active') : t('warrantySearch.expired'), highlight: true },
      { label: t('warrantySearch.product'), value: result.title },
      { label: t('warrantySearch.sku'), value: result.sku || 'N/A' },
      { label: t('warrantySearch.serialNumber'), value: result.serial_number || 'N/A' },
      { label: t('warrantySearch.deviceType'), value: result.device_type || 'N/A' },
      { label: t('warrantySearch.purchaseDate'), value: new Date(result.purchase_date).toLocaleDateString() },
      { label: t('warrantySearch.warrantyStart'), value: new Date(result.warranty_start).toLocaleDateString() },
      { label: t('warrantySearch.warrantyEnd'), value: new Date(result.warranty_end).toLocaleDateString() },
    ];

    if (result.is_active && result.days_left !== null) {
      fields.push({ label: t('warrantySearch.daysRemaining'), value: `${result.days_left} ${t('common.days')}`, highlight: true });
    }

    fields.forEach((field, index) => {
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        pdf.setFillColor(252, 244, 232);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        yPos = margin;
      }

      // Background box for highlighted fields
      if (field.highlight) {
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.3);
        // roundedRect(x, y, width, height, rx, ry, style)
        pdf.roundedRect(margin - boxPadding, yPos - 6, contentWidth + (boxPadding * 2), lineHeight + 2, 2, 2, 'FD');
      }

      // Label
      pdf.setFontSize(10);
      pdf.setTextColor(91, 85, 104);
      pdf.setFont(undefined, 'normal');
      pdf.text(field.label + ':', margin, yPos);

      // Value
      pdf.setFontSize(11);
      pdf.setTextColor(24, 24, 27);
      if (field.highlight) {
        pdf.setFont(undefined, 'bold');
      } else {
        pdf.setFont(undefined, 'normal');
      }
      
      // Handle long text wrapping
      const maxValueWidth = contentWidth - labelWidth - 10;
      const valueLines = pdf.splitTextToSize(field.value, maxValueWidth);
      pdf.text(valueLines, margin + labelWidth, yPos);
      
      if (valueLines.length > 1) {
        yPos += (valueLines.length - 1) * 5;
      }
      
      yPos += lineHeight + fieldSpacing;
    });

    // Footer divider
    yPos += 5;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Report date in footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.setFont(undefined, 'italic');
    pdf.text(t('warrantySearch.reportDate') + ': ' + new Date().toLocaleString(), margin, yPos);

    // Compress PDF before saving
    const pdfOutput = pdf.output('arraybuffer');
    
    // Save PDF with compression
    const blob = new Blob([pdfOutput], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `warranty-${result.warranty_id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 70px)',
        background: 'linear-gradient(180deg, #fbf9ff 0%, #f3ecff 100%)',
        pt: 4,
        pb: 8,
      }}
    >
      <Container maxWidth="md">
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <IconButton
            onClick={() => navigate('/warranty-service')}
            aria-label="back"
            sx={{
              bgcolor: '#ffffff',
              border: '1px solid #e3d7ff',
              '&:hover': { bgcolor: '#f3ecff' },
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography
            variant="h4"
            onClick={() => navigate('/')}
            sx={{
              cursor: 'pointer',
              textDecoration: 'none',
              color: '#18181b',
              fontWeight: 700,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {t('warrantySearch.title')}
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            boxShadow: '0 28px 90px rgba(63, 30, 120, 0.1)',
            bgcolor: '#ffffff',
            border: '1px solid #e3d7ff',
          }}
        >
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: '#a576ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WarrantyIcon sx={{ color: '#ffffff', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#18181b' }}>
              {t('warrantySearch.findWarranty')}
            </Typography>
          </Box>

          <form onSubmit={handleSearch}>
            <TextField
              fullWidth
              label={t('warrantySearch.warrantyId')}
              value={warrantyId}
              onChange={(e) => setWarrantyId(e.target.value)}
              margin="normal"
              required
              placeholder="e.g., WP-0001-1234"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#a576ff',
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label={t('warrantySearch.phoneNumber')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              margin="normal"
              required
              placeholder="e.g., +995 555 123 456"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#a576ff',
                  },
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              startIcon={<SearchIcon />}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                bgcolor: '#a576ff',
                color: '#111111',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#8f5ef0',
                  color: '#ffffff',
                },
              }}
            >
              {loading ? t('warrantySearch.searching') : t('warrantySearch.search')}
            </Button>
          </form>

          {error && (
            <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {result && (
            <Box sx={{ mt: 4 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  {t('warrantySearch.warrantyDetails')}
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<PdfIcon />}
                    onClick={generatePDF}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      borderColor: '#3b82f6',
                      color: '#3b82f6',
                      '&:hover': {
                        borderColor: '#2563eb',
                        bgcolor: 'rgba(59, 130, 246, 0.04)',
                      },
                    }}
                  >
                    PDF
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      borderColor: '#3b82f6',
                      color: '#3b82f6',
                      '&:hover': {
                        borderColor: '#2563eb',
                        bgcolor: 'rgba(59, 130, 246, 0.04)',
                      },
                    }}
                  >
                    {t('warrantySearch.print')}
                  </Button>
                </Box>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    {t('warrantySearch.warrantyId')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '16px' }}>
                    {result.warranty_id}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    {t('warrantySearch.status')}
                  </Typography>
                  <Chip
                    label={result.is_active ? t('warrantySearch.active') : t('warrantySearch.expired')}
                    sx={{
                      bgcolor: result.is_active ? '#d1fae5' : '#f1f5f9',
                      color: result.is_active ? '#059669' : '#64748b',
                      fontWeight: 500,
                      mt: 0.5,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    {t('warrantySearch.product')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '16px' }}>
                    {result.title}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    {t('warrantySearch.sku')}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1e293b', fontSize: '15px' }}>
                    {result.sku}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    {t('warrantySearch.serialNumber')}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1e293b', fontSize: '15px' }}>
                    {result.serial_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    {t('warrantySearch.deviceType')}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1e293b', fontSize: '15px' }}>
                    {result.device_type}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    {t('warrantySearch.purchaseDate')}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1e293b', fontSize: '15px' }}>
                    {new Date(result.purchase_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    {t('warrantySearch.warrantyStart')}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1e293b', fontSize: '15px' }}>
                    {new Date(result.warranty_start).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                    {t('warrantySearch.warrantyEnd')}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1e293b', fontSize: '15px' }}>
                    {new Date(result.warranty_end).toLocaleDateString()}
                  </Typography>
                </Grid>
                {result.is_active && result.days_left !== null && (
                  <Grid item xs={12}>
                    <Alert
                      severity={result.days_left <= 30 ? 'warning' : 'info'}
                      sx={{ borderRadius: 2 }}
                    >
                      {result.days_left} {t('warrantySearch.daysRemaining')}
                    </Alert>
                  </Grid>
                )}
                {!result.is_active && result.days_after_warranty !== null && (
                  <Grid item xs={12}>
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      {t('warrantySearch.warrantyExpired')} {result.days_after_warranty} {t('warrantySearch.daysAgo')}
                    </Alert>
                  </Grid>
                )}
                {result.extended_days > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                      {t('warrantySearch.extendedDays')}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#1e293b', fontSize: '15px' }}>
                      +{result.extended_days} {t('common.days')}
                    </Typography>
                  </Grid>
                )}
                {result.service_cases && result.service_cases.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 1.5, fontSize: '13px', fontWeight: 500 }}>
                      {t('warrantySearch.serviceCases')} ({result.service_cases.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {result.service_cases.map((serviceCase) => {
                        const isExpanded = expandedCases[serviceCase.id];
                        const details = caseDetails[serviceCase.id];
                        const isLoading = loadingCases[serviceCase.id];
                        
                        return (
                          <Accordion
                            key={serviceCase.id}
                            expanded={isExpanded}
                            onChange={() => handleCaseExpand(serviceCase.id, serviceCase.case_number)}
                            sx={{
                              borderRadius: 2,
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                              '&:before': { display: 'none' },
                            }}
                          >
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 2 }}>
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '15px' }}>
                                    {serviceCase.case_number}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px', mt: 0.5 }}>
                                    {t('warrantySearch.status')}: {getStatusLabel(serviceCase.status_level)} • {t('warrantySearch.opened')}: {new Date(serviceCase.opened_at).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              {isLoading ? (
                                <Box display="flex" justifyContent="center" p={2}>
                                  <CircularProgress size={24} />
                                </Box>
                              ) : details ? (
                                <Box>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                                        {t('warrantySearch.customerName')}
                                      </Typography>
                                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '15px' }}>
                                        {details.customer_name} {details.customer_last_name || ''}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                                        {t('warrantySearch.product')}
                                      </Typography>
                                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '15px' }}>
                                        {details.product_title}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                      <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontSize: '13px' }}>
                                        {t('warrantySearch.status')}
                                      </Typography>
                                      <StatusBar statusLevel={details.status_level} size="small" />
                                    </Grid>
                                    {details.result_type && (
                                      <Grid item xs={12}>
                                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontSize: '13px' }}>
                                          {t('warrantySearch.result')}
                                        </Typography>
                                        <ResultBar resultType={details.result_type} size="small" />
                                      </Grid>
                                    )}
                                    {details.customer_initial_note && (
                                      <Grid item xs={12}>
                                        <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '13px' }}>
                                          {t('warrantySearch.customerNote')}
                                        </Typography>
                                        <Alert severity="info" sx={{ mt: 0.5, borderRadius: 2 }}>
                                          {details.customer_initial_note}
                                        </Alert>
                                      </Grid>
                                    )}
                                    {details.status_history && details.status_history.length > 0 && (
                                      <Grid item xs={12}>
                                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontSize: '13px', fontWeight: 500 }}>
                                          {t('warrantySearch.statusUpdates')}
                                        </Typography>
                                        {details.status_history.map((history, idx) => (
                                          <Alert key={idx} severity="info" sx={{ mt: 1, borderRadius: 2 }}>
                                            <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                              {new Date(history.created_at).toLocaleString()}
                                            </Typography>
                                            {history.note_public && (
                                              <Typography variant="body2" sx={{ mt: 0.5, fontSize: '13px' }}>
                                                {history.note_public}
                                              </Typography>
                                            )}
                                          </Alert>
                                        ))}
                                      </Grid>
                                    )}
                                  </Grid>
                                </Box>
                              ) : (
                                <Typography sx={{ color: '#64748b', fontSize: '14px' }}>{t('warrantySearch.clickToLoad')}</Typography>
                              )}
                            </AccordionDetails>
                          </Accordion>
                        );
                      })}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default WarrantySearchPage;
