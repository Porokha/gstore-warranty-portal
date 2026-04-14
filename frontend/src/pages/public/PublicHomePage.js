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
        background: 'linear-gradient(180deg, #fbf9ff 0%, #f3ecff 100%)',
        pt: 6,
        pb: 8,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h5" sx={{ color: '#18181b', fontWeight: 700, fontSize: '18px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {t('public.checkWarrantyStatus')}
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            boxShadow: '0 28px 90px rgba(63, 30, 120, 0.1)',
            bgcolor: '#ffffff',
            overflow: 'hidden',
            border: '1px solid #e3d7ff',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              borderBottom: '1px solid #efe7ff',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '15px',
                minHeight: 64,
                '&.Mui-selected': {
                  color: '#a576ff',
                },
              },
              '& .MuiTabs-indicator': {
                bgcolor: '#a576ff',
                height: 3,
              },
            }}
            variant="fullWidth"
          >
            <Tab
              icon={<WarrantyIcon sx={{ fontSize: 24, mb: 0.5 }} />}
              iconPosition="top"
              label={t('public.searchWarranty')}
              sx={{
                '&.Mui-selected': {
                  color: '#a576ff',
                },
              }}
            />
            <Tab
              icon={<CaseIcon sx={{ fontSize: 24, mb: 0.5 }} />}
              iconPosition="top"
              label={t('public.searchCase')}
              sx={{
                '&.Mui-selected': {
                  color: '#18181b',
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
                    bgcolor: '#a576ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    mx: 'auto',
                  }}
                >
                  <WarrantyIcon sx={{ color: '#ffffff', fontSize: 32 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#18181b', mb: 1, textAlign: 'center' }}>
                  {t('public.searchWarranty')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#5b5568', mb: 3, textAlign: 'center' }}>
                  {t('public.searchWarrantyDescription')}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    component={Link}
                    to="/search/warranty"
                    variant="contained"
                    startIcon={<SearchIcon />}
                    sx={{
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      bgcolor: '#a576ff',
                      color: '#111111',
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '15px',
                      '&:hover': {
                        bgcolor: '#8f5ef0',
                        color: '#ffffff',
                      },
                    }}
                  >
                    {t('public.searchWarranty')}
                  </Button>
                </Box>
              </Box>
            )}

            {activeTab === 1 && (
              <Box>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: '#18181b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    mx: 'auto',
                  }}
                >
                  <CaseIcon sx={{ color: '#ffffff', fontSize: 32 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#18181b', mb: 1, textAlign: 'center' }}>
                  {t('public.searchCase')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#5b5568', mb: 3, textAlign: 'center' }}>
                  {t('public.searchCaseDescription')}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    component={Link}
                    to="/search/case"
                    variant="contained"
                    startIcon={<SearchIcon />}
                    sx={{
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      bgcolor: '#18181b',
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '15px',
                      '&:hover': {
                        bgcolor: '#a576ff',
                        color: '#111111',
                      },
                    }}
                  >
                    {t('public.searchCase')}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PublicHomePage;
