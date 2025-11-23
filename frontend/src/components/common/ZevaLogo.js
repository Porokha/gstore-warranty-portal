import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';

const ZevaLogo = ({ size = 'medium', showSubtitle = false, variant = 'default' }) => {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const sizes = {
    small: { logo: 40, text: '20px', subtitle: '12px' },
    medium: { logo: 60, text: '28px', subtitle: '14px' },
    large: { logo: 140, text: '36px', subtitle: '16px' },
  };

  const currentSize = sizes[size] || sizes.medium;
  const textColor = variant === 'light' ? '#FFFFFF' : '#374151';
  const subtitleColor = variant === 'light' ? 'rgba(255,255,255,0.8)' : '#6B7280';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {/* Logo Image */}
      <Box
        component="img"
        src="/logo.png"
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
      {/* Fallback placeholder if image doesn't exist */}
      {logoError && (
        <Box
          sx={{
            width: currentSize.logo,
            height: currentSize.logo,
            borderRadius: 1,
            bgcolor: variant === 'light' ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
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
      {/* Only show text if logo failed to load */}
      {logoError && (
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: currentSize.text,
              color: textColor,
              letterSpacing: '0.5px',
              lineHeight: 1,
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
              Warranty & Service Management
            </Typography>
          )}
        </Box>
      )}
      {/* Show subtitle below logo if logo loaded successfully */}
      {logoLoaded && showSubtitle && (
        <Typography
          variant="caption"
          sx={{
            fontSize: currentSize.subtitle,
            color: subtitleColor,
            fontWeight: 400,
            display: 'block',
            textAlign: 'center',
          }}
        >
          Warranty & Service Management
        </Typography>
      )}
    </Box>
  );
};

export default ZevaLogo;
