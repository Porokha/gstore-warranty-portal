import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import StaffLayout from './components/common/StaffLayout';
import PublicLayout from './components/common/PublicLayout';
import LoginPage from './pages/staff/LoginPage';
import DashboardPage from './pages/staff/DashboardPage';
import CasesPage from './pages/staff/CasesPage';
import ClosedCasesPage from './pages/staff/ClosedCasesPage';
import CaseDetailPage from './pages/staff/CaseDetailPage';
import CreateCasePage from './pages/staff/CreateCasePage';
import WarrantiesPage from './pages/staff/WarrantiesPage';
import WarrantyDetailPage from './pages/staff/WarrantyDetailPage';
import WarrantyEditPage from './pages/staff/WarrantyEditPage';
import CreateWarrantyPage from './pages/staff/CreateWarrantyPage';
import FinancePage from './pages/staff/FinancePage';
import SettingsPage from './pages/staff/SettingsPage';
import AuditPage from './pages/staff/AuditPage';
import StatisticsPage from './pages/staff/StatisticsPage';
import ImportPage from './pages/staff/ImportPage';
import PublicHomePage from './pages/public/PublicHomePage';
import WarrantySearchPage from './pages/public/WarrantySearchPage';
import CaseSearchPage from './pages/public/CaseSearchPage';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    primary: {
      main: '#A576FF',
      light: '#D4BEFE',
      dark: '#8F5EF0',
      contrastText: '#111111',
    },
    secondary: {
      main: '#000000',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FBF9FF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#18181B',
      secondary: '#5B5568',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<PublicHomePage />} />
                <Route path="search/warranty" element={<WarrantySearchPage />} />
                <Route path="search/case" element={<CaseSearchPage />} />
              </Route>

              {/* Staff Routes */}
              <Route path="/staff/login" element={<LoginPage />} />
              <Route path="/staff" element={<PrivateRoute />}>
                <Route element={<StaffLayout />}>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="cases" element={<CasesPage />} />
                  <Route path="cases/closed" element={<ClosedCasesPage />} />
                  <Route path="cases/new" element={<CreateCasePage />} />
                  <Route path="cases/:id" element={<CaseDetailPage />} />
                  <Route path="warranties" element={<WarrantiesPage />} />
                  <Route path="warranties/:id" element={<WarrantyDetailPage />} />
                  <Route path="warranties/:id/edit" element={<WarrantyEditPage />} />
                  <Route path="warranties/new" element={<CreateWarrantyPage />} />
                  <Route path="import" element={<ImportPage />} />
                  <Route path="finance" element={<FinancePage />} />
                  <Route path="statistics" element={<StatisticsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="audit" element={<AuditPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
