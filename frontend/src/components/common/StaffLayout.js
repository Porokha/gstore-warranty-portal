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
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const EXPANDED_DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 88;

const StaffLayout = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuAnchor, setUserMenuAnchor] = React.useState(null);
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('zezva.sidebar.collapsed') === 'true';
  });
  const drawerWidth = isCollapsed ? COLLAPSED_DRAWER_WIDTH : EXPANDED_DRAWER_WIDTH;

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('zezva.sidebar.collapsed', String(next));
      }
      return next;
    });
  };

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
    { path: '/staff/cases', label: t('common.serviceCases'), icon: <OpenCasesIcon /> },
    { path: '/staff/warranties', label: t('common.warranties'), icon: <WarrantiesIcon /> },
    { path: '/staff/finance', label: t('common.finance'), icon: <FinanceIcon /> },
    { path: '/staff/statistics', label: t('common.statistics') || 'Statistics', icon: <StatisticsIcon /> },
    { path: '/staff/import', label: t('common.importData'), icon: <ImportIcon /> },
  ];

  const bottomMenuItems = [
    { path: '/staff/settings', label: t('common.settings'), icon: <SettingsIcon /> },
    { path: '/staff/audit', label: t('common.audit'), icon: <AuditIcon /> },
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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#fbf9ff' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#0f0f12',
            color: '#f5f3ff',
            borderRight: '1px solid rgba(165, 118, 255, 0.2)',
            transition: 'width 0.2s ease',
          },
        }}
      >
        <Toolbar
          sx={{
            bgcolor: '#0f0f12',
            minHeight: '80px !important',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: isCollapsed ? 1 : 2,
            py: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isCollapsed ? (
              <Box
                component="img"
                src="/brand-logotype-original.svg"
                alt="ZEZVA mini logo"
                sx={{ width: 36, height: 36 }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  component="img"
                  src="/brand-logo-horizontal.svg"
                  alt="ZEZVA logo"
                  sx={{ width: 132, height: 'auto' }}
                />
              </Box>
            )}
          </Box>
          <IconButton onClick={toggleSidebar} size="small" sx={{ color: '#f5f3ff' }}>
            {isCollapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
          </IconButton>
        </Toolbar>
        
        <Box 
          sx={{ 
            overflow: isCollapsed ? 'hidden' : 'auto',
            flex: 1,
            '&::-webkit-scrollbar': {
              display: isCollapsed ? 'none' : 'auto',
            },
            scrollbarWidth: isCollapsed ? 'none' : 'thin',
          }}
        >
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
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      px: isCollapsed ? 1.5 : 2,
                      '&.Mui-selected': {
                      bgcolor: 'rgba(165, 118, 255, 0.18)',
                      color: '#ffffff',
                      '&:hover': {
                          bgcolor: 'rgba(165, 118, 255, 0.28)',
                        },
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.06)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        mr: isCollapsed ? 0 : 2,
                        display: 'flex',
                        alignItems: 'center',
                        color: isActive ? '#ffffff' : '#c8b6ff',
                      }}
                    >
                      {item.icon}
                    </Box>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '14px',
                        fontWeight: isActive ? 600 : 400,
                      }}
                      sx={{
                        opacity: isCollapsed ? 0 : 1,
                        maxWidth: isCollapsed ? 0 : '100%',
                        transition: 'opacity 0.2s ease',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          <Divider sx={{ borderColor: 'rgba(165, 118, 255, 0.18)', my: 2, mx: 2 }} />

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
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    px: isCollapsed ? 1.5 : 2,
                      '&.Mui-selected': {
                      bgcolor: 'rgba(165, 118, 255, 0.18)',
                        color: '#ffffff',
                        '&:hover': {
                        bgcolor: 'rgba(165, 118, 255, 0.28)',
                        },
                      },
                      '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.06)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        mr: isCollapsed ? 0 : 2,
                        display: 'flex',
                        alignItems: 'center',
                        color: isActive ? '#ffffff' : '#c8b6ff',
                      }}
                    >
                      {item.icon}
                    </Box>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '14px',
                        fontWeight: isActive ? 600 : 400,
                      }}
                      sx={{
                        opacity: isCollapsed ? 0 : 1,
                        maxWidth: isCollapsed ? 0 : '100%',
                        transition: 'opacity 0.2s ease',
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
            borderTop: '1px solid #d1d5db',
            bgcolor: '#d1d5db',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: isCollapsed ? 0 : 1.5,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
            }}
          >
            <Avatar
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{
                bgcolor: '#1f2937',
                width: 40,
                height: 40,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {getInitials(user?.name || 'User')}
            </Avatar>
            {!isCollapsed && (
              <>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: '#1f2937',
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
                      color: '#4b5563',
                      fontSize: '11px',
                      textTransform: 'capitalize',
                    }}
                  >
                    {user?.role || 'User'}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  sx={{ color: '#4b5563' }}
                  onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </>
            )}
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
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
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
          <Toolbar 
            sx={{ 
              justifyContent: 'space-between', 
              px: 3,
              minHeight: '64px !important',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden' }} />
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                flexShrink: 0,
              }}
            >
              <IconButton sx={{ color: '#64748b', flexShrink: 0 }}>
                <NotificationsIcon />
              </IconButton>
              <IconButton sx={{ color: '#64748b', flexShrink: 0 }}>
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
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
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
            overflowY: 'auto',
            overflowX: 'hidden',
            width: '100%',
            maxWidth: '100%',
            position: 'relative',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default StaffLayout;
