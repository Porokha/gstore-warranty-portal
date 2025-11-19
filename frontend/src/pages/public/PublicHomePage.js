import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Typography, Paper } from '@mui/material';

const PublicHomePage = () => {
  return (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      <Typography variant="h3" gutterBottom>
        Gstore Warranty Portal
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Check your warranty status and service cases
      </Typography>
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Paper sx={{ p: 3, minWidth: 200 }}>
          <Typography variant="h6" gutterBottom>
            Search Warranty
          </Typography>
          <Button
            component={Link}
            to="/search/warranty"
            variant="contained"
            fullWidth
          >
            Search
          </Button>
        </Paper>
        <Paper sx={{ p: 3, minWidth: 200 }}>
          <Typography variant="h6" gutterBottom>
            Search Case
          </Typography>
          <Button
            component={Link}
            to="/search/case"
            variant="contained"
            fullWidth
          >
            Search
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default PublicHomePage;

