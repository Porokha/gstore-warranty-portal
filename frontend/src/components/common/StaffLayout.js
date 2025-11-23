import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  FolderOpen as OpenCasesIcon,
  Folder as ClosedCasesIcon,
  VerifiedUser as WarrantiesIcon,
  AccountBalance as FinanceIcon,
  BarChart as StatisticsIcon,
  Settings as SettingsIcon,
  History as AuditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

const StaffLayout = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/staff/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ka' : 'en';
    i18n.changeLanguage(newLang);
  };

  const menuItems = [
    { path: '/staff/dashboard', label: t('common.dashboard'), icon: <DashboardIcon /> },
    { path: '/staff/cases', label: t('common.openCases'), icon: <OpenCasesIcon /> },
    { path: '/staff/cases/closed', label: t('common.closedCases'), icon: <ClosedCasesIcon /> },
    { path: '/staff/warranties', label: t('common.warranties'), icon: <WarrantiesIcon /> },
    { path: '/staff/finance', label: t('common.finance'), icon: <FinanceIcon /> },
    { path: '/staff/statistics', label: t('common.statistics') || 'Statistics', icon: <StatisticsIcon /> },
    { path: '/staff/settings', label: t('common.settings'), icon: <SettingsIcon /> },
    { path: '/staff/audit', label: t('common.audit'), icon: <AuditIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexGrow: 1 }}>
            {/* Top-left buttons above menu */}
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => navigate('/staff/cases/new')}
              sx={{ mr: 1 }}
            >
              {t('common.createCase')}
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => navigate('/staff/warranties/new')}
            >
              {t('common.createWarranty')}
            </Button>
          </Box>
          <Button color="inherit" onClick={toggleLanguage}>
            {i18n.language === 'en' ? 'KA' : 'EN'}
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            {t('common.logout')}
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === '/staff/cases' && location.pathname.startsWith('/staff/cases') && !location.pathname.includes('/closed'));
              return (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton 
                    component={Link} 
                    to={item.path}
                    selected={isActive}
                  >
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                      {item.icon}
                    </Box>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default StaffLayout;

