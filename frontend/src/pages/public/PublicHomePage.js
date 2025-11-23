import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Paper, Container, Tabs, Tab } from '@mui/material';
import {
  VerifiedUser as WarrantyIcon,
  FolderOpen as CaseIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const PublicHomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 70px)',
        bgcolor: '#fcf4e8',
        pt: 6,
        pb: 8,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 400, fontSize: '18px' }}>
            {t('public.checkWarrantyStatus')}
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            bgcolor: '#ffffff',
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              borderBottom: '1px solid #e2e8f0',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '15px',
                minHeight: 64,
                '&.Mui-selected': {
                  color: '#3b82f6',
                },
              },
              '& .MuiTabs-indicator': {
                bgcolor: '#3b82f6',
                height: 3,
              },
            }}
          >
            <Tab
              icon={<WarrantyIcon sx={{ fontSize: 24, mb: 0.5 }} />}
              iconPosition="top"
              label={t('public.searchWarranty')}
              sx={{
                flex: 1,
                '&.Mui-selected': {
                  color: '#3b82f6',
                },
              }}
            />
            <Tab
              icon={<CaseIcon sx={{ fontSize: 24, mb: 0.5 }} />}
              iconPosition="top"
              label={t('public.searchCase')}
              sx={{
                flex: 1,
                '&.Mui-selected': {
                  color: '#10b981',
                },
              }}
            />
          </Tabs>

          <Box sx={{ p: 4 }}>
            {activeTab === 0 && (
              <Box>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    mx: 'auto',
                  }}
                >
                  <WarrantyIcon sx={{ color: '#ffffff', fontSize: 32 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 1, textAlign: 'center' }}>
                  {t('public.searchWarranty')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 3, textAlign: 'center' }}>
                  {t('public.searchWarrantyDescription')}
                </Typography>
                <Button
                  component={Link}
                  to="/search/warranty"
                  variant="contained"
                  fullWidth
                  startIcon={<SearchIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    bgcolor: '#3b82f6',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '15px',
                    '&:hover': {
                      bgcolor: '#2563eb',
                    },
                  }}
                >
                  {t('public.searchWarranty')}
                </Button>
              </Box>
            )}

            {activeTab === 1 && (
              <Box>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    mx: 'auto',
                  }}
                >
                  <CaseIcon sx={{ color: '#ffffff', fontSize: 32 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 1, textAlign: 'center' }}>
                  {t('public.searchCase')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 3, textAlign: 'center' }}>
                  {t('public.searchCaseDescription')}
                </Typography>
                <Button
                  component={Link}
                  to="/search/case"
                  variant="contained"
                  fullWidth
                  startIcon={<SearchIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    bgcolor: '#10b981',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '15px',
                    '&:hover': {
                      bgcolor: '#059669',
                    },
                  }}
                >
                  {t('public.searchCase')}
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PublicHomePage;
