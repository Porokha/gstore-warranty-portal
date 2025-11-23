import React from 'react';
import { Box, Typography } from '@mui/material';

const ZevaLogo = ({ size = 'medium', showSubtitle = false, variant = 'default' }) => {
  const sizes = {
    small: { logo: 32, text: '20px', subtitle: '12px' },
    medium: { logo: 48, text: '28px', subtitle: '14px' },
    large: { logo: 64, text: '36px', subtitle: '16px' },
  };

  const currentSize = sizes[size] || sizes.medium;
  const textColor = variant === 'light' ? '#FFFFFF' : '#374151';
  const subtitleColor = variant === 'light' ? 'rgba(255,255,255,0.8)' : '#6B7280';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      {/* Logo Image - Replace with actual logo file */}
      <Box
        component="img"
        src="/logo.png"
        alt="ZEZVA Logo"
        onError={(e) => {
          // Fallback if logo image doesn't exist - show placeholder
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'block';
        }}
        sx={{
          width: currentSize.logo,
          height: currentSize.logo,
          objectFit: 'contain',
        }}
      />
      {/* Fallback placeholder if image doesn't exist */}
      <Box
        sx={{
          width: currentSize.logo,
          height: currentSize.logo,
          borderRadius: 1,
          bgcolor: variant === 'light' ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
          display: 'none',
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
            }}
          >
            Warranty & Service Management
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ZevaLogo;
