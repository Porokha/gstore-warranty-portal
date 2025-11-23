import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Typography, Paper, Container, Grid } from '@mui/material';
import {
  VerifiedUser as WarrantyIcon,
  FolderOpen as CaseIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const PublicHomePage = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f7fa',
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundSize: 'cover',
        pt: 8,
        pb: 8,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 3,
              bgcolor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography variant="h3" sx={{ color: '#3b82f6', fontWeight: 700 }}>
              G
            </Typography>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#ffffff', mb: 2 }}>
            Gstore Warranty Portal
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 400 }}>
            Check your warranty status and service cases
          </Typography>
        </Box>

        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={6} md={5}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                bgcolor: '#ffffff',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
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
                }}
              >
                <WarrantyIcon sx={{ color: '#ffffff', fontSize: 32 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                Search Warranty
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3, flexGrow: 1 }}>
                Find your warranty information by warranty ID and phone number
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
                Search Warranty
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={5}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                bgcolor: '#ffffff',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
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
                }}
              >
                <CaseIcon sx={{ color: '#ffffff', fontSize: 32 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                Search Service Case
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3, flexGrow: 1 }}>
                Track your service case status by case number and phone number
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
                Search Case
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PublicHomePage;
