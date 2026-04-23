import React from 'react';
import { Box, Typography } from '@mui/material';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { useTranslation } from 'react-i18next';

const PrivacyPage = () => {
  const { t } = useTranslation();

  const collectedItems = [
    { icon: <PersonOutlineIcon sx={{ fontSize: 18 }} />, label: t('public.privacy.collectedItems.fullName') },
    { icon: <PhoneOutlinedIcon sx={{ fontSize: 18 }} />, label: t('public.privacy.collectedItems.phone') },
    { icon: <MailOutlineIcon sx={{ fontSize: 18 }} />, label: t('public.privacy.collectedItems.email') },
    { icon: <LocalShippingOutlinedIcon sx={{ fontSize: 18 }} />, label: t('public.privacy.collectedItems.deliveryAddress') },
  ];

  const useItems = [
    t('public.privacy.useItems.0'),
    t('public.privacy.useItems.1'),
    t('public.privacy.useItems.2'),
    t('public.privacy.useItems.3'),
  ];

  const rightsItems = [
    t('public.privacy.rightsItems.0'),
    t('public.privacy.rightsItems.1'),
    t('public.privacy.rightsItems.2'),
  ];

  return (
    <Box
      sx={{
        background:
          'radial-gradient(circle at top left, rgba(91,124,255,0.1), transparent 28%), radial-gradient(circle at top right, rgba(91,124,255,0.08), transparent 26%), linear-gradient(180deg, #f8fbff 0%, #f5f8ff 100%)',
        color: '#18212b',
        py: { xs: 5, md: 7 },
      }}
    >
      <Box sx={{ width: 'min(calc(100% - 32px), 1024px)', mx: 'auto', display: 'grid', gap: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(91,124,255,0.12)',
              color: '#3f5ed6',
              flex: '0 0 auto',
            }}
          >
            <ShieldOutlinedIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              sx={{
                mb: 0.5,
                color: '#3f5ed6',
                fontSize: '12px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                fontFamily: '"BPG Banner Quadrosquare Caps", sans-serif',
              }}
            >
              {t('public.privacy.eyebrow')}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                m: 0,
                fontSize: { xs: '30px', md: '38px' },
                lineHeight: 1.02,
                fontFamily: '"BPG Banner Quadrosquare Caps", sans-serif',
              }}
            >
              {t('public.privacy.title')}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 3.5,
            p: { xs: 2, md: 3.5 },
            border: '1px solid #d8e2f0',
            borderRadius: '24px',
            background: 'rgba(255,255,255,0.82)',
            boxShadow: '0 18px 46px rgba(15, 23, 42, 0.08)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box>
            <Typography sx={{ mb: 1.5, fontSize: '22px', fontWeight: 700 }}>
              {t('public.privacy.collectTitle')}
            </Typography>
            <Typography sx={{ m: 0, color: '#5b6778', lineHeight: 1.7 }}>
              {t('public.privacy.collectDescription')}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 2 }}>
              {collectedItems.map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    p: 1.75,
                    borderRadius: '14px',
                    border: '1px solid #d8e2f0',
                    background: 'rgba(255,255,255,0.7)',
                  }}
                >
                  <Box sx={{ color: '#3f5ed6', display: 'grid', placeItems: 'center' }}>{item.icon}</Box>
                  <Typography sx={{ fontSize: '14px', color: '#18212b' }}>{item.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography sx={{ mb: 1.5, fontSize: '22px', fontWeight: 700 }}>
              {t('public.privacy.useTitle')}
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.25 }}>
              {useItems.map((item) => (
                <Box component="li" key={item} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, color: '#5b6778', lineHeight: 1.7 }}>
                  <CheckCircleIcon sx={{ mt: '2px', fontSize: 18, color: '#3f5ed6', flex: '0 0 auto' }} />
                  <Typography sx={{ fontSize: '15px' }}>{item}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography sx={{ mb: 1.5, fontSize: '22px', fontWeight: 700 }}>
              {t('public.privacy.protectionTitle')}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                p: 2,
                borderRadius: '16px',
                border: '1px solid rgba(0, 166, 126, 0.28)',
                background: 'rgba(0, 166, 126, 0.08)',
              }}
            >
              <LockOutlinedIcon sx={{ fontSize: 22, color: '#00a67e', flex: '0 0 auto' }} />
              <Box>
                <Typography sx={{ mb: 0.75, fontWeight: 700 }}>{t('public.privacy.protectionLabel')}</Typography>
                <Typography sx={{ color: '#5b6778', lineHeight: 1.7 }}>
                  {t('public.privacy.protectionDescription')}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box>
            <Typography sx={{ mb: 1.5, fontSize: '22px', fontWeight: 700 }}>
              {t('public.privacy.cookiesTitle')}
            </Typography>
            <Typography sx={{ color: '#5b6778', lineHeight: 1.7 }}>
              {t('public.privacy.cookiesDescription')}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ mb: 1.5, fontSize: '22px', fontWeight: 700 }}>
              {t('public.privacy.rightsTitle')}
            </Typography>
            <Typography sx={{ mb: 1.25, color: '#5b6778', lineHeight: 1.7 }}>
              {t('public.privacy.rightsIntro')}
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.1 }}>
              {rightsItems.map((item) => (
                <Box component="li" key={item} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, color: '#5b6778', lineHeight: 1.7 }}>
                  <ArrowRightAltIcon sx={{ mt: '2px', fontSize: 18, color: '#3f5ed6', flex: '0 0 auto' }} />
                  <Typography sx={{ fontSize: '15px' }}>{item}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PrivacyPage;
