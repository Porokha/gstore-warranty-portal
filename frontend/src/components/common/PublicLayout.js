import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, Container, AppBar, Toolbar, Typography } from '@mui/material';

const PublicLayout = () => {
  const navigate = useNavigate();
  
  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 }
            }}
            onClick={() => navigate('/')}
          >
            Gstore Warranty Portal
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default PublicLayout;

