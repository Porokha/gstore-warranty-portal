import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Paper,
  Toolbar,
  Typography,
} from '@mui/material';
import { Inventory2, ReceiptLong } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/shop/admin/products', label: 'Products', icon: <Inventory2 fontSize="small" /> },
  { path: '/shop/admin/orders', label: 'Orders', icon: <ReceiptLong fontSize="small" /> },
];

const ShopAdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayName = [user?.name, user?.last_name].filter(Boolean).join(' ').trim() || user?.username || 'Admin';
  const displayInitial = displayName.charAt(0).toUpperCase() || 'A';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6fb' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255,255,255,0.95)',
          color: '#172033',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #dce4f0',
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
                <Typography sx={{ color: '#667085', fontSize: '13px' }}>
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
                    startIcon={item.icon}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 3,
                      px: 2,
                      color: active ? '#ffffff' : '#26334d',
                      bgcolor: active ? '#172033' : 'transparent',
                      '&:hover': {
                        bgcolor: active ? '#172033' : '#e9eef7',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Paper
                elevation={0}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 3,
                  bgcolor: '#eef3fb',
                  border: '1px solid #dbe4f3',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 2.5,
                    bgcolor: '#172033',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800,
                  }}
                >
                  {displayInitial}
                </Avatar>
                <Typography sx={{ fontSize: '13px', color: '#52607a', lineHeight: 1.1 }}>
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
                  color: '#172033',
                  borderRadius: 3,
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
