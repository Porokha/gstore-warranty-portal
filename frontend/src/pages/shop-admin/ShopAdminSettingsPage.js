import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Paper, Switch, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { shopService } from '../../services/shopService';

const ShopAdminSettingsPage = () => {
  const queryClient = useQueryClient();
  const [publicMaintenanceEnabled, setPublicMaintenanceEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery(['shop-admin-settings'], () => shopService.getAdminSettings(), {
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (data) {
      setPublicMaintenanceEnabled(Boolean(data.enabled));
    }
  }, [data]);

  const updateMutation = useMutation(
    (payload) => shopService.updateAdminSettings(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['shop-admin-settings']);
        queryClient.invalidateQueries(['public-flags']);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 3000);
      },
    },
  );

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '28px', color: '#172033', mb: 0.5 }}>
          Settings
        </Typography>
        <Typography sx={{ color: '#667085', fontSize: '14px' }}>
          Control public storefront availability and maintenance state.
        </Typography>
      </Box>

      {saved ? <Alert severity="success">Settings saved successfully.</Alert> : null}

      <Paper
        elevation={0}
        sx={{
          p: 3,
          display: 'grid',
          gap: 2,
          border: '1px solid #dbe4f3',
          background: '#ffffff',
        }}
      >
        <Box sx={{ display: 'grid', gap: 0.5 }}>
          <Typography sx={{ fontSize: '20px', fontWeight: 800, color: '#172033' }}>
            Public Maintenance Mode
          </Typography>
          <Typography sx={{ color: '#667085', fontSize: '14px', maxWidth: 680 }}>
            When enabled, visitors see the maintenance page on public routes while staff, shop admin,
            and preview access remain available.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            p: 2,
            borderRadius: '20px',
            border: '1px solid #e5eaf3',
            background: publicMaintenanceEnabled ? '#fff6f6' : '#f7fafc',
          }}
        >
          <Box sx={{ display: 'grid', gap: 0.4 }}>
            <Typography sx={{ fontWeight: 700, color: '#172033' }}>
              {publicMaintenanceEnabled ? 'Enabled' : 'Disabled'}
            </Typography>
            <Typography sx={{ color: '#667085', fontSize: '13px' }}>
              {publicMaintenanceEnabled
                ? 'Public users are currently redirected to maintenance mode.'
                : 'Public pages are currently visible to visitors.'}
            </Typography>
          </Box>
          <Switch
            checked={publicMaintenanceEnabled}
            onChange={(event) => setPublicMaintenanceEnabled(event.target.checked)}
            disabled={isLoading || updateMutation.isLoading}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={() => updateMutation.mutate({ enabled: publicMaintenanceEnabled })}
            disabled={isLoading || updateMutation.isLoading}
            sx={{
              minWidth: 160,
              color: '#fff !important',
            }}
          >
            {updateMutation.isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ShopAdminSettingsPage;
