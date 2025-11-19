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
import WarrantiesPage from './pages/staff/WarrantiesPage';
import SettingsPage from './pages/staff/SettingsPage';
import PublicHomePage from './pages/public/PublicHomePage';
import WarrantySearchPage from './pages/public/WarrantySearchPage';
import CaseSearchPage from './pages/public/CaseSearchPage';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
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
              <Route path="/staff" element={<PrivateRoute />}>
                <Route path="login" element={<LoginPage />} />
                <Route element={<StaffLayout />}>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="cases" element={<CasesPage />} />
                  <Route path="warranties" element={<WarrantiesPage />} />
                  <Route path="settings" element={<SettingsPage />} />
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

