import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  Link,
  IconButton,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowForward as ArrowForwardIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import ZevaLogo from '../../components/common/ZevaLogo';

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/staff/dashboard');
    } catch (err) {
      setError(t('login.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f7fa',
        position: 'relative',
        py: 4,
        px: 2,
      }}
    >
      {/* Logo at top */}
      <Box sx={{ mb: 6, textAlign: 'center', width: '100%' }}>
        <ZevaLogo size="large" showSubtitle={true} variant="default" />
      </Box>

      {/* Login Card */}
      <Container maxWidth="sm" sx={{ width: '100%' }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            bgcolor: '#ffffff',
            width: '100%',
            maxWidth: 440,
            mx: 'auto',
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#1e293b',
                mb: 0.5,
                fontSize: '28px',
              }}
            >
              {t('login.welcomeBack')}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#64748b',
                fontSize: '14px',
              }}
            >
              {t('login.signInToAccess')}
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t('login.username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              margin="normal"
              required
              placeholder={t('login.usernamePlaceholder')}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#3b82f6',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3b82f6',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#64748b',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#3b82f6',
                },
                mt: 0,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#64748b', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label={t('login.password')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              margin="normal"
              required
              placeholder={t('login.passwordPlaceholder')}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#3b82f6',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3b82f6',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#64748b',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#3b82f6',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#64748b', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: '#64748b' }}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{
                    color: '#3b82f6',
                    '&.Mui-checked': {
                      color: '#3b82f6',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '14px' }}>
                  {t('login.rememberMe')}
                </Typography>
              }
              sx={{ mt: 1 }}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              endIcon={<ArrowForwardIcon />}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                bgcolor: '#3b82f6',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#2563eb',
                },
              }}
            >
              {loading ? t('login.signingIn') : t('login.signIn')}
            </Button>
          </form>
        </Paper>

        {/* Language Selector - Centered */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, width: '100%' }}>
          <FormControl sx={{ minWidth: 140 }}>
            <Select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              sx={{
                bgcolor: '#ffffff',
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e2e8f0',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3b82f6',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3b82f6',
                },
              }}
              startAdornment={
                <InputAdornment position="start">
                  <LanguageIcon sx={{ color: '#64748b', fontSize: 18, ml: 1 }} />
                </InputAdornment>
              }
            >
              <MenuItem value="en">EN</MenuItem>
              <MenuItem value="ka">KA</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Help Link */}
        <Box sx={{ textAlign: 'center', mt: 3, width: '100%' }}>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '14px' }}>
            {t('login.needHelp')}{' '}
            <Link
              href="#"
              sx={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {t('login.contactSupport')}
            </Link>
          </Typography>
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4, width: '100%' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '12px', display: 'block', mb: 0.5 }}>
            {t('login.staffPortalOnly')}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '12px' }}>
            {t('login.copyright')}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
