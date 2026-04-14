import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';

const ZevaLogo = ({ size = 'medium', showSubtitle = false, variant = 'default' }) => {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const sizes = {
    small: { logo: 42, text: '20px', subtitle: '12px' },
    medium: { logo: 180, text: '28px', subtitle: '14px' },
    large: { logo: 240, text: '36px', subtitle: '16px' },
  };

  const currentSize = sizes[size] || sizes.medium;
  const isLight = variant === 'light';
  const textColor = isLight ? '#FFFFFF' : '#18181B';
  const subtitleColor = isLight ? 'rgba(255,255,255,0.84)' : '#5B5568';
  const logoSrc =
    size === 'small'
      ? (isLight ? '/brand-logotype-original.svg' : '/brand-logotype-black.svg')
      : '/brand-logo-horizontal.svg';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.25,
      }}
    >
      <Box
        component="img"
        src={logoSrc}
        alt="ZEZVA"
        onLoad={() => setLogoLoaded(true)}
        onError={() => setLogoError(true)}
        sx={{
          width: currentSize.logo,
          height: 'auto',
          objectFit: 'contain',
          display: logoError ? 'none' : 'block',
        }}
      />
      {logoError && (
        <Box
          sx={{
            width: currentSize.logo,
            height: currentSize.logo,
            borderRadius: 2,
            bgcolor: isLight ? 'rgba(255,255,255,0.14)' : '#f3ecff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: `${parseInt(currentSize.logo) * 0.4}px`,
              color: textColor,
            }}
          >
            Z
          </Typography>
        </Box>
      )}
      {logoError && (
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: currentSize.text,
              color: textColor,
              letterSpacing: '0.08em',
              lineHeight: 1,
              textAlign: 'center',
            }}
          >
            ZEZVA
          </Typography>
          {showSubtitle && (
            <Typography
              variant="caption"
              sx={{
                fontSize: currentSize.subtitle,
                color: subtitleColor,
                fontWeight: 400,
                display: 'block',
                mt: 0.25,
                textAlign: 'center',
              }}
            >
              Warranty & Service Portal
            </Typography>
          )}
        </Box>
      )}
      {logoLoaded && showSubtitle && (
        <Typography
          variant="caption"
          sx={{
            fontSize: currentSize.subtitle,
            color: subtitleColor,
            fontWeight: 600,
            display: 'block',
            textAlign: 'center',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Warranty & Service Portal
        </Typography>
      )}
    </Box>
  );
};

export default ZevaLogo;
