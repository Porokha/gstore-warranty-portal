import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpwardRounded as ArrowIcon,
  ShoppingBagRounded as ShopIcon,
  ShieldRounded as WarrantyIcon,
  HandymanRounded as ServiceIcon,
  AutorenewRounded as TradeIcon,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const tiles = [
  {
    key: 'shop',
    to: '/shop',
    icon: ShopIcon,
    accent: '#744de0',
    wash: 'linear-gradient(135deg, rgba(165, 118, 255, 0.2) 0%, rgba(255,255,255,0) 62%)',
  },
  {
    key: 'warranty',
    to: '/warranty-service?tab=warranty',
    icon: WarrantyIcon,
    accent: '#0f6e56',
    wash: 'linear-gradient(135deg, rgba(107, 225, 184, 0.22) 0%, rgba(255,255,255,0) 62%)',
  },
  {
    key: 'service',
    to: '/warranty-service?tab=case',
    icon: ServiceIcon,
    accent: '#993c1d',
    wash: 'linear-gradient(135deg, rgba(250, 190, 169, 0.24) 0%, rgba(255,255,255,0) 62%)',
  },
  {
    key: 'tradeIn',
    to: '/trade-in',
    icon: TradeIcon,
    accent: '#185fa5',
    wash: 'linear-gradient(135deg, rgba(112, 181, 244, 0.2) 0%, rgba(255,255,255,0) 62%)',
  },
];

const LandingPage = () => {
  const { t } = useTranslation();

  return (
    <Box
      component="main"
      sx={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, sm: 3 },
        py: { xs: 4, md: 7 },
        background:
          'radial-gradient(circle at 22% 18%, rgba(165,118,255,0.16), transparent 34%), radial-gradient(circle at 78% 76%, rgba(116,77,224,0.1), transparent 38%), linear-gradient(180deg, #fbf9ff 0%, #f3ecff 100%)',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 720 }}>
        <Typography
          component="h1"
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            p: 0,
            m: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {t('public.landing.title')}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: { xs: 1.4, sm: 1.5 },
          }}
        >
          {tiles.map((tile) => {
            const Icon = tile.icon;

            return (
              <Box
                key={tile.key}
                component={Link}
                to={tile.to}
                sx={{
                  position: 'relative',
                  minHeight: { xs: 154, sm: 210 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  gap: 1.25,
                  p: { xs: 2.25, sm: 3 },
                  overflow: 'hidden',
                  textDecoration: 'none',
                  borderRadius: { xs: '26px', sm: '32px' },
                  border: '1px solid rgba(165,118,255,0.2)',
                  background: 'rgba(255,255,255,0.82)',
                  boxShadow: '0 18px 50px rgba(78, 52, 136, 0.08)',
                  color: '#18181b',
                  transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    background: tile.wash,
                    transition: 'opacity 220ms ease',
                  },
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    borderColor: 'rgba(116,77,224,0.42)',
                    boxShadow: '0 24px 68px rgba(78, 52, 136, 0.13)',
                  },
                  '&:hover::before': {
                    opacity: 1,
                  },
                  '&:hover .landing-tile-icon': {
                    color: tile.accent,
                    transform: 'scale(1.12)',
                  },
                  '&:hover .landing-tile-arrow': {
                    opacity: 1,
                    transform: 'translate(0, 0) rotate(45deg)',
                  },
                }}
              >
                <ArrowIcon
                  className="landing-tile-arrow"
                  sx={{
                    position: 'absolute',
                    top: { xs: 18, sm: 22 },
                    right: { xs: 18, sm: 22 },
                    zIndex: 1,
                    color: '#8b829e',
                    fontSize: 18,
                    opacity: 0,
                    transform: 'translate(-4px, 4px) rotate(45deg)',
                    transition: 'opacity 180ms ease, transform 180ms ease',
                  }}
                />
                <Icon
                  className="landing-tile-icon"
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    width: 34,
                    height: 34,
                    color: '#6f6680',
                    transition: 'color 180ms ease, transform 180ms ease',
                  }}
                />
                <Typography
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    fontFamily: 'var(--font-platform-caps)',
                    fontSize: 11,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#827893',
                  }}
                >
                  {t(`public.landing.tiles.${tile.key}.label`)}
                </Typography>
                <Typography
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    fontSize: { xs: 22, sm: 26 },
                    lineHeight: 1,
                    fontWeight: 800,
                    color: '#18181b',
                  }}
                >
                  {t(`public.landing.tiles.${tile.key}.title`)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;
