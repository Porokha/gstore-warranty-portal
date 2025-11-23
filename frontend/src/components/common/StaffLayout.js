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
  Avatar,
  IconButton,
  Badge,
  Menu,
  MenuItem,
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
  CloudUpload as ImportIcon,
  Notifications as NotificationsIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 280;

const StaffLayout = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuAnchor, setUserMenuAnchor] = React.useState(null);

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
    { path: '/staff/cases', label: 'Service Cases', icon: <OpenCasesIcon />, badge: 12 },
    { path: '/staff/warranties', label: t('common.warranties'), icon: <WarrantiesIcon /> },
    { path: '/staff/finance', label: 'Payments', icon: <FinanceIcon /> },
    { path: '/staff/import', label: 'Import Data', icon: <ImportIcon /> },
  ];

  const bottomMenuItems = [
    { path: '/staff/settings', label: t('common.settings'), icon: <SettingsIcon /> },
    { path: '/staff/audit', label: 'Audit Logs', icon: <AuditIcon /> },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* Dark Blue Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#1e293b',
            color: '#ffffff',
            borderRight: 'none',
          },
        }}
      >
        <Toolbar sx={{ bgcolor: '#1e293b', minHeight: '80px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '18px',
              }}
            >
              G
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
              Gstore Portal
            </Typography>
          </Box>
        </Toolbar>
        
        <Box sx={{ overflow: 'auto', flex: 1 }}>
          <List sx={{ px: 2, py: 1 }}>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === '/staff/cases' && location.pathname.startsWith('/staff/cases') && !location.pathname.includes('/closed') && !location.pathname.includes('/import')) ||
                (item.path === '/staff/import' && location.pathname.startsWith('/staff/import'));
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton 
                    component={Link} 
                    to={item.path}
                    selected={isActive}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      '&.Mui-selected': {
                        bgcolor: '#3b82f6',
                        color: '#ffffff',
                        '&:hover': {
                          bgcolor: '#3b82f6',
                        },
                        '& .MuiListItemText-primary': {
                          fontWeight: 600,
                        },
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', color: isActive ? '#ffffff' : '#cbd5e1' }}>
                      {item.icon}
                    </Box>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '14px',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    />
                    {item.badge && (
                      <Badge 
                        badgeContent={item.badge} 
                        color="error"
                        sx={{
                          '& .MuiBadge-badge': {
                            bgcolor: '#ef4444',
                            fontSize: '11px',
                            minWidth: '20px',
                            height: '20px',
                          },
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 2, mx: 2 }} />

          <List sx={{ px: 2, py: 1 }}>
            {bottomMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton 
                    component={Link} 
                    to={item.path}
                    selected={isActive}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      '&.Mui-selected': {
                        bgcolor: '#3b82f6',
                        color: '#ffffff',
                        '&:hover': {
                          bgcolor: '#3b82f6',
                        },
                        '& .MuiListItemText-primary': {
                          fontWeight: 600,
                        },
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', color: isActive ? '#ffffff' : '#cbd5e1' }}>
                      {item.icon}
                    </Box>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '14px',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* User Profile Section */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            bgcolor: '#1e293b',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: '#3b82f6',
                width: 40,
                height: 40,
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {getInitials(user?.name || 'User')}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#ffffff',
                  fontSize: '13px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.name || 'User'} {user?.last_name || ''}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#94a3b8',
                  fontSize: '11px',
                  textTransform: 'capitalize',
                }}
              >
                {user?.role || 'User'}
              </Typography>
            </Box>
            <IconButton
              size="small"
              sx={{ color: '#cbd5e1' }}
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        </Box>

        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={() => setUserMenuAnchor(null)}
        >
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Drawer>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: '#ffffff',
            color: '#1e293b',
            borderBottom: '1px solid #e2e8f0',
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton sx={{ color: '#64748b' }}>
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <IconButton sx={{ color: '#64748b' }}>
                <PersonIcon />
              </IconButton>
              <Button
                variant="outlined"
                size="small"
                onClick={toggleLanguage}
                sx={{
                  minWidth: 'auto',
                  px: 1.5,
                  borderColor: '#e2e8f0',
                  color: '#64748b',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    bgcolor: '#f8fafc',
                  },
                }}
              >
                {i18n.language === 'en' ? 'KA' : 'EN'}
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: '#f5f7fa',
            p: 3,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default StaffLayout;
