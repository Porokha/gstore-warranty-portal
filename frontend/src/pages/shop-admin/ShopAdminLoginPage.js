import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Container,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  Lock as LockIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const ShopAdminLoginPage = () => {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);

      if (result.user?.role !== 'admin') {
        logout();
        setError('Only admin users can access the shop admin area.');
        setLoading(false);
        return;
      }

      navigate('/shop/admin/products');
    } catch (err) {
      setError('Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
        background:
          'radial-gradient(circle at top left, rgba(19, 56, 153, 0.18), transparent 32%), linear-gradient(180deg, #eef3fb 0%, #f7f9fc 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: '1px solid #dce4f0',
            boxShadow: '0 30px 80px rgba(14, 23, 38, 0.12)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              component="img"
              src="/brand-logo-horizontal.svg"
              alt="ZEZVA"
              sx={{ width: 180, maxWidth: '100%', height: 'auto', mb: 2 }}
            />
            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#172033' }}>
              Shop Admin Login
            </Typography>
            <Typography sx={{ color: '#667085', mt: 1 }}>
              Hidden URL access for product and order management.
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              margin="normal"
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoFocus
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#667085' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#667085' }} />
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.4,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 800,
                bgcolor: '#172033',
                '&:hover': { bgcolor: '#0f1726' },
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default ShopAdminLoginPage;
