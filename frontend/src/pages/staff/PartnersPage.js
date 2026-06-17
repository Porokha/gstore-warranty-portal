import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { partnersService } from '../../services/partnersService';

const emptyPartnerForm = {
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  notes: '',
  active: true,
};

const PartnersPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyPartnerForm);
  const [error, setError] = useState('');

  const { data: partners = [], isLoading } = useQuery(
    ['partners', search],
    () => partnersService.getAll({ search }),
    { keepPreviousData: true },
  );

  const createMutation = useMutation((payload) => partnersService.create(payload), {
    onSuccess: () => {
      queryClient.invalidateQueries('partners');
      setDialogOpen(false);
      setFormData(emptyPartnerForm);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || t('partners.createFailed') || 'Failed to create partner');
    },
  });

  const totals = partners.reduce(
    (acc, partner) => {
      acc.total += Number(partner.total_cases || 0);
      acc.active += Number(partner.active_cases || 0);
      acc.completed += Number(partner.completed_cases || 0);
      return acc;
    },
    { total: 0, active: 0, completed: 0 },
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError(t('partners.nameRequired') || 'Partner name is required');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      contact_person: formData.contact_person.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      active: formData.active,
    };

    createMutation.mutate(payload);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4">{t('partners.title') || 'Partners'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('partners.subtitle') || 'Manage partner service cases and partner contacts.'}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            {t('partners.newPartner') || 'New Partner'}
          </Button>
        </Stack>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="overline">{t('partners.totalCases') || 'Total cases'}</Typography>
                <Typography variant="h4">{totals.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="overline">{t('partners.activeCases') || 'Active cases'}</Typography>
                <Typography variant="h4">{totals.active}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="overline">{t('partners.completedCases') || 'Completed cases'}</Typography>
                <Typography variant="h4">{totals.completed}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            label={t('partners.search') || 'Search partners'}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('partners.partner') || 'Partner'}</TableCell>
                <TableCell>{t('partners.contact') || 'Contact'}</TableCell>
                <TableCell>{t('partners.phone') || 'Phone'}</TableCell>
                <TableCell align="right">{t('partners.totalCases') || 'Total cases'}</TableCell>
                <TableCell align="right">{t('partners.activeCases') || 'Active cases'}</TableCell>
                <TableCell align="right">{t('partners.completedCases') || 'Completed cases'}</TableCell>
                <TableCell>{t('partners.lastCase') || 'Last case'}</TableCell>
                <TableCell>{t('common.status') || 'Status'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : partners.length ? (
                partners.map((partner) => (
                  <TableRow key={partner.id} hover>
                    <TableCell>
                      <Typography fontWeight={700}>{partner.name}</Typography>
                      {partner.email && (
                        <Typography variant="caption" color="text.secondary">
                          {partner.email}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{partner.contact_person || '-'}</TableCell>
                    <TableCell>{partner.phone || '-'}</TableCell>
                    <TableCell align="right">{partner.total_cases || 0}</TableCell>
                    <TableCell align="right">{partner.active_cases || 0}</TableCell>
                    <TableCell align="right">{partner.completed_cases || 0}</TableCell>
                    <TableCell>
                      {partner.last_case_at
                        ? new Date(partner.last_case_at).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={partner.active ? 'success' : 'default'}
                        label={partner.active ? (t('common.active') || 'Active') : (t('common.inactive') || 'Inactive')}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {t('partners.noPartners') || 'No partners found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>{t('partners.newPartner') || 'New Partner'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              fullWidth
              required
              label={t('partners.name') || 'Partner name'}
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label={t('partners.contactPerson') || 'Contact person'}
              value={formData.contact_person}
              onChange={(event) => setFormData((prev) => ({ ...prev, contact_person: event.target.value }))}
              margin="normal"
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('partners.phone') || 'Phone'}
                  value={formData.phone}
                  onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="email"
                  label={t('partners.email') || 'Email'}
                  value={formData.email}
                  onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                  margin="normal"
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label={t('partners.notes') || 'Notes'}
              value={formData.notes}
              onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
              margin="normal"
            />
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
              <Switch
                checked={formData.active}
                onChange={(event) => setFormData((prev) => ({ ...prev, active: event.target.checked }))}
              />
              <Typography>{t('common.active') || 'Active'}</Typography>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={createMutation.isLoading}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={createMutation.isLoading}>
            {createMutation.isLoading ? <CircularProgress size={20} /> : (t('common.create') || 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PartnersPage;
