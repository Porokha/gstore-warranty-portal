import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Typography,
  Box,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Tabs,
  Tab,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { smsService } from '../../services/smsService';
import { usersService } from '../../services/usersService';
import { useAuth } from '../../contexts/AuthContext';

const SettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const { data: settings, isLoading: settingsLoading } = useQuery('sms-settings', () =>
    smsService.getSettings()
  );

  const { data: templates, isLoading: templatesLoading } = useQuery('sms-templates', () =>
    smsService.getTemplates()
  );

  const { data: users, isLoading: usersLoading } = useQuery('users', () =>
    usersService.getAll()
  );

  const userCreateMutation = useMutation(
    (data) => usersService.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setUserDialogOpen(false);
        setUserForm({
          username: '',
          password: '',
          name: '',
          last_name: '',
          role: 'technician',
          language_preference: 'ka',
        });
        setEditingUser(null);
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Failed to create user');
      },
    }
  );

  const userUpdateMutation = useMutation(
    ({ id, ...data }) => usersService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setUserDialogOpen(false);
        setUserForm({
          username: '',
          password: '',
          name: '',
          last_name: '',
          role: 'technician',
          language_preference: 'ka',
        });
        setEditingUser(null);
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Failed to update user');
      },
    }
  );

  const [localSettings, setLocalSettings] = useState({
    global_enabled: true,
    send_on_warranty_created: true,
    send_on_case_opened: true,
    send_on_status_change: true,
    send_on_offer_created: true,
    send_on_payment_confirmed: true,
    send_on_case_completed: true,
    send_on_sla_due: true,
    send_on_sla_stalled: true,
    send_on_sla_deadline_1day: true,
  });

  const [templateForm, setTemplateForm] = useState({
    key: '',
    language: 'ka',
    template_text: '',
  });

  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    name: '',
    last_name: '',
    role: 'technician',
    language_preference: 'ka',
  });

  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const updateMutation = useMutation(
    (newSettings) => smsService.updateSettings(newSettings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sms-settings');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      },
    }
  );

  const templateMutation = useMutation(
    (data) => {
      if (editingTemplate) {
        return smsService.updateTemplate(data.key, data.language, data.template_text);
      }
      return smsService.createTemplate(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sms-templates');
        setTemplateDialogOpen(false);
        setEditingTemplate(null);
        setTemplateForm({ key: '', language: 'ka', template_text: '' });
      },
    }
  );

  const handleToggle = (key) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(localSettings);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      key: template.key,
      language: template.language,
      template_text: template.template_text,
    });
    setTemplateDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      password: '',
      name: user.name,
      last_name: user.last_name,
      role: user.role,
      language_preference: user.language_pref || user.language_preference || 'ka',
    });
    setUserDialogOpen(true);
  };

  if (user?.role !== 'admin') {
    return (
      <Alert severity="error">
        {t('common.unauthorized') || 'You do not have permission to access this page'}
      </Alert>
    );
  }

  if (settingsLoading || templatesLoading || usersLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('common.settings')}</Typography>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveSuccess(false)}>
          {t('common.settingsSaved') || 'Settings saved successfully'}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} sx={{ mb: 3 }}>
          <Tab label={t('settings.smsNotifications') || 'SMS Notifications'} />
          <Tab label={t('settings.smsTemplates') || 'SMS Templates'} />
          <Tab label={t('settings.userManagement') || 'User Management'} />
          <Tab label={t('settings.apiKeys') || 'API Keys'} />
        </Tabs>

        {/* Tab 1: SMS Settings */}
        {tab === 0 && (
          <Box>
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={updateMutation.isLoading}
              >
                {updateMutation.isLoading ? <CircularProgress size={20} /> : t('common.save')}
              </Button>
            </Box>

            <Typography variant="h6" gutterBottom>
              {t('settings.smsNotifications') || 'SMS Notifications'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('settings.smsNotificationsDescription') ||
                'Control when SMS notifications are automatically sent to customers'}
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Box mb={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.global_enabled}
                    onChange={() => handleToggle('global_enabled')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {t('settings.globalEnable') || 'Enable SMS Notifications'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('settings.globalEnableDescription') ||
                        'Master switch to enable/disable all SMS notifications'}
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              {[
                { key: 'send_on_warranty_created', label: t('settings.sendOnWarrantyCreated') },
                { key: 'send_on_case_opened', label: t('settings.sendOnCaseOpened') },
                { key: 'send_on_status_change', label: t('settings.sendOnStatusChange') },
                { key: 'send_on_offer_created', label: t('settings.sendOnOfferCreated') },
                { key: 'send_on_payment_confirmed', label: t('settings.sendOnPaymentConfirmed') },
                { key: 'send_on_case_completed', label: t('settings.sendOnCaseCompleted') },
                { key: 'send_on_sla_due', label: t('settings.sendOnSlaDue') },
                { key: 'send_on_sla_stalled', label: t('settings.sendOnSlaStalled') },
                { key: 'send_on_sla_deadline_1day', label: t('settings.sendOnSlaDeadline1day') },
              ].map((item) => (
                <Grid item xs={12} md={6} key={item.key}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings[item.key]}
                        onChange={() => handleToggle(item.key)}
                        disabled={!localSettings.global_enabled}
                      />
                    }
                    label={item.label}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Tab 2: SMS Templates */}
        {tab === 1 && (
          <Box>
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingTemplate(null);
                  setTemplateForm({ key: '', language: 'ka', template_text: '' });
                  setTemplateDialogOpen(true);
                }}
              >
                {t('common.createTemplate') || 'Create Template'}
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('template.key') || 'Key'}</TableCell>
                    <TableCell>{t('template.language') || 'Language'}</TableCell>
                    <TableCell>{t('template.text') || 'Template Text'}</TableCell>
                    <TableCell>{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates && templates.length > 0 ? (
                    templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>{template.key}</TableCell>
                        <TableCell>{template.language}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 400 }}>
                            {template.template_text}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        {t('common.noTemplates') || 'No templates found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 3: User Management */}
        {tab === 2 && (
          <Box>
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({
                    username: '',
                    password: '',
                    name: '',
                    last_name: '',
                    role: 'technician',
                    language_preference: 'ka',
                  });
                  setUserDialogOpen(true);
                }}
              >
                {t('common.createUser') || 'Create User'}
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('user.username') || 'Username'}</TableCell>
                    <TableCell>{t('user.name') || 'Name'}</TableCell>
                    <TableCell>{t('user.role') || 'Role'}</TableCell>
                    <TableCell>{t('user.language') || 'Language'}</TableCell>
                    <TableCell>{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users && users.length > 0 ? (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.username}</TableCell>
                        <TableCell>
                          {u.name} {u.last_name}
                        </TableCell>
                        <TableCell>{u.role}</TableCell>
                        <TableCell>{u.language_preference}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleEditUser(u)}>
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        {t('common.noUsers') || 'No users found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 4: API Keys */}
        {tab === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('settings.apiKeys') || 'API Keys Configuration'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
              Configure API keys for WooCommerce, BOG Payment Gateway, and Sender SMS service.
            </Typography>
            <ApiKeysSettings />
          </Box>
        )}
      </Paper>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? t('common.editTemplate') || 'Edit Template' : t('common.createTemplate') || 'Create Template'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('template.key') || 'Key'}
            value={templateForm.key}
            onChange={(e) => setTemplateForm({ ...templateForm, key: e.target.value })}
            margin="normal"
            disabled={!!editingTemplate}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('template.language') || 'Language'}</InputLabel>
            <Select
              value={templateForm.language}
              label={t('template.language') || 'Language'}
              onChange={(e) => setTemplateForm({ ...templateForm, language: e.target.value })}
              disabled={!!editingTemplate}
            >
              <MenuItem value="ka">Georgian (KA)</MenuItem>
              <MenuItem value="en">English (EN)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={6}
            label={t('template.text') || 'Template Text'}
            value={templateForm.template_text}
            onChange={(e) => setTemplateForm({ ...templateForm, template_text: e.target.value })}
            margin="normal"
            helperText={t('template.variablesHint') || 'Use {variable_name} for dynamic values'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={() => templateMutation.mutate(templateForm)}
            disabled={templateMutation.isLoading}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

        {/* Tab 4: API Keys */}
        {tab === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('settings.apiKeys') || 'API Keys Configuration'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
              Configure API keys for WooCommerce, BOG Payment Gateway, and Sender SMS service.
            </Typography>
            <ApiKeysSettings />
          </Box>
        )}
      </Paper>

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? t('common.editUser') || 'Edit User' : t('common.createUser') || 'Create User'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('user.username') || 'Username'}
            value={userForm.username}
            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
            margin="normal"
            disabled={!!editingUser}
            required={!editingUser}
          />
          <TextField
            fullWidth
            type="password"
            label={t('user.password') || 'Password'}
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            margin="normal"
            required={!editingUser}
          />
          <TextField
            fullWidth
            label={t('user.name') || 'Name'}
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label={t('user.lastName') || 'Last Name'}
            value={userForm.last_name}
            onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('user.role') || 'Role'}</InputLabel>
            <Select
              value={userForm.role}
              label={t('user.role') || 'Role'}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="technician">Technician</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('user.language') || 'Language Preference'}</InputLabel>
            <Select
              value={userForm.language_preference}
              label={t('user.language') || 'Language Preference'}
              onChange={(e) => setUserForm({ ...userForm, language_preference: e.target.value })}
            >
              <MenuItem value="ka">Georgian (KA)</MenuItem>
              <MenuItem value="en">English (EN)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (editingUser) {
                userUpdateMutation.mutate({ id: editingUser.id, ...userForm });
              } else {
                userCreateMutation.mutate(userForm);
              }
            }}
            disabled={userCreateMutation.isLoading || userUpdateMutation.isLoading}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
