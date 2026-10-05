import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Paper,
  Toolbar,
  Typography,
} from '@mui/material';
import { CurrencyExchangeRounded, Inventory2, ReceiptLong, Settings } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { shopService } from '../../services/shopService';
import { tradeInService } from '../../services/tradeInService';
import LanguageSwitcher from './LanguageSwitcher';

const navItems = [
  { path: '/shop/admin/products', labelKey: 'shopAdminNav.products', icon: <Inventory2 fontSize="small" /> },
  { path: '/shop/admin/orders', labelKey: 'shopAdminNav.orders', icon: <ReceiptLong fontSize="small" /> },
  { path: '/shop/admin/trade-in', labelKey: 'shopAdminNav.tradeIn', icon: <CurrencyExchangeRounded fontSize="small" /> },
  { path: '/shop/admin/settings', labelKey: 'shopAdminNav.settings', icon: <Settings fontSize="small" /> },
];

const ShopAdminLayout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayName = [user?.name, user?.last_name].filter(Boolean).join(' ').trim() || user?.username || 'Admin';
  const displayInitial = displayName.charAt(0).toUpperCase() || 'A';
  const { data: activeOrders = [] } = useQuery(
    ['shop-admin-orders-badge'],
    () => shopService.getOrders('active'),
    {
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
    },
  );
  const unreadOrdersCount = activeOrders.filter((order) => !order.viewed_at).length;
  const { data: tradeInCounts } = useQuery(
    ['shop-admin-trade-in-badge'],
    tradeInService.getAdminQuoteCounts,
    {
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
    },
  );
  const pendingTradeInCount = tradeInCounts?.pending || 0;

  return (
    <Box
      className="zzv-shop-admin-shell"
      sx={{
        minHeight: '100vh',
        bgcolor: 'var(--zzv-bg-page)',
        '& .MuiPaper-root': {
          borderRadius: '12px !important',
        },
        '& .MuiButton-root, & .MuiChip-root, & .MuiOutlinedInput-root, & .MuiAlert-root, & .MuiTabs-root .MuiTab-root': {
          borderRadius: '8px !important',
        },
        '& .MuiAvatar-root': {
          borderRadius: '50% !important',
        },
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: '#fff',
          color: 'var(--zzv-text-primary)',
          borderBottom: '1px solid var(--zzv-border-subtle)',
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important' }}>
          <Container
            className="zzv-shop-admin-header"
            maxWidth="xl"
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
          >
            <Box className="zzv-shop-admin-header__brand" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                component="img"
                src="/figma-staff/dashboard-logo.svg"
                alt="ZEZVA"
                sx={{ width: 99, height: 16 }}
              />
            </Box>

            <Box className="zzv-shop-admin-header__nav" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {navItems.map((item) => {
                const active =
                  location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

                return (
                  <Button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    startIcon={
                      item.path === '/shop/admin/orders' || item.path === '/shop/admin/trade-in' ? (
                        <Badge
                          color="error"
                          badgeContent={
                            item.path === '/shop/admin/orders'
                              ? unreadOrdersCount
                              : pendingTradeInCount
                          }
                          invisible={
                            item.path === '/shop/admin/orders'
                              ? unreadOrdersCount === 0
                              : pendingTradeInCount === 0
                          }
                          max={99}
                          sx={{
                            '& .MuiBadge-badge': {
                              minWidth: 18,
                              height: 18,
                              px: 0.5,
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: 800,
                            },
                          }}
                        >
                          {item.icon}
                        </Badge>
                      ) : (
                        item.icon
                      )
                    }
                    sx={{
                      textTransform: 'none',
                      fontWeight: active ? 600 : 500,
                      fontSize: 12,
                      px: 1.5,
                      color: active ? 'var(--zzv-text-primary)' : 'var(--zzv-text-secondary)',
                      bgcolor: active ? 'var(--zzv-bg-subtle)' : 'transparent',
                      '&:hover': {
                        bgcolor: 'var(--zzv-bg-subtle)',
                      },
                    }}
                  >
                    {t(item.labelKey)}
                  </Button>
                );
              })}
            </Box>

            <Box className="zzv-shop-admin-header__account" sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <LanguageSwitcher compact />
              <Paper
                elevation={0}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  bgcolor: '#fff',
                  border: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: 'var(--zzv-bg-inverse)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800,
                  }}
                >
                  {displayInitial}
                </Avatar>
                <Typography sx={{ fontSize: '13px', color: '#70687e', lineHeight: 1.1 }}>
                  {displayName}
                </Typography>
              </Paper>
              <Button
                onClick={() => {
                  logout();
                  navigate('/shop/admin/login');
                }}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  color: '#4d455e',
                }}
              >
                {t('shopAdminNav.logout')}
              </Button>
            </Box>
          </Container>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ py: 2, px: { xs: 1.5, sm: 2.5 } }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default ShopAdminLayout;
