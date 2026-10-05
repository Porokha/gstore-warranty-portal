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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Badge,
  CircularProgress,
  useMediaQuery,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { usersService } from '../../services/usersService';
import { notificationsService } from '../../services/notificationsService';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { hasFinanceStatisticsAccess, isManagementRole, isTechnicianRole, roleLabel, ROLE } from '../../utils/roles';

const EXPANDED_DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 64;
const navIcon = (name) => `/figma-staff/nav-${name}.svg`;

const StaffLayout = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuAnchor, setUserMenuAnchor] = React.useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = React.useState(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);
  const [passwordForm, setPasswordForm] = React.useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordError, setPasswordError] = React.useState('');
  const [passwordSuccess, setPasswordSuccess] = React.useState('');
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('zezva.sidebar.collapsed') === 'true';
  });
  const isMobile = useMediaQuery('(max-width:920px)');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const drawerWidth = isMobile ? EXPANDED_DRAWER_WIDTH : isCollapsed ? COLLAPSED_DRAWER_WIDTH : EXPANDED_DRAWER_WIDTH;
  const sidebarCollapsed = !isMobile && isCollapsed;
  const mustChangePassword = Boolean(user?.must_change_password);
  const receivesManagerNotifications = [ROLE.MANAGER, ROLE.TECH_MANAGER, ROLE.SUPER_TECHNICIAN].includes(user?.role);
  const queryClient = useQueryClient();

  const { data: unreadNotificationData } = useQuery(
    ['staff-notifications-unread'],
    notificationsService.getUnreadCount,
    {
      enabled: receivesManagerNotifications,
      refetchInterval: 30000,
      refetchOnWindowFocus: true,
    },
  );

  const {
    data: staffNotifications = [],
    isLoading: notificationsLoading,
  } = useQuery(
    ['staff-notifications'],
    notificationsService.getAll,
    {
      enabled: receivesManagerNotifications && Boolean(notificationsAnchor),
      refetchOnWindowFocus: true,
    },
  );

  const markAllNotificationsRead = useMutation(
    notificationsService.markAllRead,
    {
      onSuccess: () => {
        queryClient.setQueryData(['staff-notifications-unread'], { count: 0 });
        queryClient.invalidateQueries(['staff-notifications']);
      },
    },
  );

  React.useEffect(() => {
    if (mustChangePassword) {
      setPasswordDialogOpen(true);
    }
  }, [mustChangePassword]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
      return;
    }
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

  const resetPasswordDialog = () => {
    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const openPasswordDialog = () => {
    resetPasswordDialog();
    setPasswordDialogOpen(true);
    setUserMenuAnchor(null);
  };

  const handlePasswordDialogClose = () => {
    if (mustChangePassword || isChangingPassword) return;
    setPasswordDialogOpen(false);
    resetPasswordDialog();
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!mustChangePassword && !passwordForm.current_password) {
      setPasswordError('Current password is required.');
      return;
    }

    if (!passwordForm.new_password || passwordForm.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New password confirmation does not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const updatedUser = await usersService.changeOwnPassword({
        current_password: mustChangePassword ? undefined : passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      updateUser({ ...updatedUser, must_change_password: false });
      setPasswordSuccess('Password changed successfully.');
      window.setTimeout(() => {
        setPasswordDialogOpen(false);
        resetPasswordDialog();
      }, 650);
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ka' : 'en';
    i18n.changeLanguage(newLang);
  };

  const isAdmin = user?.role === 'admin';
  const hasManagementAccess = isManagementRole(user?.role);
  const canViewFinanceStatistics = hasFinanceStatisticsAccess(user?.role);

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
    if ((unreadNotificationData?.count || 0) > 0) {
      markAllNotificationsRead.mutate();
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read_at) {
      await notificationsService.markRead(notification.id);
    }
    setNotificationsAnchor(null);
    if (notification.case_id) {
      navigate(`/staff/cases/${notification.case_id}`);
    }
  };

  const menuItems = [
    { path: '/staff/dashboard', label: t('common.dashboard'), icon: navIcon('dashboard') },
    ...(isTechnicianRole(user?.role)
      ? [{ path: '/staff/my-cases', label: t('common.myServiceCases') || 'My Service Cases', icon: navIcon('cases') }]
      : []),
    { path: '/staff/cases', label: t('common.serviceCases'), icon: navIcon('cases') },
    { path: '/staff/partners', label: t('common.partners') || 'Partners', icon: navIcon('partners') },
    { path: '/staff/warranties', label: t('common.warranties'), icon: navIcon('warranties') },
    ...(hasManagementAccess
      ? [
          ...(canViewFinanceStatistics
            ? [
                { path: '/staff/finance', label: t('common.finance'), icon: navIcon('finance') },
                { path: '/staff/statistics', label: t('common.statistics') || 'Statistics', icon: navIcon('statistics') },
              ]
            : []),
          ...(isAdmin ? [{ path: '/staff/import', label: t('common.importData'), icon: navIcon('import') }] : []),
        ]
      : []),
  ];

  const bottomMenuItems = isAdmin
    ? [
        { path: '/staff/settings', label: t('common.settings'), icon: navIcon('settings') },
        { path: '/staff/audit', label: t('common.audit'), icon: navIcon('audit') },
      ]
    : [];

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <Box
      className="zzv-staff-shell"
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: '#fbfafe',
        fontFamily: 'var(--font-platform)',
      }}
    >
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileMenuOpen : true}
        onClose={() => setMobileMenuOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isMobile ? 0 : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#14121c',
            color: '#9c97ae',
            borderRight: '1px solid #14121c',
            boxShadow: 'none',
            transition: 'width 0.2s ease',
          },
        }}
      >
        <Toolbar
          sx={{
            bgcolor: '#14121c',
            minHeight: '68px !important',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: sidebarCollapsed ? 1 : 1.5,
            py: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {sidebarCollapsed ? (
              <Box
                component="img"
                src="/brand-logotype-original.svg"
                alt="ZEZVA mini logo"
                sx={{ width: 32, height: 32 }}
              />
            ) : (
              <Box component="img" src="/figma-staff/dashboard-logo.svg" alt="ZEZVA" width={99} height={16} />
            )}
          </Box>
          <IconButton onClick={toggleSidebar} size="small" aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'} sx={{ color: '#9c97ae', width: 36, height: 36, borderRadius: '8px' }}>
            <Box component="img" src="/figma-staff/nav-collapse.svg" alt="" width={20} height={20} sx={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none' }} />
          </IconButton>
        </Toolbar>
        
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            overflow: sidebarCollapsed ? 'hidden' : 'auto',
            flex: 1,
            '&::-webkit-scrollbar': {
              display: sidebarCollapsed ? 'none' : 'auto',
            },
            scrollbarWidth: sidebarCollapsed ? 'none' : 'thin',
          }}
        >
          <List sx={{ px: 1.5, py: 0 }}>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === '/staff/my-cases' && location.pathname.startsWith('/staff/my-cases')) ||
                (item.path === '/staff/cases' && location.pathname.startsWith('/staff/cases') && !location.pathname.includes('/closed') && !location.pathname.includes('/import')) ||
                (item.path === '/staff/import' && location.pathname.startsWith('/staff/import'));
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton 
                    component={Link} 
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    selected={isActive}
                    sx={{
                      height: 40,
                      borderRadius: '8px',
                      py: 0,
                      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                      px: sidebarCollapsed ? 0 : 1.5,
                      '&.Mui-selected': {
                      bgcolor: '#26222f',
                      color: '#ffffff',
                      '&:hover': {
                          bgcolor: '#322c3d',
                        },
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.08)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        mr: sidebarCollapsed ? 0 : 1,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Box component="img" src={item.icon} alt="" width={20} height={20} sx={{ filter: isActive ? 'brightness(0) invert(1)' : 'none' }} />
                    </Box>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '14px',
                        color: isActive ? '#ffffff' : '#9c97ae',
                        fontWeight: isActive ? 600 : 400,
                      }}
                      sx={{
                        opacity: sidebarCollapsed ? 0 : 1,
                        maxWidth: sidebarCollapsed ? 0 : '100%',
                        transition: 'opacity 0.2s ease',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          {bottomMenuItems.length > 0 && (
            <Box sx={{ mt: 'auto', pb: 1.5 }}>
              <Divider sx={{ borderColor: '#26222f', my: 1.5, mx: 1.5 }} />

              <List sx={{ px: 1.5, py: 0 }}>
                {bottomMenuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton 
                        component={Link} 
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        selected={isActive}
                        sx={{
                          height: 40,
                          borderRadius: '8px',
                          py: 0,
                          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                          px: sidebarCollapsed ? 0 : 1.5,
                          '&.Mui-selected': {
                            bgcolor: '#26222f',
                            color: '#ffffff',
                            '&:hover': {
                              bgcolor: '#322c3d',
                            },
                          },
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.08)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            mr: sidebarCollapsed ? 0 : 1,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Box component="img" src={item.icon} alt="" width={20} height={20} sx={{ filter: isActive ? 'brightness(0) invert(1)' : 'none' }} />
                        </Box>
                        <ListItemText 
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: '14px',
                            color: isActive ? '#ffffff' : '#9c97ae',
                            fontWeight: isActive ? 600 : 400,
                          }}
                          sx={{
                            opacity: sidebarCollapsed ? 0 : 1,
                            maxWidth: sidebarCollapsed ? 0 : '100%',
                            transition: 'opacity 0.2s ease',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
        </Box>

      </Drawer>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        {/* Top Header */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: '#ffffff',
            color: '#14121c',
            borderBottom: '1px solid #eae7f2',
            zIndex: (theme) => isMobile ? theme.zIndex.appBar : theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar 
            sx={{ 
              justifyContent: 'space-between', 
              px: 2,
              minHeight: '52px !important',
              overflow: 'hidden',
            }}
          >
            {isMobile ? (
              <IconButton onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation" sx={{ color: '#5b5670' }}>
                <MenuIcon />
              </IconButton>
            ) : <Box sx={{ flexGrow: 1, minWidth: 0 }} />}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                flexShrink: 0,
              }}
            >
              {receivesManagerNotifications && (
                <IconButton
                  sx={{ color: '#5b5670', flexShrink: 0, width: 36, height: 36 }}
                  onClick={handleNotificationsOpen}
                  aria-label={t('notifications.title')}
                >
                  <Badge
                    badgeContent={unreadNotificationData?.count || 0}
                    color="error"
                    max={99}
                  >
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              )}
              <Button
                onClick={(event) => setUserMenuAnchor(event.currentTarget)}
                aria-label={`${user?.name || 'User'} ${user?.last_name || ''} - ${roleLabel(user?.role)}`}
                aria-haspopup="menu"
                aria-expanded={Boolean(userMenuAnchor)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  height: 48,
                  px: 1.5,
                  color: '#14121c',
                  textTransform: 'none',
                  fontSize: 14,
                  '&:hover': { bgcolor: '#f6f4fb' },
                }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#14121c', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                  {getInitials(`${user?.name || 'User'} ${user?.last_name || ''}`)}
                </Avatar>
                {!isMobile && <span>{user?.name || 'User'} {user?.last_name || ''}</span>}
                <Box component="img" src="/figma-staff/profile-chevron.svg" alt="" width={16} height={16} />
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={() => setUserMenuAnchor(null)}
        >
          <MenuItem onClick={openPasswordDialog}>{t('common.accountSettings')}</MenuItem>
          <MenuItem onClick={() => { toggleLanguage(); setUserMenuAnchor(null); }}>
            {i18n.language === 'en' ? 'ქართული' : 'English'}
          </MenuItem>
          <MenuItem onClick={handleLogout}>{t('common.logout')}</MenuItem>
        </Menu>

        <Menu
          anchorEl={notificationsAnchor}
          open={Boolean(notificationsAnchor)}
          onClose={() => setNotificationsAnchor(null)}
          PaperProps={{
            sx: {
              width: 360,
              maxWidth: 'calc(100vw - 24px)',
              maxHeight: 440,
              borderRadius: '8px',
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t('notifications.title')}
            </Typography>
          </Box>
          {notificationsLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!notificationsLoading && staffNotifications.length === 0 && (
            <Typography color="text.secondary" variant="body2" sx={{ p: 2 }}>
              {t('notifications.empty')}
            </Typography>
          )}
          {!notificationsLoading && staffNotifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                display: 'block',
                whiteSpace: 'normal',
                py: 1.25,
                borderBottom: '1px solid #f1f5f9',
                bgcolor: notification.read_at ? '#fff' : 'rgba(165,118,255,0.08)',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: notification.read_at ? 600 : 800 }}>
                {notification.type === 'case_pending'
                  ? t('notifications.casePendingTitle', { caseNumber: notification.case_number })
                  : notification.title}
              </Typography>
              {notification.message && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                  {notification.type === 'case_pending'
                    ? t('notifications.casePendingMessage')
                    : notification.message}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {new Date(notification.created_at).toLocaleString()}
              </Typography>
            </MenuItem>
          ))}
        </Menu>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: '#fbfafe',
            p: { xs: 1.5, md: 2 },
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

      <Dialog
        open={passwordDialogOpen}
        onClose={handlePasswordDialogClose}
        disableEscapeKeyDown={mustChangePassword}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px' } }}
      >
        <DialogTitle>
          {mustChangePassword
            ? (t('user.changePasswordRequired') || 'Change your password')
            : (t('user.changePassword') || 'Change password')}
        </DialogTitle>
        <DialogContent>
          {mustChangePassword && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('user.changePasswordRequiredMessage') || 'Your administrator requires you to change the temporary password before continuing.'}
            </Alert>
          )}
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {Array.isArray(passwordError) ? passwordError.join(', ') : passwordError}
            </Alert>
          )}
          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {passwordSuccess}
            </Alert>
          )}
          {!mustChangePassword && (
            <TextField
              fullWidth
              type="password"
              label={t('user.currentPassword') || 'Current password'}
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))}
              margin="normal"
              autoComplete="current-password"
            />
          )}
          <TextField
            fullWidth
            type="password"
            label={t('user.newPassword') || 'New password'}
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
            margin="normal"
            autoComplete="new-password"
          />
          <TextField
            fullWidth
            type="password"
            label={t('user.confirmPassword') || 'Confirm new password'}
            value={passwordForm.confirm_password}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
            margin="normal"
            autoComplete="new-password"
          />
        </DialogContent>
        <DialogActions>
          {!mustChangePassword && (
            <Button onClick={handlePasswordDialogClose} disabled={isChangingPassword}>
              {t('common.cancel')}
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={isChangingPassword}
          >
            {isChangingPassword ? (t('common.saving') || 'Saving...') : (t('common.save') || 'Save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffLayout;
