import React from 'react';
import { Box, Typography } from '@mui/material';

const ZevaLogo = ({ size = 'medium', showSubtitle = false, variant = 'default' }) => {
  const sizes = {
    small: { logo: 32, text: '20px', subtitle: '12px' },
    medium: { logo: 48, text: '28px', subtitle: '14px' },
    large: { logo: 64, text: '36px', subtitle: '16px' },
  };

  const currentSize = sizes[size] || sizes.medium;

  // Gem shape SVG
  const GemShape = ({ width, height, color }) => (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main gem shape - faceted crystal */}
      <path
        d="M50 10 L75 30 L75 70 L50 90 L25 70 L25 30 Z"
        fill={color}
        stroke="#374151"
        strokeWidth="1.5"
      />
      {/* Facet lines */}
      <path
        d="M50 10 L50 90 M25 50 L75 50 M37.5 35 L62.5 35 M37.5 65 L62.5 65"
        stroke="#4B5563"
        strokeWidth="1"
        opacity="0.6"
      />
      {/* Highlight facets */}
      <path
        d="M50 10 L62.5 35 L50 50 Z"
        fill="#E5E7EB"
        opacity="0.3"
      />
      <path
        d="M50 10 L37.5 35 L50 50 Z"
        fill="#9CA3AF"
        opacity="0.2"
      />
    </svg>
  );

  const logoColor = variant === 'light' ? '#E5E7EB' : '#D1D5DB';
  const textColor = variant === 'light' ? '#FFFFFF' : '#374151';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          filter: variant === 'light' ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
        }}
      >
        <GemShape width={currentSize.logo} height={currentSize.logo} color={logoColor} />
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
              color: variant === 'light' ? 'rgba(255,255,255,0.8)' : '#6B7280',
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

