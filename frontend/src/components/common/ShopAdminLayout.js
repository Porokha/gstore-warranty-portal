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
import { useAuth } from '../../contexts/AuthContext';
import { shopService } from '../../services/shopService';
import { tradeInService } from '../../services/tradeInService';
import LanguageSwitcher from './LanguageSwitcher';

const navItems = [
  { path: '/shop/admin/products', label: 'Products', icon: <Inventory2 fontSize="small" /> },
  { path: '/shop/admin/orders', label: 'Orders', icon: <ReceiptLong fontSize="small" /> },
  { path: '/shop/admin/trade-in', label: 'Trade-in', icon: <CurrencyExchangeRounded fontSize="small" /> },
  { path: '/shop/admin/settings', label: 'Settings', icon: <Settings fontSize="small" /> },
];

const ShopAdminLayout = () => {
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
        bgcolor: '#fbf9ff',
        background:
          'radial-gradient(circle at 8% 0%, rgba(130,76,255,0.11), transparent 28%), linear-gradient(180deg, #ffffff 0%, #fbf9ff 48%, #f3eeff 100%)',
        '& .MuiPaper-root': {
          borderRadius: '20px !important',
        },
        '& .MuiButton-root, & .MuiChip-root, & .MuiOutlinedInput-root, & .MuiAlert-root, & .MuiTabs-root .MuiTab-root': {
          borderRadius: '14px !important',
        },
        '& .MuiAvatar-root': {
          borderRadius: '14px !important',
        },
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255,255,255,0.92)',
          color: '#18171d',
          borderBottom: '1px solid #e6def5',
          backdropFilter: 'blur(18px)',
        }}
      >
        <Toolbar sx={{ minHeight: '72px !important' }}>
          <Container
            maxWidth="xl"
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                component="img"
                src="/brand-logotype-original.svg"
                alt="ZEZVA"
                sx={{ width: 40, height: 40 }}
              />
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '18px', lineHeight: 1.1 }}>
                  Shop Admin
                </Typography>
                <Typography sx={{ color: '#70687e', fontSize: '13px' }}>
                  Products, orders, and catalog controls
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                      fontWeight: 700,
                      px: 2,
                      color: active ? '#ffffff' : '#4d455e',
                      bgcolor: active ? '#18171d' : 'transparent',
                      '&:hover': {
                        bgcolor: active ? '#18171d' : '#f3effb',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <LanguageSwitcher compact />
              <Paper
                elevation={0}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  bgcolor: '#fbfaff',
                  border: '1px solid #e6def5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: '#18171d',
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
                Logout
              </Button>
            </Box>
          </Container>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default ShopAdminLayout;
